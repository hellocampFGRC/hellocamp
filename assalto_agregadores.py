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
# 1. CONFIGURAÇÕES E LISTAS NEGRAS
# ==========================================
ARQUIVO_CSV = "Leads_Campos_Privados.csv"
ARQUIVO_JSON = "campos_privados_db.json"

EMAILS_LIXO = [
    'info@coloniasdeferias.pt', 'contacto@juvigo.pt', 'info@pumpkin.pt', 
    'geral@pumpkin.pt', 'ola@pumpkin.pt', 'geral@estrelaseouricos.pt',
    'sentry.io', 'wixpress.com', 'example.com'
]

BLACKLIST_DOMINIOS = [
    'juvigo.', 'pumpkin.', 'coloniasdeferias.pt', 'estrelaseouricos.',
    'youtube.', 'instagram.', 'tiktok.', 'twitter.', 'linkedin.', 'casamentos.pt',
    'tripadvisor.', 'booking.com', 'airbnb.pt', 'yelp.com', 'sapo.pt', 'timeout.pt', 'nit.pt',
    'cm-', 'uf-', 'jf-', 'junta', 'camara', 'municipio', 'gov.pt', 'facebook.com'
]

AGREGADORES_ALVO = [
    "site:juvigo.pt/campos-de-ferias",
    "site:pumpkin.pt/familias/campos-de-ferias",
    "site:coloniasdeferias.pt"
]

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")

def espera(minimo=2, maximo=4):
    time.sleep(random.uniform(minimo, maximo))

def limpar_base_dados_existente():
    print("🧹 A iniciar limpeza da Base de Dados existente...")
    if not os.path.exists(ARQUIVO_CSV):
        print("   -> Ficheiro CSV não encontrado. A avançar.")
        return []
    
    df = pd.read_csv(ARQUIVO_CSV)
    total_antes = len(df)
    
    # Remover linhas onde o email está na lista de lixo
    padrao_lixo = '|'.join(EMAILS_LIXO)
    df = df[~df['Email'].str.contains(padrao_lixo, case=False, na=False)]
    
    total_depois = len(df)
    removidos = total_antes - total_depois
    df.to_csv(ARQUIVO_CSV, index=False, quoting=1)
    
    print(f"   ✅ Limpeza concluída! Foram removidos {removidos} emails de agregadores/lixo.")
    return df['Nome'].tolist() if 'Nome' in df.columns else []

def extrair_emails(texto):
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    emails_limpos = []
    for e in emails:
        low_e = e.lower()
        if not any(bad in low_e for bad in EMAILS_LIXO) and not low_e.endswith(('png','jpg','gif')):
            emails_limpos.append(low_e)
    return list(set(emails_limpos))

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones]))

def url_valido(url):
    if not url or not url.startswith('http'): return False
    url_low = url.lower()
    for lixo in BLACKLIST_DOMINIOS:
        if lixo in url_low: return False
    return True

# ==========================================
# 2. MOTOR DE ASSALTO AOS AGREGADORES
# ==========================================
def assalto_agregadores():
    nomes_ja_registados = limpar_base_dados_existente()
    
    print("\n🕵️‍♂️ FASE 0: O Assalto (Extrair nomes dos agregadores)...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    nomes_extraidos = set()
    pausa_feita = False

    # Roubar os nomes dos sites da Juvigo, Pumpkin, etc.
    for alvo in AGREGADORES_ALVO:
        print(f"\n🔍 A varrer agregador: {alvo}")
        driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(alvo)}")
        
        if not pausa_feita:
            print("\n🛑 PAUSA: Resolve o Captcha/Cookies do Google agora.")
            input("👉 Pressiona [ENTER] para iniciar o assalto: ")
            pausa_feita = True
            espera(2,3)

        for pagina in range(1, 4): # Lê 3 páginas de cada agregador
            espera(2,4)
            resultados = driver.execute_script("""
                var items = [];
                var h3s = document.querySelectorAll('h3');
                for (var i = 0; i < h3s.length; i++) {
                    var titulo = h3s[i].innerText;
                    if (titulo.length > 5) items.push(titulo);
                }
                return items;
            """)
            
            for titulo in resultados:
                # Limpar o título (Tirar " | Juvigo", " - Pumpkin", etc.)
                nome_limpo = re.split(r' \| | - | : ', titulo)[0].strip()
                if nome_limpo and nome_limpo not in nomes_ja_registados:
                    nomes_extraidos.add(nome_limpo)
            
            try:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                espera(1,2)
                driver.find_element(By.ID, "pnnext").click()
            except:
                break

    print(f"\n🎯 Sucesso! Roubámos {len(nomes_extraidos)} nomes de campos aos agregadores.")

    # ==========================================
    # 3. A CAÇADA OFICIAL (Encontrar o dono real)
    # ==========================================
    print("\n--- FASE 1: PROCURAR SITES OFICIAIS ---")
    
    dados_finais = []
    
    for i, nome_alvo in enumerate(list(nomes_extraidos)):
        print(f"\n[{i+1}/{len(nomes_extraidos)}] 🔎 A procurar dono de: '{nome_alvo}'")
        
        # Pesquisa o nome do campo excluindo os agregadores
        query = f'"{nome_alvo}" -juvigo -pumpkin -coloniasdeferias'
        driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query)}")
        espera(2, 4)
        
        # Pega no primeiro link válido que não seja da blacklist
        links = driver.execute_script("""
            var items = [];
            var a_tags = document.querySelectorAll('div.g a');
            for (var i = 0; i < a_tags.length; i++) {
                if(a_tags[i].href) items.push(a_tags[i].href);
            }
            return items;
        """)
        
        site_oficial = None
        for link in links:
            if url_valido(link):
                site_oficial = link
                break
                
        if not site_oficial:
            print("   ❌ Site oficial não encontrado no Google.")
            continue
            
        print(f"   🌐 Site oficial detetado: {site_oficial}")
        
        # Visitar o site oficial
        try:
            driver.get(site_oficial)
            espera(3, 5)
            
            html_texto = driver.find_element(By.TAG_NAME, "body").text
            emails = extrair_emails(html_texto)
            telefones = extrair_telefones(html_texto)
            
            if emails:
                print(f"   🎯 BINGO! E-mail oficial apanhado: {emails[0]}")
                dados_finais.append({
                    "Nome": nome_alvo,
                    "Categoria": "Descoberto via Agregador",
                    "Website": site_oficial,
                    "Email": emails[0],
                    "Telefone": telefones[0] if telefones else "",
                    "Status": "COMPLETO"
                })
            else:
                print("   ⚠️ Sem e-mail visível na página principal.")
                
        except Exception as e:
            print("   ❌ Erro a ler o site.")
            
        # Guarda logo no Excel para não perder nada
        if dados_finais:
            df_novos = pd.DataFrame(dados_finais)
            if os.path.exists(ARQUIVO_CSV):
                df_antigo = pd.read_csv(ARQUIVO_CSV)
                df_final = pd.concat([df_antigo, df_novos]).drop_duplicates(subset=['Website'])
            else:
                df_final = df_novos
            df_final.to_csv(ARQUIVO_CSV, index=False, quoting=1)

    driver.quit()
    print("\n🏁 ASSALTO CONCLUÍDO COM SUCESSO!")

if __name__ == "__main__":
    assalto_agregadores()