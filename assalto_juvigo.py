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
# CONFIGURAÇÕES 
# ==========================================
ARQUIVO_JSON_JUVIGO = "db_juvigo_assalto_v10.json"
ARQUIVO_CSV_FINAL = "Leads_Juvigo_Extraidas.csv"

URL_RAIZ = "https://juvigo.pt/campos-de-ferias"
EMAILS_LIXO = ['contacto@juvigo.pt', 'info@juvigo.pt', 'sentry.io', 'wixpress.com', 'example.com', '.png', '.jpg']
BLACKLIST = ['juvigo.', 'youtube.', 'instagram.', 'facebook.', 'tiktok.', 'booking.', 'airbnb.', 'tripadvisor.', 'cm-', 'uf-', 'gov.pt', 'wikipedia']

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")

def espera(minimo=2, maximo=5):
    time.sleep(random.uniform(minimo, maximo))

def url_valido(url):
    if not url or not url.startswith('http'): return False
    low_url = url.lower()
    return not any(lixo in low_url for lixo in BLACKLIST)

def extrair_emails(texto):
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    return list(set([e.lower() for e in emails if not any(bad in e.lower() for bad in EMAILS_LIXO)]))

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones]))

def atualizar_excel(dados_lista):
    if not dados_lista: return
    df = pd.DataFrame(dados_lista)
    colunas = ['Nome_Campo', 'Localizacao', 'Site_Oficial', 'Email_Oficial', 'Telefone', 'Status_Pesquisa']
    for col in colunas:
        if col not in df.columns: df[col] = ""
    df[colunas].to_csv(ARQUIVO_CSV_FINAL, index=False, quoting=1)

