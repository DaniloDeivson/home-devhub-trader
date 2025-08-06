import requests
import json

print("=== TESTE DIRETO API ===")

try:
    # Testar se o servidor está respondendo
    print("1. Testando health check...")
    response = requests.get('http://localhost:5002/health')
    print(f"Health check: {response.status_code}")
    print(response.text)
    
    # Testar POST simples
    print("\n2. Testando POST simples...")
    data = {'test': 'data'}
    response = requests.post('http://localhost:5002/api/tabela', data=data)
    print(f"POST simples: {response.status_code}")
    print(response.text)
    
    # Testar com arquivo
    print("\n3. Testando com arquivo...")
    csv_content = "entry_date,exit_date,pnl\n2024-01-01T10:00:00,2024-01-01T10:30:00,100"
    files = {'file': ('test.csv', csv_content, 'text/csv')}
    data = {'capital_inicial': '100000', 'cdi': '0.12'}
    
    response = requests.post('http://localhost:5002/api/tabela', files=files, data=data)
    print(f"POST com arquivo: {response.status_code}")
    print(response.text)
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 