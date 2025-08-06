import requests
import json
import io

print("=== TESTE API DEBUG ===")

try:
    # Testar com arquivo mais simples
    print("1. Testando com CSV simples...")
    csv_content = """entry_date,exit_date,pnl
2024-01-01T10:00:00,2024-01-01T10:30:00,100
2024-01-01T11:00:00,2024-01-01T11:15:00,-50"""
    
    print("CSV que será enviado:")
    print(csv_content)
    
    # Criar arquivo como BytesIO
    csv_buffer = io.BytesIO(csv_content.encode('utf-8'))
    csv_buffer.name = 'test.csv'
    
    files = {'file': ('test.csv', csv_buffer, 'text/csv')}
    data = {'capital_inicial': '100000', 'cdi': '0.12'}
    
    print("\nEnviando para API...")
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