# ==========================================
# MOTOR DE EXTRAÇÃO JUVIGO (LEITURA TEXTUAL)
# ==========================================
def assalto_direto_juvigo():
    print("🕵️‍♂️ A INICIAR OPERAÇÃO JUVIGO (VARREDURA TEXTUAL PURA)...")
    
    mapa_campos = {}
    if os.path.exists(ARQUIVO_JSON_JUVIGO):
        with open(ARQUIVO_JSON_JUVIGO, 'r', encoding='utf-8') as f:
            for item in json.load(f): mapa_campos[item['Nome_Campo']] = item
        print(f"📂 Carregados {len(mapa_campos)} campos do histórico.")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    print("\n--- FASE 0: MAPEAMENTO DE CATEGORIAS ---")
    driver.get(URL_RAIZ)
    espera(3, 5)
    
    try:
        driver.find_element(By.XPATH, "//button[contains(text(), 'Aceitar') or contains(text(), 'Accept')]").click()
        espera(1, 2)
    except: pass

    sub_categorias = driver.execute_script("""
        var cat_links = new Set();
        var links = document.querySelectorAll('a[href*="/campos-de-ferias-"], a[href*="-de-verao"]');
        for (var i = 0; i < links.length; i++) cat_links.add(links[i].href);
        return Array.from(cat_links);
    """)
    sub_categorias.insert(0, URL_RAIZ)
    print(f"✅ Encontradas {len(sub_categorias)} sub-categorias para explorar!")

    print("\n--- FASE 1: LEITURA TOTAL DAS PÁGINAS ---")

    for idx, url_categoria in enumerate(sub_categorias):
        nome_cat = url_categoria.split('/')[-1]
        print(f"\n📁 [{idx+1}/{len(sub_categorias)}] A varrer secção: {nome_cat}...")
        
        try:
            driver.get(url_categoria)
            espera(4, 6)
            
            # Scroll gigante para forçar a página a expor todo o texto
            altura_anterior = driver.execute_script("return document.body.scrollHeight")
            for pulo in range(60): 
                driver.execute_script("window.scrollBy(0, 800);")
                espera(3, 5) 
                nova_altura = driver.execute_script("return document.body.scrollHeight")
                if nova_altura == altura_anterior:
                    break
                altura_anterior = nova_altura

            # Lemos a página toda de uma vez (tal como tu copiaste)
            texto_bruto = driver.find_element(By.TAG_NAME, "body").text
            
            # Separamos em linhas e limpamos os espaços vazios
            linhas = [linha.strip() for linha in texto_bruto.split('\n') if linha.strip()]
            
            novos_na_pagina = 0
            
            # A lógica é: percorrer a página. Quando encontramos a palavra "anos" (ex: 18-35 anos),
            # olhamos para trás para arrancar o Nome e a Região.
            for i in range(len(linhas)):
                linha = linhas[i]
                
                # Se encontrarmos a linha da idade (O nosso "fio guia")
                if "anos" in linha and re.search(r'\d', linha):
                    
                    titulo = ""
                    regiao_geral = ""
                    local_especifico = ""
                    
                    # 1. Olhamos para a linha imediatamente ACIMA (Normalmente é o Local Específico, ex: Sagres)
                    if i - 1 >= 0:
                        linha_acima = linhas[i-1]
                        # Ignorar se a linha acima for "(14)" avaliações ou "Day Camp"
                        if not linha_acima.startswith('(') and "Camp" not in linha_acima and "09h00" not in linha_acima:
                            local_especifico = linha_acima
                            
                    # 2. Olhamos para as 6 linhas acima da Idade para encontrar o Título e a Região
                    for k in range(1, min(7, i)):
                        linha_candidata = linhas[i-k]
                        
                        # Se encontrarmos "Região", "Espanha" ou "Inglaterra", é a Região Geral
                        if "Região" in linha_candidata or "Espanha" in linha_candidata or "Inglaterra" in linha_candidata:
                            regiao_geral = linha_candidata.replace('♡', '').strip()
                            
                            # O título está GARANTIDAMENTE 1 linha abaixo da Região!
                            if (i - k + 1) < i:
                                titulo = linhas[i - k + 1]
                            break
                    
                    # 3. Tratamento final de nomes e locais
                    if titulo and len(titulo) > 6 and "Campos de férias" not in titulo:
                        
                        # Limpa preços que possam ter-se misturado (ex: "A partir de 450 €")
                        if "A partir" in titulo or "€" in titulo: continue
                        
                        loc_final = regiao_geral
                        if local_especifico and local_especifico != regiao_geral:
                            loc_final = f"{local_especifico} ({regiao_geral})"
                            
                        # Grava na base de dados (se ainda não existir)
                        if titulo not in mapa_campos:
                            mapa_campos[titulo] = {
                                "Nome_Campo": titulo,
                                "Localizacao": loc_final,
                                "Site_Oficial": "",
                                "Email_Oficial": "",
                                "Telefone": "",
                                "Status_Pesquisa": "AGUARDA_GOOGLE"
                            }
                            novos_na_pagina += 1
            
            print(f"   ✅ Extraídos +{novos_na_pagina} CAMPOS REAIS do texto desta página.")
            with open(ARQUIVO_JSON_JUVIGO, 'w', encoding='utf-8') as f:
                json.dump(list(mapa_campos.values()), f, indent=4, ensure_ascii=False)
                
        except Exception as e:
            print(f"   ⚠️ Falha ao ler {nome_cat}, a saltar...")
            continue 

    print(f"\n🎯 Total Acumulado Prontos a Pesquisar: {len(mapa_campos)}")

    # --- FASE 2: PESQUISA GOOGLE ---
    print("\n--- FASE 2: CAÇADA NO GOOGLE ---")
    lista_final = list(mapa_campos.values())
    
    for i, dados in enumerate(lista_final):
        if dados.get("Status_Pesquisa") == "COMPLETO": continue
        
        nome_campo = dados["Nome_Campo"]
        loc = dados["Localizacao"]
        print(f"\n[{i+1}/{len(lista_final)}] 🔎 Google: {nome_campo}")
        
        query = f'"{nome_campo}" {loc} portugal -juvigo -pumpkin'
        
        try:
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query)}")
            espera(3, 5)
            
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
                    
            if not site_oficial:
                print("   ❌ Site oficial não encontrado.")
                dados["Status_Pesquisa"] = "FALHOU_GOOGLE"
                continue
                
            print(f"   🌐 Site Oficial: {site_oficial}")
            dados["Site_Oficial"] = site_oficial
            
            driver.get(site_oficial)
            espera(3, 5)
            
            driver.execute_script("""
                const b = Array.from(document.querySelectorAll('button, a')).find(x => ['aceitar', 'accept'].includes(x.innerText.toLowerCase()));
                if(b) b.click();
            """)
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            
            texto_site = driver.find_element(By.TAG_NAME, "body").text
            emails, telefones = extrair_emails(texto_site), extrair_telefones(texto_site)
            
            if not emails:
                for a in driver.find_elements(By.TAG_NAME, "a"):
                    if a.text.lower() in ['contactos', 'contact']:
                        driver.get(a.get_attribute('href'))
                        espera(3, 4)
                        t2 = driver.find_element(By.TAG_NAME, "body").text
                        emails = extrair_emails(t2)
                        telefones = list(set(telefones + extrair_telefones(t2)))
                        break

            if emails:
                print(f"   🎯 BINGO! E-mail: {emails[0]}")
                dados["Email_Oficial"], dados["Telefone"], dados["Status_Pesquisa"] = emails[0], telefones[0].strip() if telefones else "", "COMPLETO"
            else:
                print("   ⚠️ Sem e-mail.")
                dados["Status_Pesquisa"] = "SEM_EMAIL"
                
        except Exception:
            print("   ❌ Timeout/Bloqueio.")
            dados["Status_Pesquisa"] = "FALHOU_SITE"

        with open(ARQUIVO_JSON_JUVIGO, 'w', encoding='utf-8') as f:
            json.dump(lista_final, f, indent=4, ensure_ascii=False)
        atualizar_excel(lista_final)

    driver.quit()
    print("\n🏁 EXTRAÇÃO TERMINADA!")

if __name__ == "__main__":
    assalto_direto_juvigo()