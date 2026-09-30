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
# CONFIGURAÇÕES DO PURIFICADOR AVANÇADO
# ==========================================
ARQUIVO_JSON_ORIGINAL = "db_juvigo_assalto_v10.json" 
ARQUIVO_JSON_PURIFICADO = "db_juvigo_purificado_v3.json" # V3 para nova execução limpa
ARQUIVO_CSV_FINAL = "Leads_Independentes_HelloCamp.csv" 

TERMOS_ESTADO = ['cm-', 'jf-', 'municipio', 'freguesia', 'gov.pt', 'camara', 'junta', 'ipdj']
AGREGADORES = ['juvigo', 'pumpkin', 'coloniasdeferias', 'estrelaseouricos', 'odisseias', 'lifecooler', 'youtube', 'facebook', 'instagram', 'booking', 'airbnb', 'tripadvisor', 'sapo', 'timeout']

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

def espera(minimo=2, maximo=5):
    time.sleep(random.uniform(minimo, maximo))

def is_b2b_valido(texto):
    if not texto: return False
    txt_low = texto.lower()
    if any(lixo in txt_low for lixo in TERMOS_ESTADO): return False
    if any(lixo in txt_low for lixo in AGREGADORES): return False
    if "example.com" in txt_low or "sentry.io" in txt_low or ".png" in txt_low or ".jpg" in txt_low: return False
    return True

def extrair_emails_avancado(texto_visivel, codigo_html):
    # 1. Procura emails normais escritos no texto
    emails_texto = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto_visivel)
    # 2. Procura emails escondidos nos links "mailto:" do Footer/Header
    emails_html = re.findall(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', codigo_html)
    
    todos_emails = emails_texto + emails_html
    return list(set([e.lower() for e in todos_emails if is_b2b_valido(e)]))

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones if len(t.strip()) >= 9]))

def atualizar_excel(dados_lista):
    if not dados_lista: return
    df = pd.DataFrame(dados_lista)
    colunas = ['Nome_Campo', 'Localizacao', 'Site_Oficial', 'Email_Oficial', 'Telefone', 'Status_Pesquisa']
    for col in colunas:
        if col not in df.columns: df[col] = ""
    df.sort_values(by=['Status_Pesquisa', 'Localizacao'], inplace=True)
    df[colunas].to_csv(ARQUIVO_CSV_FINAL, index=False, quoting=1)

