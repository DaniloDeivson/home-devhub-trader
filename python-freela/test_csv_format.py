#!/usr/bin/env python3
"""
Teste para verificar o formato CSV correto
"""

import pandas as pd
import requests
import os

def test_csv_format():
    """Testa diferentes formatos de CSV"""
    
    base_url = "http://localhost:5002"
    
    # Teste 1: CSV com formato brasileiro (vírgula como decimal)
    test_csv_content_1 = """Relatório de Operações

Período: 01/01/2024 a 31/12/2024

Abertura;Fechamento;Res. Operação;Res. Operação (%)
01/01/2024 09:00:00;01/01/2024 10:00:00;100,00;10,00
02/01/2024 09:00:00;02/01/2024 10:00:00;50,00;5,00
03/01/2024 09:00:00;03/01/2024 10:00:00;-30,00;-3,00
"""
    
    # Teste 2: CSV com formato americano (ponto como decimal)
    test_csv_content_2 = """Relatório de Operações

Período: 01/01/2024 a 31/12/2024

Abertura;Fechamento;Res. Operação;Res. Operação (%)
01/01/2024 09:00:00;01/01/2024 10:00:00;100.00;10.00
02/01/2024 09:00:00;02/01/2024 10:00:00;50.00;5.00
03/01/2024 09:00:00;03/01/2024 10:00:00;-30.00;-3.00
"""
    
    # Teste 3: CSV com formato simples
    test_csv_content_3 = """Abertura;Fechamento;Res. Operação;Res. Operação (%)
01/01/2024 09:00:00;01/01/2024 10:00:00;100,00;10,00
02/01/2024 09:00:00;02/01/2024 10:00:00;50,00;5,00
03/01/2024 09:00:00;03/01/2024 10:00:00;-30,00;-3,00
"""
    
    test_cases = [
        ("Formato brasileiro", test_csv_content_1),
        ("Formato americano", test_csv_content_2),
        ("Formato simples", test_csv_content_3)
    ]
    
    for i, (name, content) in enumerate(test_cases, 1):
        print(f"\n🔍 Teste {i}: {name}")
        
        # Salvar CSV de teste
        test_file = f"test_csv_{i}.csv"
        with open(test_file, 'w', encoding='latin1') as f:
            f.write(content)
        
        try:
            # Testar carregamento local primeiro
            print(f"  📁 Testando carregamento local...")
            try:
                # Testar diferentes valores de skiprows
                for skiprows in [0, 1, 2, 3, 4, 5]:
                    try:
                        df = pd.read_csv(test_file, skiprows=skiprows, sep=';', encoding='latin1', decimal=',')
                        print(f"    ✅ skiprows={skiprows}: {list(df.columns)}")
                        if 'Abertura' in df.columns:
                            print(f"    🎯 ENCONTRADO! skiprows={skiprows} funciona")
                            break
                    except Exception as e:
                        print(f"    ❌ skiprows={skiprows}: {e}")
                
                print(f"    📊 Linhas: {len(df)}")
                print(f"    📊 Primeiras linhas:")
                print(df.head())
            except Exception as e:
                print(f"    ❌ Erro no carregamento local: {e}")
            
            # Testar via API
            print(f"  🌐 Testando via API...")
            with open(test_file, 'rb') as f:
                files = {'file': (f'test_{i}.csv', f, 'text/csv')}
                response = requests.post(f"{base_url}/api/tabela", files=files, timeout=30)
            
            if response.status_code == 200:
                print(f"    ✅ API funcionou")
                data = response.json()
                print(f"    📊 Dados recebidos: {len(data)} campos")
            else:
                print(f"    ❌ Erro na API: {response.status_code}")
                print(f"    📄 Resposta: {response.text}")
                
        except Exception as e:
            print(f"    ❌ Erro geral: {e}")
        finally:
            # Limpar arquivo de teste
            if os.path.exists(test_file):
                os.remove(test_file)
    
    print(f"\n✅ Testes concluídos!")

if __name__ == "__main__":
    test_csv_format() 