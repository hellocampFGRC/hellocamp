import time
import random
import re
import os
import json
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import urllib.parse

# ==========================================
# CONFIGURAÇÕES DO SNIPER
# ==========================================
ARQUIVO_JSON = "db_juvigo_purificado_v3.json" # O TEU FICHEIRO ATUAL ONDE ESTÃO ESTES CASOS
ARQUIVO_CSV_FINAL = "Leads_Sniper_HelloCamp.csv" 

TERMOS_ESTADO = ['cm-', 'jf-', 'municipio', 'freguesia', 'gov.pt', 'camara', 'junta']
AGREGADORES = ['juvigo', 'pumpkin', 'coloniasdeferias', 'estrelaseouricos', 'odisseias', 'lifecooler', 'youtube', 'facebook', 'instagram', 'booking', 'airbnb', 'tripadvisor']

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

def espera(minimo=3, maximo=6):
    time.sleep(random.uniform(minimo, maximo))

def is_b2b_valido(texto):
    if not texto: return False
    txt_low = texto.lower()
    if any(lixo in txt_low for lixo in TERMOS_ESTADO + AGREGADORES): return False
    if "example.com" in txt_low or "sentry.io" in txt_low or ".png" in txt_low: return False
    return True

def extrair_emails(texto, html):
    e1 = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    e2 = re.findall(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', html)
    return list(set([e.lower() for e in e1 + e2 if is_b2b_valido(e)]))

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones if len(t.strip()) >= 9]))

def limpar_query_sniper(nome_original, localizacao):
    """Remove gordura de SEO da Juvigo e adapta a língua da pesquisa"""
    
    # Lista de palavras de marketing a remover
    remover = [
        "Campo de férias", "Colónia de férias", "Não Residencial", "perto de", 
        "para aprender", "Viagem de Jovens", "Primavera", "Verão", "Outono", "Inverno",
        "Curso de", "em", "para jovens", "Alto Rendimento", "Natura", "Sailing no", 
        "18+", "16+", "14-17 anos", "dos", "aos"
    ]
    
    nome_limpo = nome_original
    for r in remover:
        # Remove ignorando maiúsculas/minúsculas
        nome_limpo = re.sub(rf'(?i)\b{r}\b', '', nome_limpo)
    
    # Limpar parênteses da localização
    loc_limpa = localizacao.split('(')[0].strip()
    
    # Limpar espaços duplos
    nome_limpo = " ".join(nome_limpo.split())
    
    # ADAPTAÇÃO DE LÍNGUA
    if "Espanha" in localizacao:
        # Se for Espanha, usamos termos espanhóis e omitimos "Portugal"
        query = f'{nome_limpo} {loc_limpa} campamento contacto correo'
    else:
        # Se for Portugal, usamos termos normais
        query = f'{nome_limpo} {loc_limpa} portugal contactos email'
        
    # Casos Especiais Conhecidos (Franchises)
    if "Real Madrid" in nome_original:
        query = f'Fundación Real Madrid Clinics {loc_limpa} portugal contactos email'
        
    return query

