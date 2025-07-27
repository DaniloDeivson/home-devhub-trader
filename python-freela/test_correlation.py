#!/usr/bin/env python3
"""
Teste para verificar o endpoint de correlação
"""

import requests
import json
import os

def test_correlation():
    """Testa o endpoint de correlação"""
    
    base_url = "http://localhost:5002"
    
    # Criar CSV de teste
    test_csv_content = """Relatório de Operações

Período: 01/01/2024 a 31/12/2024

Abertura;Fechamento;Res. Operação;Res. Operação (%)
01/01/2024 09:00:00;01/01/2024 10:00:00;100,00;10,00
02/01/2024 09:00:00;02/01/2024 10:00:00;50,00;5,00
03/01/2024 09:00:00;03/01/2024 10:00:00;-30,00;-3,00
"""
    
    # Salvar CSV de teste
    test_file = "test_correlation.csv"
    with open(test_file, 'w', encoding='latin1') as f:
        f.write(test_csv_content)
    
    try:
        # Teste 1: FormData com arquivos
        print(f"🔍 Teste 1: FormData com arquivos")
        with open(test_file, 'rb') as f1, open(test_file, 'rb') as f2:
            files = [
                ('files', ('test1.csv', f1, 'text/csv')),
                ('files', ('test2.csv', f2, 'text/csv'))
            ]
            response = requests.post(f"{base_url}/api/correlacao", files=files, timeout=30)
        
        if response.status_code == 200:
            print(f"  ✅ FormData funcionou")
            data = response.json()
            print(f"  📊 Dados recebidos: {len(data)} campos")
        else:
            print(f"  ❌ Erro FormData: {response.status_code}")
            print(f"  📄 Resposta: {response.text}")
        
        # Teste 2: JSON com dados processados
        print(f"\n🔍 Teste 2: JSON com dados processados")
        
        # Primeiro, obter dados processados
        with open(test_file, 'rb') as f:
            files = {'file': ('test.csv', f, 'text/csv')}
            response = requests.post(f"{base_url}/api/tabela", files=files, timeout=30)
        
        if response.status_code == 200:
            processed_data = response.json()
            
            # Agora testar correlação com JSON
            correlation_data = {
                'arquivo1': processed_data,
                'arquivo2': processed_data
            }
            
            response = requests.post(
                f"{base_url}/api/correlacao", 
                headers={'Content-Type': 'application/json'},
                json=correlation_data,
                timeout=30
            )
            
            if response.status_code == 200:
                print(f"  ✅ JSON funcionou")
                data = response.json()
                print(f"  📊 Dados recebidos: {len(data)} campos")
            else:
                print(f"  ❌ Erro JSON: {response.status_code}")
                print(f"  📄 Resposta: {response.text}")
        else:
            print(f"  ❌ Erro ao obter dados processados: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro geral: {e}")
    finally:
        # Limpar arquivo de teste
        if os.path.exists(test_file):
            os.remove(test_file)
    
    print(f"\n✅ Testes concluídos!")

if __name__ == "__main__":
    test_correlation() 