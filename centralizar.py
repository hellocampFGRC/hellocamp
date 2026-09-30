import os
import glob
import json
import pandas as pd

# ==========================================
# CONFIGURAÇÕES DO CENTRALIZADOR MESTRE
# ==========================================
ARQUIVO_JSON_MESTRE = "db_master_hellocamp_supabase.json"
ARQUIVO_CSV_MESTRE = "Leads_Master_Supabase.csv"

def unificar_bases_de_dados():
    print("🌪️ A INICIAR A FUSÃO DE TODOS OS FICHEIROS B2B...")
    
    # Encontrar todos os ficheiros JSON antigos da Juvigo e do Radar
    ficheiros_json = glob.glob("db_juvigo_*.json") + glob.glob("db_mega_radar_*.json")
    
    if ARQUIVO_JSON_MESTRE in ficheiros_json:
        ficheiros_json.remove(ARQUIVO_JSON_MESTRE)

    if not ficheiros_json:
        print("❌ Não encontrei nenhum ficheiro JSON das extrações nesta pasta!")
        return

    master_dict = {}
    
    # 1. LER E UNIFICAR TUDO
    for arq in ficheiros_json:
        try:
            with open(arq, 'r', encoding='utf-8') as f:
                dados = json.load(f)
                
            print(f"📥 A processar: {arq}...")
            
            # Normalizar leitura quer seja lista (antigos) quer seja dicionário (recentes)
            lista_dados = dados if isinstance(dados, list) else list(dados.values())
            
            for item in lista_dados:
                # Normalizar o nome da chave principal (Nome_Campo vs Nome_Empresa)
                nome = item.get("Nome_Empresa") or item.get("Nome_Campo")
                if not nome: continue
                    
                if nome in master_dict:
                    existente = master_dict[nome]
                    # Preservar o melhor email e telefone encontrados
                    if not existente.get("Email_Oficial") and item.get("Email_Oficial"):
                        existente["Email_Oficial"] = item.get("Email_Oficial")
                    if not existente.get("Telefone") and item.get("Telefone"):
                        existente["Telefone"] = item.get("Telefone")
                    if item.get("Status_Pesquisa") == "COMPLETO":
                        existente["Status_Pesquisa"] = "COMPLETO"
                else:
                    # Estruturar o objeto final para o Supabase
                    master_dict[nome] = {
                        "Nome_Empresa": nome,
                        "Categoria": item.get("Categoria", "Geral/Misto"),
                        "Localizacao": item.get("Localizacao") or item.get("Localizacao_Busca", ""),
                        "Site_Oficial": item.get("Site_Oficial", ""),
                        "Email_Oficial": item.get("Email_Oficial", ""),
                        "Telefone": item.get("Telefone", ""),
                        "Status_Pesquisa": item.get("Status_Pesquisa", "")
                    }
                    
        except Exception as e:
            print(f"⚠️ Erro ao processar {arq}: {e}")

    # 2. CRIAR FICHEIROS MESTRES
    lista_final = list(master_dict.values())
    
    with open(ARQUIVO_JSON_MESTRE, 'w', encoding='utf-8') as f:
        json.dump(lista_final, f, indent=4, ensure_ascii=False)
        
    df = pd.DataFrame(lista_final)
    
    # Limpeza B2B final: Remover empresas sem e-mail e duplicados exatos de e-mail
    df = df[df['Email_Oficial'] != ""]
    df.drop_duplicates(subset=['Email_Oficial'], keep='first', inplace=True)
    
    # Ordenar o ficheiro para ficar bonito no Supabase
    df.sort_values(by=['Categoria', 'Nome_Empresa'], inplace=True)
    df.to_csv(ARQUIVO_CSV_MESTRE, index=False, quoting=1)
    
    print(f"\n✅ SUCESSO! Base de dados Mestre criada com {len(df)} leads B2B únicas e verificadas.")
    
    # 3. LIMPEZA (APAGAR O LIXO ANTIGO)
    print("\n🧹 A incinerar os ficheiros antigos para manter a pasta limpa...")
    for arq in ficheiros_json:
        try:
            os.remove(arq)
            print(f"   🗑️ Apagado: {arq}")
        except: pass
            
    csvs_antigos = glob.glob("Leads_*.csv")
    if ARQUIVO_CSV_MESTRE in csvs_antigos:
        csvs_antigos.remove(ARQUIVO_CSV_MESTRE)
        
    for csv in csvs_antigos:
        try:
            os.remove(csv)
            print(f"   🗑️ Apagado: {csv}")
        except: pass

    print("\n🚀 Tudo limpo! O ficheiro 'Leads_Master_Supabase.csv' está pronto para ser importado.")

if __name__ == "__main__":
    unificar_bases_de_dados()