# ==========================================
# MOTOR DO SNIPER
# ==========================================
def iniciar_sniper():
    print("🎯 A INICIAR MODO SNIPER (Pente Fino nos Casos Difíceis)...")
    
    if not os.path.exists(ARQUIVO_JSON):
        print(f"❌ ERRO: Ficheiro {ARQUIVO_JSON} não encontrado!")
        return

    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        lista_campos = json.load(f)

    emails_unicos = set([c["Email_Oficial"].lower() for c in lista_campos if c.get("Email_Oficial")])

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    pausa_inicial = False

    for i, dados in enumerate(lista_campos):
        status = dados.get("Status_Pesquisa", "")
        
        # O Sniper SÓ ataca os que falharam (SEM_EMAIL, FALHOU_SITE, etc)
        if status == "COMPLETO" or "BÓNUS" in dados["Nome_Campo"]:
            continue

        nome_campo = dados["Nome_Campo"]
        loc = dados.get("Localizacao", "")
        
        query_inteligente = limpar_query_sniper(nome_campo, loc)
        
        print(f"\n[{i+1}/{len(lista_campos)}] 🎯 ALVO: {nome_campo}")
        print(f"   🧠 Query Injetada: '{query_inteligente}'")
        
        try:
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query_inteligente)}")
            
            if not pausa_inicial:
                print("\n🛑 PAUSA HUMANA: Aceita os Cookies do Google!")
                input("👉 Pressiona [ENTER]: ")
                pausa_inicial = True
                
            espera(3, 5)
            
            # Tentar apanhar do Knowledge Graph / Snippets do Google logo de cara
            txt_google = driver.find_element(By.TAG_NAME, "body").text
            emails_g = extrair_emails(txt_google, "")
            
            if emails_g and emails_g[0] not in emails_unicos:
                print(f"   🪄 BINGO NO GOOGLE: {emails_g[0]}")
                dados["Email_Oficial"] = emails_g[0]
                dados["Status_Pesquisa"] = "COMPLETO"
                emails_unicos.add(emails_g[0])
                continue # Resolvido, passa ao próximo
            
            # Se não, entra nos sites
            resultados_js = driver.execute_script("""
                var items = [];
                var a_tags = document.querySelectorAll('div.g a');
                for (var i = 0; i < a_tags.length; i++) if(a_tags[i].href) items.push(a_tags[i].href);
                return items;
            """)
            
            resolvido = False
            for res_link in resultados_js[:4]: # Tenta os primeiros 4 links úteis
                if not is_b2b_valido(res_link): continue 
                
                print(f"   🌐 A explorar: {res_link[:50]}...")
                
                try:
                    driver.get(res_link)
                    espera(4, 6) 
                    
                    driver.execute_script("""
                        const b = Array.from(document.querySelectorAll('button, a')).find(x => ['aceitar', 'accept', 'concordo', 'aceptar', 'entendido'].includes(x.innerText.toLowerCase()));
                        if(b) b.click();
                    """)
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    
                    t1_vis = driver.find_element(By.TAG_NAME, "body").text
                    t1_html = driver.page_source
                    emails_site = extrair_emails(t1_vis, t1_html)
                    
                    e_validos = [e for e in emails_site if e not in emails_unicos]
                    
                    if not e_validos:
                        # Em espanhol, contactos pode ser "contacto"
                        links = driver.find_elements(By.TAG_NAME, "a")
                        for a in links:
                            if a.text.lower().strip() in ['contactos', 'contact', 'contacto', 'fale connosco', 'info']:
                                driver.get(a.get_attribute('href'))
                                espera(3, 5)
                                t2_vis = driver.find_element(By.TAG_NAME, "body").text
                                t2_html = driver.page_source
                                e_validos = [e for e in extrair_emails(t2_vis, t2_html) if e not in emails_unicos]
                                break
                    
                    if e_validos:
                        print(f"   🎯 BINGO SNIPER! {e_validos[0]}")
                        dados["Email_Oficial"] = e_validos[0]
                        dados["Site_Oficial"] = res_link
                        dados["Telefone"] = extrair_telefones(t1_vis)[0] if extrair_telefones(t1_vis) else ""
                        dados["Status_Pesquisa"] = "COMPLETO"
                        emails_unicos.add(e_validos[0])
                        resolvido = True
                        break 
                        
                except Exception:
                    continue
            
            if not resolvido:
                print("   ❌ O alvo escapou ao Sniper.")
                
        except Exception:
            print("   ❌ Erro Google.")

        with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
            json.dump(lista_campos, f, indent=4, ensure_ascii=False)
            
        # Grava CSV
        df = pd.DataFrame(lista_campos)
        df.to_csv(ARQUIVO_CSV_FINAL, index=False, quoting=1)

    driver.quit()
    print("\n🏁 MISSÃO SNIPER CONCLUÍDA!")

if __name__ == "__main__":
    iniciar_sniper()