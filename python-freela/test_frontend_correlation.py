#!/usr/bin/env python3
"""
Teste para simular o comportamento do frontend
"""

import requests
import os

def test_frontend_behavior():
    """Testa o comportamento do frontend"""
    
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
    test_file = "test_frontend.csv"
    with open(test_file, 'w', encoding='latin1') as f:
        f.write(test_csv_content)
    
    try:
        # Simular o comportamento do frontend
        print(f"🔍 Simulando comportamento do frontend")
        
        # 1. Análises individuais (como o frontend faz)
        print(f"  1. Análises individuais...")
        with open(test_file, 'rb') as f1, open(test_file, 'rb') as f2:
            response1 = requests.post(f"{base_url}/api/tabela", files={'file': ('test1.csv', f1, 'text/csv')}, timeout=30)
            f1.seek(0)  # Resetar arquivo
            response2 = requests.post(f"{base_url}/api/tabela", files={'file': ('test2.csv', f1, 'text/csv')}, timeout=30)
        
        if response1.status_code == 200 and response2.status_code == 200:
            print(f"    ✅ Análises individuais funcionaram")
            
            # 2. Correlação com FormData (como o frontend agora faz)
            print(f"  2. Correlação com FormData...")
            with open(test_file, 'rb') as f1, open(test_file, 'rb') as f2:
                files = [
                    ('files', ('test1.csv', f1, 'text/csv')),
                    ('files', ('test2.csv', f2, 'text/csv'))
                ]
                correlation_response = requests.post(f"{base_url}/api/correlacao", files=files, timeout=30)
            
            if correlation_response.status_code == 200:
                print(f"    ✅ Correlação funcionou")
                data = correlation_response.json()
                print(f"    📊 Dados recebidos: {len(data)} campos")
            else:
                print(f"    ❌ Erro na correlação: {correlation_response.status_code}")
                print(f"    📄 Resposta: {correlation_response.text}")
        else:
            print(f"    ❌ Erro nas análises individuais")
            
    except Exception as e:
        print(f"❌ Erro geral: {e}")
    finally:
        # Limpar arquivo de teste
        if os.path.exists(test_file):
            os.remove(test_file)
    
    print(f"\n✅ Teste concluído!")

if __name__ == "__main__":
    test_frontend_behavior() 