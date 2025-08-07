import requests
import json
import sys

def test_production_api():
    """Testa a API em produção para diagnosticar problemas"""
    
    # URL base - ajuste conforme necessário
    base_url = "https://seu-dominio.com"  # Substitua pela URL real
    
    print("=== TESTE API PRODUÇÃO ===")
    
    # 1. Testar endpoint de health
    print("\n1. Testando endpoint /health...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health check funcionando")
            print(f"Resposta: {response.json()}")
        else:
            print(f"❌ Health check falhou: {response.text}")
    except Exception as e:
        print(f"❌ Erro no health check: {e}")
    
    # 2. Testar endpoint de teste de métricas
    print("\n2. Testando endpoint /api/test-metrics...")
    try:
        response = requests.post(f"{base_url}/api/test-metrics", 
                               headers={'Content-Type': 'application/json'},
                               timeout=30)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Teste de métricas funcionando")
            print(f"Resposta: {response.json()}")
        else:
            print(f"❌ Teste de métricas falhou: {response.text}")
    except Exception as e:
        print(f"❌ Erro no teste de métricas: {e}")
    
    # 3. Testar endpoint real com dados mínimos
    print("\n3. Testando endpoint /api/trades/metrics-from-data...")
    test_data = {
        'trades': [
            {
                'entry_date': '2024-01-01T10:00:00',
                'exit_date': '2024-01-01T10:30:00',
                'pnl': 100
            },
            {
                'entry_date': '2024-01-01T11:00:00',
                'exit_date': '2024-01-01T11:15:00',
                'pnl': -50
            }
        ],
        'capital_inicial': 100000,
        'cdi': 0.12
    }
    
    try:
        response = requests.post(f"{base_url}/api/trades/metrics-from-data", 
                               json=test_data,
                               headers={'Content-Type': 'application/json'},
                               timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ API de métricas funcionando")
            data = response.json()
            print(f"Resposta: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ API de métricas falhou")
            print(f"Resposta: {response.text}")
            
            # Tentar fazer parse da resposta de erro
            try:
                error_data = response.json()
                print(f"Erro detalhado: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Resposta não é JSON válido: {response.text[:500]}")
                
    except requests.exceptions.Timeout:
        print("❌ Timeout na requisição")
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão")
    except Exception as e:
        print(f"❌ Erro geral: {e}")
    
    # 4. Testar com dados maiores (simular o problema real)
    print("\n4. Testando com dados maiores...")
    large_test_data = {
        'trades': [
            {
                'entry_date': '2024-01-01T10:00:00',
                'exit_date': '2024-01-01T10:30:00',
                'pnl': 100,
                'symbol': 'WINFUT',
                'strategy': 'Teste'
            }
        ] * 100,  # 100 trades
        'capital_inicial': 100000,
        'cdi': 0.12
    }
    
    try:
        response = requests.post(f"{base_url}/api/trades/metrics-from-data", 
                               json=large_test_data,
                               headers={'Content-Type': 'application/json'},
                               timeout=60)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API com dados maiores funcionando")
            data = response.json()
            print(f"Tamanho da resposta: {len(json.dumps(data))} caracteres")
        else:
            print(f"❌ API com dados maiores falhou: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro com dados maiores: {e}")

if __name__ == "__main__":
    test_production_api() 