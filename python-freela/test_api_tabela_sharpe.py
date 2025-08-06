import requests
import json
import io
import pandas as pd

# Criar dados de teste
test_data = [
    {'entry_date': '2024-01-01T10:00:00', 'exit_date': '2024-01-01T10:30:00', 'pnl': 100},
    {'entry_date': '2024-01-01T11:00:00', 'exit_date': '2024-01-01T11:15:00', 'pnl': -50},
    {'entry_date': '2024-01-01T12:00:00', 'exit_date': '2024-01-01T12:45:00', 'pnl': 200},
    {'entry_date': '2024-01-01T13:00:00', 'exit_date': '2024-01-01T13:20:00', 'pnl': -100},
    {'entry_date': '2024-01-01T14:00:00', 'exit_date': '2024-01-01T14:30:00', 'pnl': 150}
]

# Criar CSV em memória
df = pd.DataFrame(test_data)
csv_buffer = io.StringIO()
df.to_csv(csv_buffer, index=False)
csv_content = csv_buffer.getvalue()

print("=== TESTE API /api/tabela - SHARPE RATIO ===")
print("Enviando dados para API...")

try:
    # Criar FormData
    files = {'file': ('test.csv', csv_content, 'text/csv')}
    data = {'capital_inicial': '100000', 'cdi': '0.12'}
    
    # Testar a rota /api/tabela (usada para 1 arquivo)
    response = requests.post('http://localhost:5002/api/tabela', 
                           files=files, 
                           data=data)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Resposta da API:")
        print(json.dumps(result, indent=2))
        
        # Verificar Performance Metrics
        performance_metrics = result.get("Performance Metrics", {})
        sharpe_ratio = performance_metrics.get("Sharpe Ratio", "NÃO ENCONTRADO")
        
        print(f"\n📊 Performance Metrics:")
        print(f"  Sharpe Ratio: {sharpe_ratio}")
        print(f"  Net Profit: {performance_metrics.get('Net Profit', 'N/A')}")
        print(f"  Total Trades: {performance_metrics.get('Total Trades', 'N/A')}")
        print(f"  Win Rate: {performance_metrics.get('Win Rate (%)', 'N/A')}")
        
        # Verificar se o valor é consistente
        if isinstance(sharpe_ratio, (int, float)) and sharpe_ratio != 0:
            print("✅ Sharpe Ratio calculado corretamente!")
        else:
            print("❌ Sharpe Ratio não calculado ou igual a 0")
        
        # Verificar se há Day of Week Analysis
        day_of_week = result.get("Day of Week Analysis", {})
        if day_of_week:
            print(f"\n📅 Day of Week Analysis encontrado:")
            stats = day_of_week.get("Stats", {})
            for day, day_stats in stats.items():
                if day_stats.get("Trades", 0) > 0:
                    print(f"  {day}: Sharpe Ratio = {day_stats.get('Sharpe Ratio', 'N/A')}")
        
    else:
        print(f"❌ Erro na API: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Erro ao conectar com API: {e}")
    print("Certifique-se de que o servidor está rodando em http://localhost:5002") 