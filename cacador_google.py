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
# CONFIGURAÇÕES DA CAÇADA IMPLACÁVEL
# ==========================================
ARQUIVO_JSON_CAMPOS = "db_juvigo_assalto_v10.json" # Mantemos o teu ficheiro atual!
ARQUIVO_CSV_FINAL = "Leads_Oficiais_HelloCamp.csv"

EMAILS_LIXO = ['contacto@juvigo.pt', 'info@juvigo.pt', 'info@pumpkin.pt', 'geral@pumpkin.pt', 'info@coloniasdeferias.pt', 'sentry.io', 'wixpress.com', 'example.com', '.png', '.jpg', '.jpeg', '.gif', '.webp', '@youtube.com', '@facebook.com', '@instagram.com']
BLACKLIST_SITES = ['juvigo.', 'pumpkin.pt', 'coloniasdeferias.pt', 'youtube.', 'instagram.', 'facebook.', 'tiktok.', 'booking.', 'airbnb.', 'tripadvisor.', 'cm-', 'uf-', 'gov.pt', 'wikipedia.']

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36") # Novo disfarce

def espera(minimo=3, maximo=6): # Tempos alargados para garantir que os sites carregam e não falham!
    time.sleep(random.uniform(minimo, maximo))

def url_valido(url):
    if not url or not url.startswith('http'): return False
    low_url = url.lower()
    return not any(lixo in low_url for lixo in BLACKLIST_SITES)

