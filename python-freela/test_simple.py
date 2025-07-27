#!/usr/bin/env python3
"""
Teste simples para verificar se o servidor está funcionando
"""

import requests
import json

def test_simple():
    """Teste simples para verificar se o servidor está rodando"""
    
    base_url = "http://localhost:5002"
    
    # Teste 1: Verificar se o servidor está rodando
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ Servidor está rodando na porta 5002")
        print(f"📊 Status: {response.status_code}")
        print(f"📊 Resposta: {response.text[:200]}...")
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando na porta 5002")
        print("💡 Execute: python start_server.py")
        return False
    except Exception as e:
        print(f"❌ Erro ao conectar com servidor: {e}")
        return False
    
    # Teste 2: Testar endpoint simples
    try:
        response = requests.post(f"{base_url}/api/tabela", timeout=10)
        print(f"📊 Teste POST /api/tabela sem arquivo:")
        print(f"  Status: {response.status_code}")
        print(f"  Resposta: {response.text}")
    except Exception as e:
        print(f"❌ Erro ao testar POST: {e}")
    
    return True

if __name__ == "__main__":
    test_simple() 