# ==========================================
# MOTOR DO PURIFICADOR
# ==========================================
def iniciar_purificacao():
    print("🧹 A INICIAR A PURIFICAÇÃO (PESQUISA HTML PROFUNDA)...")
    
    ficheiro_leitura = ARQUIVO_JSON_PURIFICADO if os.path.exists(ARQUIVO_JSON_PURIFICADO) else ARQUIVO_JSON_ORIGINAL
    
    if not os.path.exists(ficheiro_leitura):
        print(f"❌ ERRO: Ficheiro {ficheiro_leitura} não encontrado!")
        return

    with open(ficheiro_leitura, 'r', encoding='utf-8') as f:
        lista_campos = json.load(f)

    emails_aprovados_unicos = set()
    for c in lista_campos:
        e = c.get("Email_Oficial", "").lower()
        if e and is_b2b_valido(e): emails_aprovados_unicos.add(e)

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    pausa_inicial = False

    for i, dados in enumerate(lista_campos):
        nome_campo = dados["Nome_Campo"]
        email_atual = dados.get("Email_Oficial", "").lower()
        status_atual = dados.get("Status_Pesquisa", "")
        
        # Ignorar o que já está perfeito e único
        if status_atual == "COMPLETO" and email_atual in emails_aprovados_unicos and is_b2b_valido(dados.get("Site_Oficial", "")):
            print(f"[{i+1}/{len(lista_campos)}] ✅ APROVADO (Já processado): {nome_campo[:30]}...")
            continue

        loc_pesquisa = dados.get("Localizacao", "").split('(')[0].strip()
        if loc_pesquisa == "Portugal" or len(loc_pesquisa) > 30: loc_pesquisa = ""
        nome_pesquisa = nome_campo.replace("🔥 BÓNUS PURIFICADO:", "").replace("🔥 BÓNUS: Concorrente Local", "").replace("()", "").strip()

        print(f"\n[{i+1}/{len(lista_campos)}] ♻️ A PESQUISAR: {nome_pesquisa} | {loc_pesquisa}")
        
        query = f'{nome_pesquisa} {loc_pesquisa} portugal -camara -municipio -freguesia -juvigo -pumpkin -coloniasdeferias'
        
        try:
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query)}")
            
            if not pausa_inicial:
                print("\n🛑 PAUSA HUMANA: Aceita os Cookies do Google e pressiona ENTER no terminal!")
                input("👉 Pressiona [ENTER]: ")
                pausa_inicial = True
                
            espera(3, 5)
            
            resultados_js = driver.execute_script("""
                var items = [];
                var a_tags = document.querySelectorAll('div.g a');
                for (var i = 0; i < a_tags.length; i++) if(a_tags[i].href) items.push(a_tags[i].href);
                return items;
            """)
            
            sucesso_nesta_lead = False
            
            # Vai entrar em TODOS os links do Google que parecerem privados
            for res_link in resultados_js:
                if not is_b2b_valido(res_link): continue 
                
                print(f"   🌐 A analisar site privado: {res_link[:50]}...")
                
                try:
                    driver.get(res_link)
                    espera(4, 6) # Dar tempo de carregar scripts dinâmicos
                    
                    # Remover popups de cookies que bloqueiam a visão
                    driver.execute_script("""
                        const b = Array.from(document.querySelectorAll('button, a')).find(x => ['aceitar', 'accept', 'concordo', 'got it'].includes(x.innerText.toLowerCase()));
                        if(b) b.click();
                    """)
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    espera(1, 2)
                    
                    # A LEITURA DUPLA: Visível e HTML
                    texto_visivel = driver.find_element(By.TAG_NAME, "body").text
                    codigo_html = driver.page_source
                    
                    emails_site = extrair_emails_avancado(texto_visivel, codigo_html)
                    telefones_site = extrair_telefones(texto_visivel)
                    
                    emails_validos = [e for e in emails_site if e not in emails_aprovados_unicos]
                    
                    # Se não encontrou, procura exaustivamente as páginas de contactos/info
                    if not emails_validos:
                        links = driver.find_elements(By.TAG_NAME, "a")
                        link_contacto = None
                        
                        # Verifica o texto do link e o URL do link
                        for a in links:
                            try:
                                href = a.get_attribute('href')
                                txt = a.text.lower()
                                if href and any(word in href.lower() or word in txt for word in ['contact', 'contat', 'fale', 'sobre', 'info', 'inform']):
                                    link_contacto = href
                                    break
                            except: pass
                            
                        if link_contacto:
                            print(f"      🕵️‍♂️ A investigar sub-página: {link_contacto[:40]}...")
                            driver.get(link_contacto)
                            espera(3, 5)
                            
                            t2_visivel = driver.find_element(By.TAG_NAME, "body").text
                            t2_html = driver.page_source
                            
                            e2 = extrair_emails_avancado(t2_visivel, t2_html)
                            emails_validos = [e for e in e2 if e not in emails_aprovados_unicos]
                            if emails_validos: telefones_site = list(set(telefones_site + extrair_telefones(t2_visivel)))
                    
                    if emails_validos:
                        novo_email = emails_validos[0]
                        emails_aprovados_unicos.add(novo_email)
                        
                        if not sucesso_nesta_lead:
                            print(f"   🎯 BINGO PRINCIPAL! Capturado: {novo_email}")
                            dados["Email_Oficial"] = novo_email
                            dados["Site_Oficial"] = res_link
                            dados["Telefone"] = telefones_site[0] if telefones_site else ""
                            dados["Status_Pesquisa"] = "COMPLETO"
                            sucesso_nesta_lead = True
                        else:
                            print(f"   🔥 BÓNUS EXTRA! Outra empresa detetada: {novo_email}")
                            nova_lead_bonus = {
                                "Nome_Campo": f"🔥 BÓNUS: Concorrente ({loc_pesquisa})",
                                "Localizacao": loc_pesquisa,
                                "Site_Oficial": res_link,
                                "Email_Oficial": novo_email,
                                "Telefone": telefones_site[0] if telefones_site else "", 
                                "Status_Pesquisa": "COMPLETO"
                            }
                            lista_campos.append(nova_lead_bonus)
                            
                    else:
                        print("      ⚠️ Site verificado, mas sem emails expostos.")
                        
                except Exception as e:
                    print("      ❌ Falha ao processar a página deste site.")
                    continue
            
            if not sucesso_nesta_lead:
                print("   ❌ Esgotámos o Google para este termo sem encontrar emails.")
                dados["Status_Pesquisa"] = "SEM_RESULTADOS_VALIDOS"
                
        except Exception:
            print("   ❌ Erro de navegação com o Google.")
            dados["Status_Pesquisa"] = "FALHOU_GOOGLE"

        with open(ARQUIVO_JSON_PURIFICADO, 'w', encoding='utf-8') as f:
            json.dump(lista_campos, f, indent=4, ensure_ascii=False)
        atualizar_excel(lista_campos)

    driver.quit()
    print("\n🏁 OPERAÇÃO CONCLUÍDA! O ficheiro Excel foi atualizado com precisão máxima.")

if __name__ == "__main__":
    iniciar_purificacao()