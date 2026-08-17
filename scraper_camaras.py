import time
import random
import re
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Configurações do Navegador
options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")

def espera_humana(minimo=3, maximo=6):
    time.sleep(random.uniform(minimo, maximo))

def extrair_informacao_inteligente(texto):
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', texto)
    email_limpo = emails[0] if emails else ""
    
    telefones = re.findall(r'(?:(?:\+|00)351)?\s?(?:2\d{2}|9[1236]\d)\s?\d{3}\s?\d{3}', texto)
    telefone_limpo = telefones[0].strip() if telefones else ""
    
    idades = re.findall(r'(\d{1,2})\s*(?:a|aos|-|e\s*os|até)\s*(\d{1,2})\s*anos', texto, re.IGNORECASE)
    idade_min = idades[0][0] if idades else ""
    idade_max = idades[0][1] if idades else ""
    
    datas_numericas = re.findall(r'\d{1,2}(?:/|-|\.)\d{1,2}(?:/|-|\.)\d{2,4}', texto)
    datas_texto = re.findall(r'\d{1,2}\s+de\s+[a-zA-Zç]+\s+(?:a|até)\s+\d{1,2}\s+de\s+[a-zA-Zç]+', texto, re.IGNORECASE)
    
    datas_encontradas = ""
    if datas_numericas:
        datas_encontradas += " | ".join(datas_numericas[:3])
    if datas_texto:
        datas_encontradas += " | " + " | ".join(datas_texto[:2])

    return email_limpo, telefone_limpo, idade_min, idade_max, datas_encontradas

def iniciar_scraper_infalivel():
    print("🤖 A iniciar o Chrome...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    url_pesquisa = 'https://www.google.pt/search?q="campo+de+férias"+(Câmara+Municipal+OR+Junta+de+Freguesia)+2026+site:.pt'
    driver.get(url_pesquisa)
    
    print("\n" + "="*60)
    print("🛑 PAUSA DE SEGURANÇA (A aguardar por ti...)")
    print("1. Vai à janela do Chrome.")
    print("2. Trata dos Cookies ou Captcha (se pedir).")
    print("3. Quando vires os links azuis do Google, volta aqui!")
    print("="*60 + "\n")
    
    input("👉 Pressiona a tecla [ENTER] aqui para arrancar a extração: ")
    print("\n🚀 A arrancar os motores! A caçar links...")
    
    links_encontrados = []
    
    for pagina in range(1, 4):
        espera_humana(2, 4)
        resultados = driver.find_elements(By.XPATH, "//a[.//h3]")
        
        for res in resultados:
            try:
                titulo = res.find_element(By.TAG_NAME, "h3").text
                link = res.get_attribute("href")
                if "google." in link or link == "":
                    continue
                entidade = "Câmara Municipal" if "Câmara" in titulo or "CM" in titulo else ("Junta de Freguesia" if "Junta" in titulo or "JF" in titulo else "Entidade Pública")
                links_encontrados.append({"titulo": titulo, "link": link, "entidade": entidade})
            except:
                continue
                
        try:
            botao_seguinte = driver.find_element(By.ID, "pnnext")
            driver.execute_script("arguments[0].click();", botao_seguinte)
            print(f"Avançando para a página {pagina + 1} do Google...")
        except:
            print("Fim das páginas de pesquisa do Google.")
            break

    print(f"🔗 Encontrados {len(links_encontrados)} links para analisar.")

    resultados_detalhados = []

    if len(links_encontrados) > 0:
        for index, item in enumerate(links_encontrados, 1):
            print(f"[{index}/{len(links_encontrados)}] A espiar site: {item['titulo'][:40]}...")
            try:
                driver.get(item['link'])
                espera_humana(3, 5)
                
                # Extrair Texto Principal
                texto_pagina = driver.find_element(By.TAG_NAME, "body").text
                texto_limpo = texto_pagina.replace("\n", " ")
                email, telefone, id_min, id_max, datas = extrair_informacao_inteligente(texto_pagina)
                
                # Extrair Imagem de Capa (OG Image)
                imagem_capa = ""
                try:
                    meta_og = driver.find_element(By.XPATH, '//meta[@property="og:image"]')
                    imagem_capa = meta_og.get_attribute('content')
                except:
                    pass
                
                # Extrair Links de Inscrição/Formulário
                link_inscricao = ""
                elementos_a = driver.find_elements(By.TAG_NAME, 'a')
                for a in elementos_a:
                    try:
                        href = a.get_attribute('href')
                        texto_link = a.text.lower()
                        if href:
                            # Procura domínios de formulários conhecidos ou palavras-chave no botão
                            if any(dominio in href for dominio in ['forms.gle', 'docs.google.com/forms', 'typeform.com', 'jotform.com']):
                                link_inscricao = href
                                break
                            elif any(palavra in texto_link for palavra in ['inscri', 'formul', 'candidatur', 'regist']):
                                link_inscricao = href
                                # Não faz break imediato porque um forms.gle é sempre preferível a um link genérico
                    except:
                        continue
                
                resultados_detalhados.append({
                    "titulo": item['titulo'],
                    "entidade_organizadora": item['entidade'],
                    "distrito": "",
                    "concelho": "",
                    "idade_min_global": id_min,
                    "idade_max_global": id_max,
                    "datas_encontradas": datas,
                    "email_contato": email,
                    "telefone_contato": telefone,
                    "link_oficial": item['link'],
                    "link_inscricao_extraido": link_inscricao,
                    "imagem_capa_url": imagem_capa,
                    "descricao_html": f"<p>{texto_limpo[:1500]}...</p>",
                    "is_active": "TRUE"
                })
                
            except Exception as e:
                print(f"   ⚠️ Erro ao ler: {item['link']}")
                continue

    driver.quit()
    
    if resultados_detalhados:
        df = pd.DataFrame(resultados_detalhados)
        df = df.drop_duplicates(subset=['link_oficial'])
        nome_ficheiro = "base_dados_institucional_completa.xlsx"
        df.to_excel(nome_ficheiro, index=False)
        print(f"\n✅ SUCESSO! Ficheiro gerado com {len(df)} registos: {nome_ficheiro}")
    else:
        print("\n❌ Ainda não encontrou links. Confirma se o Google carregou mesmo a pesquisa.")

if __name__ == "__main__":
    iniciar_scraper_infalivel()