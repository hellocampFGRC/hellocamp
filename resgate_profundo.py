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
# CONFIGURAÇÕES DA FORÇA DE RESGATE
# ==========================================
ARQUIVO_JSON = "db_mega_radar_ia.json" 
ARQUIVO_CSV_FINAL = "Leads_Mega_Radar_Resgatadas.csv"

EMAILS_LIXO = ['contacto@juvigo.pt', 'info@pumpkin.pt', 'geral@pumpkin.pt', 'sentry.io', 'example.com', '.png', '.jpg', '@youtube', '@facebook', '@instagram', 'wixpress']
BLACKLIST_SITES = ['juvigo.', 'pumpkin.pt', 'coloniasdeferias.pt', 'estrelaseouricos', 'odisseias', 'lifecooler', 'youtube.', 'instagram.', 'facebook.', 'tiktok.', 'booking.', 'airbnb.', 'tripadvisor.', 'cm-', 'uf-', 'gov.pt', 'wikipedia.', 'sapo.pt', 'timeout.pt', 'reddit.com', 'pinterest.com']

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

def espera(minimo=2, maximo=5):
    time.sleep(random.uniform(minimo, maximo))

def is_b2b_valido(url):
    if not url or not url.startswith('http'): return False
    low_url = url.lower()
    if any(lixo in low_url for lixo in BLACKLIST_SITES): return False
    return True

def extrair_emails_avancado(texto_visivel, codigo_html):
    e1 = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto_visivel)
    e2 = re.findall(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', codigo_html)
    todos = list(set([e.lower() for e in e1 + e2]))
    return [e for e in todos if not any(bad in e for bad in EMAILS_LIXO)]

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones if len(t.strip()) >= 9]))

def atualizar_excel(dados_lista):
    if not dados_lista: return
    df = pd.DataFrame(list(dados_lista.values()))
    colunas = ['Nome_Empresa', 'Categoria', 'Localizacao', 'Email_Oficial', 'Telefone', 'Status_Pesquisa']
    for col in colunas:
        if col not in df.columns: df[col] = ""
    df.sort_values(by=['Status_Pesquisa', 'Categoria'], inplace=True)
    df[colunas].to_csv(ARQUIVO_CSV_FINAL, index=False, quoting=1)

# ==========================================
# 🚨 DETETOR DE CAPTCHA 🚨
# ==========================================
def detetar_captcha(driver):
    """Verifica se batemos num muro de segurança e pausa o robô"""
    
    url_atual = driver.current_url.lower()
    
    # 1. Bloqueio do Google (Tráfego Incomum)
    if "google." in url_atual and "/sorry" in url_atual:
        print("\n🚨 [ALERTA] GOOGLE CAPTCHA DETETADO! 🚨")
        print("O Google percebeu que somos demasiado rápidos.")
        input("👉 Vai à janela do Chrome, resolve o desafio humano e pressiona [ENTER] aqui para continuar: ")
        espera(2, 3)
        return

    # 2. Bloqueio de Cloudflare ou reCAPTCHA nos sites oficiais
    html = driver.page_source.lower()
    if "cf-browser-verification" in html or "g-recaptcha" in html or "h-captcha" in html or "cf-turnstile" in html:
        try:
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            for iframe in iframes:
                src = iframe.get_attribute("src")
                if src and ("recaptcha" in src or "hcaptcha" in src or "turnstile" in src or "challenges" in src):
                    print("\n🛡️ [ALERTA] ESCUDO ANTI-ROBÔ DETETADO NO SITE! 🛡️")
                    print("A empresa está a usar Cloudflare ou Captcha.")
                    input("👉 Vai à janela do Chrome, passa a verificação e pressiona [ENTER] aqui: ")
                    espera(2, 3)
                    return
        except: pass

