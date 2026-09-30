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
# CONFIGURAÇÕES ZERO-CLICK B2B
# ==========================================
ARQUIVO_JSON_RADAR = "db_mega_radar_ia.json" 
ARQUIVO_CSV_FINAL = "Leads_Mega_Radar_IA.csv"

TEMAS_PORTUGAL = [
    "surf", "futebol", "ténis", "padel", "rugby", "basquetebol", "artes marciais", 
    "judo", "karaté", "robótica", "programação", "tecnologia", "artes", "pintura", 
    "teatro", "dança", "música", "aventura", "natureza", "paintball", "escuteiros", 
    "cozinha", "inglês", "ciência"
]

LOCAIS_EXTERIOR = [
    ("inglês", "Reino Unido"),
    ("inglês", "Inglaterra"),
    ("inglês", "Malta"),
    ("espanhol", "Espanha")
]

EMAILS_LIXO = ['contacto@juvigo.pt', 'info@pumpkin.pt', 'geral@pumpkin.pt', 'sentry.io', 'example.com', '.png', '.jpg', '@youtube', '@facebook', '@instagram']

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

def espera(minimo=2, maximo=4):
    time.sleep(random.uniform(minimo, maximo))

def extrair_emails(texto):
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    return list(set([e.lower() for e in emails if not any(bad in e.lower() for bad in EMAILS_LIXO)]))

def extrair_telefones(texto):
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    return list(set([t.strip() for t in telefones if len(t.strip()) >= 9]))

def atualizar_excel(dados_lista):
    if not dados_lista: return
    df = pd.DataFrame(list(dados_lista.values()))
    # Removemos o Site Oficial pois já não o estamos a guardar
    colunas = ['Nome_Empresa', 'Categoria', 'Localizacao', 'Email_Oficial', 'Telefone', 'Status_Pesquisa']
    for col in colunas:
        if col not in df.columns: df[col] = ""
    df.sort_values(by=['Status_Pesquisa', 'Categoria'], inplace=True)
    df[colunas].to_csv(ARQUIVO_CSV_FINAL, index=False, quoting=1)

