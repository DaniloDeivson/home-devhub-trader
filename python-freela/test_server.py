#!/usr/bin/env python3
"""
Script de teste para verificar se o servidor está funcionando
"""

import requests
import json
import os

def test_server():
    """Testa se o servidor está rodando e respondendo"""
    
    base_url = "http://localhost:5002"
    
    # Teste 1: Verificar se o servidor está rodando
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ Servidor está rodando na porta 5002")
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando na porta 5002")
        print("💡 Execute: python start_server.py")
        return False
    except Exception as e:
        print(f"❌ Erro ao conectar com servidor: {e}")
        return False
    
    # Teste 2: Criar um CSV de teste com formato correto
    test_csv_content = """Relatório de Operações

Período: 01/01/2024 a 31/12/2024

Abertura;Fechamento;Res. Operação;Res. Operação (%)
01/01/2024 09:00:00;01/01/2024 10:00:00;100,00;10,00
02/01/2024 09:00:00;02/01/2024 10:00:00;50,00;5,00
03/01/2024 09:00:00;03/01/2024 10:00:00;-30,00;-3,00
"""
    
    # Salvar CSV de teste
    test_file = "test_server.csv"
    with open(test_file, 'w', encoding='latin1') as f:
        f.write(test_csv_content)
    
    try:
        # Teste 3: Enviar arquivo para o servidor
        with open(test_file, 'rb') as f:
            files = {'file': ('test.csv', f, 'text/csv')}
            response = requests.post(f"{base_url}/api/tabela", files=files, timeout=30)
        
        if response.status_code == 200:
            print("✅ API /api/tabela está funcionando")
            data = response.json()
            print(f"📊 Dados recebidos: {len(data)} campos")
            
            # Verificar se há dados de performance
            if "Performance Metrics" in data:
                metrics = data["Performance Metrics"]
                print(f"📈 Net Profit: {metrics.get('Net Profit', 'N/A')}")
                print(f"📈 Profit Factor: {metrics.get('Profit Factor', 'N/A')}")
                print(f"📈 Win Rate: {metrics.get('Win Rate (%)', 'N/A')}%")
            
            # Verificar se há dados de equity curve
            if "Equity Curve Data" in data:
                equity_data = data["Equity Curve Data"]
                print(f"📊 Equity Curve Data: {len(equity_data.get('trade_by_trade', []))} pontos")
            
        else:
            print(f"❌ Erro na API: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao testar API: {e}")
        return False
    finally:
        # Limpar arquivo de teste
        if os.path.exists(test_file):
            os.remove(test_file)
    
    print("✅ Todos os testes passaram!")
    return True

if __name__ == "__main__":
    test_server() 