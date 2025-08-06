import requests
import json

# Simular upload de 1 arquivo CSV
test_data = {
    'trades': [
        {'entry_date': '2024-01-01T10:00:00', 'exit_date': '2024-01-01T10:30:00', 'pnl': 100},
        {'entry_date': '2024-01-01T11:00:00', 'exit_date': '2024-01-01T11:15:00', 'pnl': -50},
        {'entry_date': '2024-01-01T12:00:00', 'exit_date': '2024-01-01T12:45:00', 'pnl': 200},
        {'entry_date': '2024-01-01T13:00:00', 'exit_date': '2024-01-01T13:20:00', 'pnl': -100},
        {'entry_date': '2024-01-01T14:00:00', 'exit_date': '2024-01-01T14:30:00', 'pnl': 150}
    ],
    'capital_inicial': 100000,
    'cdi': 0.12
}

print("=== TESTE SHARPE RATIO - 1 ARQUIVO ===")
print("Enviando dados para API...")

try:
    # Testar a rota /api/trades/metrics-from-data (usada para 1 arquivo)
    response = requests.post('http://localhost:5000/api/trades/metrics-from-data', 
                           json=test_data, 
                           headers={'Content-Type': 'application/json'})
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Resposta da API:")
        print(json.dumps(data, indent=2))
        
        # Verificar Sharpe Ratio
        sharpe_ratio = data.get('metricas_principais', {}).get('sharpe_ratio', 'NÃO ENCONTRADO')
        
        print(f"\n📊 Sharpe Ratio: {sharpe_ratio}")
        
        # Verificar se o valor é consistente
        if isinstance(sharpe_ratio, (int, float)) and sharpe_ratio != 0:
            print("✅ Sharpe Ratio calculado corretamente!")
        else:
            print("❌ Sharpe Ratio não calculado ou igual a 0")
        
    else:
        print(f"❌ Erro na API: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Erro ao conectar com API: {e}")
    print("Certifique-se de que o servidor está rodando em http://localhost:5000") 