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
# CONFIGURAÇÕES E LISTAS
# ==========================================
ARQUIVO_JSON = "campos_privados_db.json"
ARQUIVO_CSV = "Leads_Campos_Privados.csv"

CATEGORIAS_PESQUISA = {
    "Tecnologia e Robótica": "campos de ferias robotica programação portugal",
    "Surf e Mar": "escolas de surf campos de ferias verao portugal",
    "Línguas": "summer camps ingles linguas portugal",
    "Artes e Criatividade": "campos de ferias teatro artes criatividade crianças",
    "Desporto Geral": "campos de ferias desportivos academia clube",
    "Aventura e Natureza": "campos de ferias natureza aventura atividades ao ar livre"
}

BLACKLIST = [
    'youtube.', 'instagram.', 'tiktok.', 'twitter.', 'linkedin.', 'casamentos.pt', 'zankyou.pt',
    'tripadvisor.', 'pinterest.', 'mapbox.', 'openstreetmap.', 'leaflet', 'waze.', 'apple.com',
    'wa.me', 'consent.', 'einforma.pt', 'racius.com', 'pai.pt', 'booking.com', 'airbnb.pt',
    'yelp.com', 'portugalio.com', 'igogo.pt', 'sapo.pt', 'wook.pt', 'trip.com', 'trustpilot.',
    'yellowpages', 'wikipedia', 'amazon', 'privacidade', 'termos', 'cookies', 'policy', 'legal',
    'rgpd', 'timeout.pt', 'nit.pt', 'juvigo.', 'pumpkins.', 'pumpkin.pt', 'estrelaseouricos.',
    'cm-', 'uf-', 'jf-', 'junta', 'camara', 'municipio', 'gov.pt', 'olx.pt', 'custojusto.pt'
]

BAD_EMAILS = ['sentry.io', 'wixpress.com', 'example.com', '.png', '.jpg', '.gif', 'sapo.pt']

# ==========================================
# FUNÇÕES UTILITÁRIAS
# ==========================================
def espera(minimo=2, maximo=4):
    time.sleep(random.uniform(minimo, maximo))

def url_valido(url):
    if not url or not url.startswith('http'): return False
    url_low = url.lower()
    for lixo in BLACKLIST:
        if lixo in url_low:
            return False
    return True

def extrair_emails(texto):
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    emails_limpos = []
    for e in emails:
        low_e = e.lower()
        if not any(bad in low_e for bad in BAD_EMAILS) and not low_e.endswith(('png','jpg','gif')):
            emails_limpos.append(low_e)
    return list(set(emails_limpos))

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones]))

def atualizar_excel(dados_lista):
    if not dados_lista: return
    df = pd.DataFrame(dados_lista)
    colunas = ['Nome', 'Categoria', 'Website', 'Email', 'Telefone', 'Status']
    for col in colunas:
        if col not in df.columns:
            df[col] = ""
    df[colunas].to_csv(ARQUIVO_CSV, index=False, quoting=1)