# ==========================================
# MOTOR DE RESGATE 
# ==========================================
def iniciar_resgate():
    print("🚁 A INICIAR A FORÇA DE RESGATE (LEITURA I.A. + ANTI-CAPTCHA)...")
    
    if not os.path.exists(ARQUIVO_JSON):
        print(f"❌ ERRO: Ficheiro {ARQUIVO_JSON} não encontrado!")
        return

    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        mapa_empresas = json.load(f)

    alvos_resgate = [nome for nome, dados in mapa_empresas.items() if dados.get("Status_Pesquisa") == "SEM_EMAIL_NO_GOOGLE"]
    
    print(f"📂 Encontradas {len(alvos_resgate)} empresas resistentes a aguardar resgate.")
    if not alvos_resgate:
        print("Tudo limpo! Não há ninguem para resgatar.")
        return

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    pausa_inicial = False

    for i, nome_empresa in enumerate(alvos_resgate):
        dados = mapa_empresas[nome_empresa]
        loc = dados["Localizacao"]
        
        nome_limpo = re.sub(r'(?i)(\[pdf\]|on instagram|top 10|\"|@\w+|instagram photos and videos)', '', nome_empresa).strip()
        
        print(f"\n[{i+1}/{len(alvos_resgate)}] 🔎 A PERSEGUIR: {nome_limpo} | {loc}")
        
        query = f'"{nome_limpo}" {loc if loc != "Portugal" else ""} contactos email'
        
        try:
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query)}")
            
            # --- VERIFICAÇÃO DE CAPTCHA NO GOOGLE ---
            detetar_captcha(driver)
            
            if not pausa_inicial:
                print("\n🛑 PAUSA HUMANA: Vai à janela do Chrome e aceita os Cookies do Google!")
                input("👉 Pressiona [ENTER] quando estiveres pronto: ")
                pausa_inicial = True
                
            espera(3, 5)
            
            # --- 1. LEITURA I.A. DO GOOGLE ---
            texto_google = driver.find_element(By.TAG_NAME, "body").text
            emails_no_google = extrair_emails_avancado(texto_google, "")
            telefones_no_google = extrair_telefones(texto_google)
            
            if emails_no_google:
                print(f"   🪄 RESGATE IMEDIATO! O Google entregou o email: {emails_no_google[0]}")
                dados["Email_Oficial"] = emails_no_google[0]
                dados["Telefone"] = telefones_no_google[0] if telefones_no_google else ""
                dados["Status_Pesquisa"] = "COMPLETO"
                
                with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
                    json.dump(mapa_empresas, f, indent=4, ensure_ascii=False)
                atualizar_excel(mapa_empresas)
                continue
            
            # --- 2. INVASÃO DO SITE OFICIAL ---
            resultados_js = driver.execute_script("""
                var items = [];
                var a_tags = document.querySelectorAll('div.g a');
                for (var i = 0; i < a_tags.length; i++) if(a_tags[i].href) items.push(a_tags[i].href);
                return items;
            """)
            
            site_oficial = None
            for res_link in resultados_js:
                if is_b2b_valido(res_link):
                    site_oficial = res_link
                    break
            
            if not site_oficial:
                print("   ❌ Alvo invisível no Google ou listado apenas em agregadores.")
                dados["Status_Pesquisa"] = "ESGOTADO_OU_INVISIVEL"
                continue

            print(f"   🌐 O Google escondeu. A invadir o QG oficial: {site_oficial[:50]}...")
            
            try:
                driver.get(site_oficial)
                
                # --- VERIFICAÇÃO DE CAPTCHA NO SITE (Cloudflare, etc) ---
                detetar_captcha(driver)
                
                espera(4, 6)
                
                driver.execute_script("""
                    const b = Array.from(document.querySelectorAll('button, a')).find(x => ['aceitar', 'accept', 'concordo', 'got it'].includes(x.innerText.toLowerCase()));
                    if(b) b.click();
                """)
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                espera(2, 3)
                
                t_visivel = driver.find_element(By.TAG_NAME, "body").text
                t_html = driver.page_source
                
                emails = extrair_emails_avancado(t_visivel, t_html)
                telefones = extrair_telefones(t_visivel)
                
                if not emails:
                    links = driver.find_elements(By.TAG_NAME, "a")
                    for a in links:
                        try:
                            href = a.get_attribute('href')
                            txt = a.text.lower()
                            if href and any(w in href.lower() or w in txt for w in ['contact', 'fale', 'sobre', 'info', 'informa']):
                                print("   🕵️‍♂️ A vasculhar sub-página confidencial...")
                                driver.get(href)
                                
                                # Verifica Captcha de novo na página de contactos
                                detetar_captcha(driver)
                                espera(3, 5)
                                
                                t2_v = driver.find_element(By.TAG_NAME, "body").text
                                t2_h = driver.page_source
                                emails = extrair_emails_avancado(t2_v, t2_h)
                                if emails: telefones = list(set(telefones + extrair_telefones(t2_v)))
                                break
                        except: pass
                
                if emails:
                    print(f"   🎯 RESGATADO COM SUCESSO (Site Oficial): {emails[0]}")
                    dados["Email_Oficial"] = emails[0]
                    dados["Telefone"] = telefones[0] if telefones else ""
                    dados["Status_Pesquisa"] = "COMPLETO"
                else:
                    print("   ⚠️ Explorámos o site todo mas não há emails expostos.")
                    dados["Status_Pesquisa"] = "SITE_BLINDADO"
                    
            except Exception:
                print("   ❌ O servidor deles rejeitou a nossa ligação.")
                dados["Status_Pesquisa"] = "FALHOU_CONEXAO_SITE"

        except Exception:
            print("   ❌ Erro durante a pesquisa no Google.")

        with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
            json.dump(mapa_empresas, f, indent=4, ensure_ascii=False)
        atualizar_excel(mapa_empresas)

    driver.quit()
    print("\n🏁 MISSÃO DE RESGATE TERMINADA! O ficheiro Excel foi enriquecido.")

if __name__ == "__main__":
    iniciar_resgate()