def extrair_emails(texto):
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    return list(set([e.lower() for e in emails if not any(bad in e.lower() for bad in EMAILS_LIXO)]))

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
# O MOTOR DO CAÇADOR (MODO REPESCAGEM ABSOLUTA)
# ==========================================
def iniciar_cacada():
    print("🕵️‍♂️ A INICIAR A CAÇADA B2B (REPESCAGEM E ARRASTÃO)...")
    
    if not os.path.exists(ARQUIVO_JSON_CAMPOS):
        print(f"❌ ERRO: Ficheiro {ARQUIVO_JSON_CAMPOS} não encontrado!")
        return

    with open(ARQUIVO_JSON_CAMPOS, 'r', encoding='utf-8') as f:
        lista_campos = json.load(f)
    
    emails_globais_vistos = set()
    for c in lista_campos:
        if c.get("Email_Oficial"):
            emails_globais_vistos.add(c["Email_Oficial"].lower())

    print(f"📂 Carregados {len(lista_campos)} alvos na memória.")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    pausa_inicial = False

    for i, dados in enumerate(lista_campos):
        status_atual = dados.get("Status_Pesquisa", "")
        nome_campo = dados["Nome_Campo"]
        
        # A MAGIA ESTÁ AQUI: Ignora APENAS os que já estão COMPLETO.
        # Vai atacar de novo os FALHOU_SITE, SEM_EMAIL e BÓNUS ARRASTÃO sem piedade!
        if status_atual == "COMPLETO":
            print(f"[{i+1}/{len(lista_campos)}] ⏭️ IGNORADO (Já caçado com sucesso): {nome_campo[:35]}...")
            continue
            
        loc_pesquisa = dados.get("Localizacao", "").split('(')[0].strip()
        if loc_pesquisa == "Portugal" or len(loc_pesquisa) > 30:
            loc_pesquisa = ""
            
        # Se for um Bónus Arrastão, vamos limpar o título antes de o atirar ao Google
        nome_pesquisa = nome_campo.replace("🔥 BÓNUS: Concorrente Local", "").replace("()", "").strip()
            
        print(f"\n[{i+1}/{len(lista_campos)}] 🔎 RE-ATACAR: {nome_pesquisa} | {loc_pesquisa}")
        
        # A query está focada em encontrar o site
        query = f'{nome_pesquisa} {loc_pesquisa} portugal contactos email'
        
        try:
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query)}")
            
            if not pausa_inicial:
                print("\n🛑 PAUSA HUMANA: Vai à janela do Chrome e aceita os Cookies do Google!")
                input("👉 Pressiona [ENTER] quando estiveres pronto: ")
                pausa_inicial = True
                
            espera(4, 6) # Mais tempo para o Google carregar os snippets de IA
            
            texto_google = driver.find_element(By.TAG_NAME, "body").text
            emails_google = extrair_emails(texto_google)
            telefones_google = extrair_telefones(texto_google)
            
            site_oficial = None
            resultados_js = driver.execute_script("""
                var items = [];
                var a_tags = document.querySelectorAll('div.g a');
                for (var i = 0; i < a_tags.length; i++) if(a_tags[i].href) items.push(a_tags[i].href);
                return items;
            """)
            for res_link in resultados_js:
                if url_valido(res_link):
                    site_oficial = res_link
                    break
            
            dados["Site_Oficial"] = site_oficial or ""
            email_principal = ""
            
            if site_oficial:
                try:
                    driver.get(site_oficial)
                    espera(5, 7) # TEMPO ALARGADO: Muitos sites falham aqui porque o script é demasiado rápido
                    
                    driver.execute_script("""
                        const b = Array.from(document.querySelectorAll('button, a')).find(x => ['aceitar', 'accept', 'concordo', 'got it'].includes(x.innerText.toLowerCase()));
                        if(b) b.click();
                    """)
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    
                    texto_site = driver.find_element(By.TAG_NAME, "body").text
                    emails_site = extrair_emails(texto_site)
                    
                    if not emails_site:
                        links = driver.find_elements(By.TAG_NAME, "a")
                        for a in links:
                            txt_link = a.text.lower().strip()
                            if txt_link in ['contactos', 'contact', 'fale connosco', 'contact us']:
                                driver.get(a.get_attribute('href'))
                                espera(4, 6)
                                emails_site = extrair_emails(driver.find_element(By.TAG_NAME, "body").text)
                                break
                    
                    if emails_site:
                        email_principal = emails_site[0]
                except Exception as e:
                    print(f"   ⚠️ Pequeno erro ao vasculhar o site: {e}")
                    pass

            if email_principal:
                print(f"   🎯 BINGO (Site): {email_principal}")
            elif emails_google:
                email_principal = emails_google[0]
                print(f"   🪄 BINGO (Google): {email_principal}")

            if email_principal:
                dados["Email_Oficial"] = email_principal
                dados["Telefone"] = telefones_google[0] if telefones_google else ""
                dados["Status_Pesquisa"] = "COMPLETO"
                emails_globais_vistos.add(email_principal)
            else:
                print("   ⚠️ Site lido, mas continua sem email exposto.")
                dados["Status_Pesquisa"] = "SEM_EMAIL"

            # Arrastão Continua!
            bonus_adicionados = 0
            for eg in emails_google:
                if eg not in emails_globais_vistos:
                    emails_globais_vistos.add(eg)
                    nova_lead_bonus = {
                        "Nome_Campo": f"🔥 BÓNUS: Concorrente Local ({loc_pesquisa})",
                        "Localizacao": loc_pesquisa,
                        "Site_Oficial": "Encontrado no Arrastão do Google",
                        "Email_Oficial": eg,
                        "Telefone": "", 
                        "Status_Pesquisa": "COMPLETO" # Marcado como completo pois já lhe roubámos o email no arrastão
                    }
                    lista_campos.append(nova_lead_bonus)
                    bonus_adicionados += 1
            
            if bonus_adicionados > 0:
                print(f"   🔥 ARRASTÃO: +{bonus_adicionados} novos emails da concorrência pescados!")
                
        except Exception:
            print("   ❌ O site continua a bloquear ou a dar Timeout.")
            dados["Status_Pesquisa"] = "FALHOU_SITE_X2"

        with open(ARQUIVO_JSON_CAMPOS, 'w', encoding='utf-8') as f:
            json.dump(lista_campos, f, indent=4, ensure_ascii=False)
        atualizar_excel(lista_campos)

    driver.quit()
    print("\n🏁 REPESCAGEM TERMINADA! Verifica a glória no ficheiro CSV!")

if __name__ == "__main__":
    iniciar_cacada()