# ==========================================
# MOTOR PRINCIPAL
# ==========================================
def iniciar_scraper_epico():
    print("🤖 MOTOR B2B ÉPICO INICIADO...")

    mapa_empresas = {}
    if os.path.exists(ARQUIVO_JSON):
        with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
            lista_salva = json.load(f)
            for item in lista_salva:
                mapa_empresas[item['Nome']] = item
        print(f"📂 Carregadas {len(mapa_empresas)} empresas do histórico.")

    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # ---------------------------------------------------------
    # FASE 1: DESCOBERTA (C/ Extração JS Forçada)
    # ---------------------------------------------------------
    print("\n--- FASE 1: VARREDURA GOOGLE ---")
    pausa_feita = False

    for categoria, termo in CATEGORIAS_PESQUISA.items():
        print(f"\n🔍 A caçar orgânicos: '{termo}'...")
        driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(termo)}")
        
        if not pausa_feita:
            print("\n🛑 PAUSA: Resolve o Captcha/Cookies do Google agora.")
            input("👉 Pressiona [ENTER] para arrancar a extração: ")
            pausa_feita = True
            espera(2,3)

        for pagina in range(1, 3):
            espera(2,4)
            
            # 🔥 EXTRAÇÃO JS INFALÍVEL 🔥
            # O JS ignora o Selenium e procura links estruturais reais na página
            resultados_js = driver.execute_script("""
                var items = [];
                var h3s = document.querySelectorAll('h3');
                for (var i = 0; i < h3s.length; i++) {
                    var titulo = h3s[i].innerText;
                    var a_tag = h3s[i].closest('a');
                    if (a_tag && a_tag.href && titulo.length > 0) {
                        items.push({'titulo': titulo, 'link': a_tag.href});
                    }
                }
                return items;
            """)
            
            novos = 0
            for res in resultados_js:
                titulo = res['titulo']
                link = res['link']
                
                if url_valido(link) and titulo not in mapa_empresas:
                    mapa_empresas[titulo] = {
                        "Nome": titulo,
                        "Categoria": categoria,
                        "Website": link,
                        "Email": "",
                        "Telefone": "",
                        "Status": "PENDENTE"
                    }
                    novos += 1

            print(f"   ✅ Pág {pagina}: +{novos} empresas novas encontradas.")
            
            # Próxima página Google
            try:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                espera(1,2)
                driver.find_element(By.ID, "pnnext").click()
            except:
                break

    lista_atualizada = list(mapa_empresas.values())
    with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(lista_atualizada, f, indent=4, ensure_ascii=False)
    atualizar_excel(lista_atualizada)
    
    if len(mapa_empresas) == 0:
        print("\n❌ Continuo a não apanhar links! O Google bloqueou totalmente a janela.")
        driver.quit()
        return

    print(f"\n🚀 FASE 1 CONCLUÍDA! Total acumulado: {len(mapa_empresas)} empresas.")

    # ---------------------------------------------------------
    # FASE 2: INSPEÇÃO CIRÚRGICA (Entrar nos sites)
    # ---------------------------------------------------------
    print("\n--- FASE 2: EXTRAÇÃO DE CONTACTOS ---")
    lista_empresas = list(mapa_empresas.values())

    for i, empresa in enumerate(lista_empresas):
        if empresa.get("Status") in ["COMPLETO", "FALHOU_SITE"]:
            print(f"[{i+1}/{len(lista_empresas)}] ⏭️ IGNORADO (Já feito): {empresa['Nome']}")
            continue

        url = empresa["Website"]
        print(f"\n[{i+1}/{len(lista_empresas)}] 🌐 A invadir site: {empresa['Nome']}")
        
        try:
            driver.get(url)
            espera(3, 5)

            try:
                driver.execute_script("""
                    const buttons = Array.from(document.querySelectorAll('button, a'));
                    const target = buttons.find(b => ['aceitar', 'accept', 'concordo'].includes(b.innerText.toLowerCase()));
                    if(target) target.click();
                """)
                espera(1, 2)
            except:
                pass

            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            html_texto = driver.find_element(By.TAG_NAME, "body").text
            
            emails = extrair_emails(html_texto)
            telefones = extrair_telefones(html_texto)

            if not emails:
                links = driver.find_elements(By.TAG_NAME, "a")
                link_contactos = None
                for a in links:
                    txt = a.text.lower()
                    if txt in ['contactos', 'contact', 'fale connosco']:
                        link_contactos = a.get_attribute('href')
                        break
                
                if link_contactos and url_valido(link_contactos):
                    print("   🕵️‍♂️ A investigar sub-página de contactos...")
                    driver.get(link_contactos)
                    espera(3, 4)
                    html_texto2 = driver.find_element(By.TAG_NAME, "body").text
                    emails = extrair_emails(html_texto2)
                    telefones = list(set(telefones + extrair_telefones(html_texto2)))

            if emails:
                empresa["Email"] = emails[0]
                empresa["Status"] = "COMPLETO"
                print(f"   🎯 SUCESSO! E-mail apanhado: {emails[0]}")
            else:
                empresa["Status"] = "FALHOU_SITE"
                print("   ⚠️ Site lido, mas nenhum email exposto.")
            
            if telefones:
                empresa["Telefone"] = telefones[0]

        except Exception as e:
            empresa["Status"] = "FALHOU_SITE"
            print("   ❌ Erro ao abrir ou ler o site.")

        with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
            json.dump(lista_empresas, f, indent=4, ensure_ascii=False)
        atualizar_excel(lista_empresas)
        espera(1, 3)

    print("\n🏁 PROCESSO TERMINADO COM SUCESSO!")
    driver.quit()

if __name__ == "__main__":
    iniciar_scraper_epico()