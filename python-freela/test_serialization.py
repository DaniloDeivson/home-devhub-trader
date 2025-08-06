import json
import numpy as np
from main import make_json_serializable

# Simular os dados que vêm do FunCalculos.py
test_data = {
    "metricas_principais": {
        "sharpe_ratio": -0.9474068775763789,
        "fator_recuperacao": -0.9976638925390569,
        "drawdown_maximo": -34245,
        "drawdown_maximo_pct": 0,
        "drawdown_medio": 25402.5,  # Este é o valor que deve chegar ao frontend
        "dias_operados": 13,
        "resultado_liquido": -34165,
        "fator_lucro": 0.006975730271762825,
        "win_rate": 20.0,
        "roi": -34.165
    }
}

print("=== TESTE SERIALIZAÇÃO JSON ===")
print("Dados originais:")
print(f"  DD Médio: {test_data['metricas_principais']['drawdown_medio']}")
print(f"  Tipo: {type(test_data['metricas_principais']['drawdown_medio'])}")

# Testar serialização
serialized = make_json_serializable(test_data)
print("\nApós make_json_serializable:")
print(f"  DD Médio: {serialized['metricas_principais']['drawdown_medio']}")
print(f"  Tipo: {type(serialized['metricas_principais']['drawdown_medio'])}")

# Testar JSON
try:
    json_str = json.dumps(serialized)
    print("\n✅ Serialização JSON bem-sucedida")
    print(f"Tamanho do JSON: {len(json_str)} caracteres")
    
    # Testar deserialização
    parsed = json.loads(json_str)
    print("\nApós deserialização:")
    print(f"  DD Médio: {parsed['metricas_principais']['drawdown_medio']}")
    print(f"  Tipo: {type(parsed['metricas_principais']['drawdown_medio'])}")
    
except Exception as e:
    print(f"❌ Erro na serialização JSON: {e}")

# Testar com valores numpy específicos
print("\n=== TESTE COM VALORES NUMPY ===")
numpy_data = {
    "metricas_principais": {
        "drawdown_medio": np.float64(25402.5),
        "sharpe_ratio": np.float64(-0.9474068775763789),
        "win_rate": np.float64(20.0)
    }
}

print("Dados com numpy:")
print(f"  DD Médio: {numpy_data['metricas_principais']['drawdown_medio']}")
print(f"  Tipo: {type(numpy_data['metricas_principais']['drawdown_medio'])}")

serialized_numpy = make_json_serializable(numpy_data)
print("\nApós make_json_serializable:")
print(f"  DD Médio: {serialized_numpy['metricas_principais']['drawdown_medio']}")
print(f"  Tipo: {type(serialized_numpy['metricas_principais']['drawdown_medio'])}")

try:
    json_str_numpy = json.dumps(serialized_numpy)
    print("✅ Serialização JSON com numpy bem-sucedida")
    
    parsed_numpy = json.loads(json_str_numpy)
    print(f"  DD Médio após deserialização: {parsed_numpy['metricas_principais']['drawdown_medio']}")
    
except Exception as e:
    print(f"❌ Erro na serialização JSON com numpy: {e}") 