# ==========================================
# MOTOR PRINCIPAL
# ==========================================
def iniciar_radar_ia():
    print("🚀 A INICIAR ZERO-CLICK RADAR (EXTRAÇÃO POR INTELIGÊNCIA DO GOOGLE)...")
    
    mapa_empresas = {}
    if os.path.exists(ARQUIVO_JSON_RADAR):
        with open(ARQUIVO_JSON_RADAR, 'r', encoding='utf-8') as f:
            mapa_empresas = json.load(f)
        print(f"📂 Carregadas {len(mapa_empresas)} empresas do histórico.")

    queries_para_pesquisar = []
    for tema in TEMAS_PORTUGAL:
        queries_para_pesquisar.append({"query": f'campos de férias {tema} portugal', "categoria": tema.capitalize(), "local": "Portugal"})
    for tema, local in LOCAIS_EXTERIOR:
        queries_para_pesquisar.append({"query": f'campos de férias para aprender {tema} no {local}', "categoria": "Línguas", "local": local})

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    pausa_inicial = False

    # --- FASE 1: ROUBAR APENAS OS NOMES (TÍTULOS H3) ---
    print("\n--- FASE 1: EXTRAÇÃO PURA DE TÍTULOS ---")
    
    for q_data in queries_para_pesquisar:
        query_texto = q_data["query"]
        print(f"\n📡 A pesquisar nomes para: '{query_texto}'...")
        
        try:
            busca = f"{query_texto} -juvigo -pumpkin -coloniasdeferias"
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(busca)}")
            
            if not pausa_inicial:
                print("\n🛑 PAUSA HUMANA: Vai à janela do Chrome e aceita os Cookies do Google!")
                input("👉 Pressiona [ENTER] quando estiveres pronto: ")
                pausa_inicial = True
                
            espera(3, 5)
            
            # Desce 3 vezes para carregar paginação do Google
            for _ in range(3):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                espera(2, 3)
                try:
                    botoes = driver.find_elements(By.TAG_NAME, "span")
                    for btn in botoes:
                        if btn.text in ["Mais resultados", "More results", "Seguinte", "Next"]:
                            driver.execute_script("arguments[0].click();", btn)
                            espera(3, 4)
                            break
                except: pass

            # Puxar SÓ OS TÍTULOS H3 limpos
            titulos = driver.execute_script("""
                var items = [];
                var h3s = document.querySelectorAll('h3');
                for (var i = 0; i < h3s.length; i++) {
                    var txt = h3s[i].innerText;
                    if (txt.length > 5 && !txt.includes('Mais resultados') && !txt.includes('As pessoas também') && !txt.includes('Imagens')) {
                        items.push(txt);
                    }
                }
                return items;
            """)
            
            novos = 0
            for t in titulos:
                # Corta o lixo da marcação SEO (ex: "Surf Camp Algarve | Aulas de Surf" -> "Surf Camp Algarve")
                nome_limpo = t.split('|')[0].split('-')[0].strip()
                
                # Usa o nome limpo como Chave Única para evitar duplicados
                if nome_limpo not in mapa_empresas:
                    mapa_empresas[nome_limpo] = {
                        "Nome_Empresa": nome_limpo,
                        "Categoria": q_data["categoria"],
                        "Localizacao": q_data["local"],
                        "Email_Oficial": "",
                        "Telefone": "",
                        "Status_Pesquisa": "AGUARDA_IA_GOOGLE"
                    }
                    novos += 1
                    
            print(f"   ✅ +{novos} Nomes de empresas registados!")
            
            with open(ARQUIVO_JSON_RADAR, 'w', encoding='utf-8') as f:
                json.dump(mapa_empresas, f, indent=4, ensure_ascii=False)
                
        except Exception:
            print("   ⚠️ Erro. A saltar keyword...")

    print(f"\n🎯 FASE 1 CONCLUÍDA! Temos {len(mapa_empresas)} Nomes de Negócios purificados.")

    # --- FASE 2: DEVOLVER OS NOMES AO GOOGLE PARA A IA DAR O EMAIL ---
    print("\n--- FASE 2: INTERROGATÓRIO À I.A. DO GOOGLE ---")
    lista_nomes = list(mapa_empresas.keys())
    
    for i, nome in enumerate(lista_nomes):
        dados = mapa_empresas[nome]
        
        if dados["Status_Pesquisa"] == "COMPLETO":
            continue
            
        loc = dados["Localizacao"]
        print(f"\n[{i+1}/{len(lista_nomes)}] 🤖 A perguntar ao Google por: {nome}")
        
        # A pesquisa que obriga o Google a mostrar o cartão de empresa ou o Resumo IA
        query_ia = f'"{nome}" {loc if loc != "Portugal" else ""} contactos email'
        
        try:
            driver.get(f"https://www.google.pt/search?q={urllib.parse.quote_plus(query_ia)}")
            espera(3, 5) # Dá tempo para a IA do Google gerar a resposta no topo
            
            # Leitura brutal e direta do ecrã do Google! Não entramos em links.
            texto_google = driver.find_element(By.TAG_NAME, "body").text
            emails_encontrados = extrair_emails(texto_google)
            telefones_encontrados = extrair_telefones(texto_google)
            
            if emails_encontrados:
                print(f"   🪄 BINGO I.A.! O Google entregou o email: {emails_encontrados[0]}")
                dados["Email_Oficial"] = emails_encontrados[0]
                dados["Telefone"] = telefones_encontrados[0] if telefones_encontrados else ""
                dados["Status_Pesquisa"] = "COMPLETO"
            else:
                print("   ⚠️ O Google não revelou o email no resumo visual.")
                dados["Status_Pesquisa"] = "SEM_EMAIL_NO_GOOGLE"
                
        except Exception:
            print("   ❌ O Google bloqueou a leitura.")
            dados["Status_Pesquisa"] = "FALHOU_LEITURA"

        with open(ARQUIVO_JSON_RADAR, 'w', encoding='utf-8') as f:
            json.dump(mapa_empresas, f, indent=4, ensure_ascii=False)
        atualizar_excel(mapa_empresas)

    driver.quit()
    print("\n🏁 OPERAÇÃO ZERO-CLICK CONCLUÍDA!")

if __name__ == "__main__":
    iniciar_radar_ia()