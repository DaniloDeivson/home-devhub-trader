import requests
import json

print("=== TESTE API SIMPLES ===")

try:
    # Testar se o servidor está respondendo
    response = requests.get('http://localhost:5002/health')
    print(f"Health check: {response.status_code}")
    print(response.text)
    
    # Testar upload de arquivo simples
    csv_content = """entry_date,exit_date,pnl
2024-01-01T10:00:00,2024-01-01T10:30:00,100
2024-01-01T11:00:00,2024-01-01T11:15:00,-50
2024-01-01T12:00:00,2024-01-01T12:45:00,200
2024-01-01T13:00:00,2024-01-01T13:20:00,-100
2024-01-01T14:00:00,2024-01-01T14:30:00,150"""

    files = {'file': ('test.csv', csv_content, 'text/csv')}
    data = {'capital_inicial': '100000', 'cdi': '0.12'}
    
    print("\nEnviando dados para /api/tabela...")
    response = requests.post('http://localhost:5002/api/tabela', files=files, data=data)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("Resposta:")
        print(json.dumps(result, indent=2))
    else:
        print(f"Erro: {response.text}")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 