#!/usr/bin/env python3
"""
Script de teste específico para verificar a serialização dos dados de rentabilidade
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from main import carregar_csv_safe, make_json_serializable

def criar_csv_teste_rentabilidade(nome_arquivo):
    """Cria um CSV de teste com dados específicos para testar rentabilidade"""
    
    # Criar trades com valores conhecidos
    trades = []
    
    # Segunda-feira - 3 trades com lucro total de 300
    for i in range(3):
        trades.append({
            'Abertura': f'01/01/2024 09:00:00',
            'Fechamento': f'01/01/2024 10:00:00',
            'Res. Operação': '100.00',
            'Res. Operação (%)': '10.00'
        })
    
    # Terça-feira - 2 trades com prejuízo total de -200
    for i in range(2):
        trades.append({
            'Abertura': f'02/01/2024 09:00:00',
            'Fechamento': f'02/01/2024 10:00:00',
            'Res. Operação': '-100.00',
            'Res. Operação (%)': '-10.00'
        })
    
    # Janeiro - 5 trades com lucro total de 100
    for i in range(5):
        trades.append({
            'Abertura': f'15/01/2024 09:00:00',
            'Fechamento': f'15/01/2024 10:00:00',
            'Res. Operação': '20.00',
            'Res. Operação (%)': '2.00'
        })
    
    # Criar DataFrame
    df = pd.DataFrame(trades)
    
    # Adicionar cabeçalho do CSV
    cabecalho = [
        "Relatório de Operações",
        "",
        "Período: 01/01/2024 a 31/12/2024",
        "",
        "Abertura,Fechamento,Res. Operação,Res. Operação (%)"
    ]
    
    # Salvar CSV
    with open(nome_arquivo, 'w', encoding='latin1') as f:
        for linha in cabecalho:
            f.write(linha + '\n')
        
        # Salvar dados
        df.to_csv(f, index=False, sep=';', decimal=',')
    
    print(f"✅ CSV de teste criado: {nome_arquivo}")
    print(f"   - Segunda-feira: 3 trades, lucro total esperado: R$ 300.00")
    print(f"   - Terça-feira: 2 trades, prejuízo total esperado: R$ -200.00")
    print(f"   - Janeiro: 5 trades, lucro total esperado: R$ 100.00")

def testar_serializacao_rentabilidade():
    """Testa especificamente a serialização dos dados de rentabilidade"""
    
    arquivo_teste = "teste_rentabilidade_serializacao.csv"
    criar_csv_teste_rentabilidade(arquivo_teste)
    
    try:
        print("\n🔍 TESTANDO SERIALIZAÇÃO DE RENTABILIDADE...")
        
        # Carregar CSV
        with open(arquivo_teste, 'rb') as f:
            df = carregar_csv_safe(f)
        
        print(f"📊 Total de registros: {len(df)}")
        print(f"📊 Soma 'Res. Operação': {df['Res. Operação'].sum()}")
        
        # Testar análise por dia da semana
        print("\n📅 TESTANDO ANÁLISE POR DIA DA SEMANA:")
        dow_result = calcular_day_of_week(df, cdi=0.12)
        
        print("🔍 Resultado original:")
        print(f"  Stats keys: {list(dow_result['Stats'].keys())}")
        for day, stats in dow_result['Stats'].items():
            print(f"    {day}: {stats}")
        
        # Testar serialização
        print("\n🔍 Testando serialização:")
        dow_serializado = make_json_serializable(dow_result)
        print(f"  Stats keys após serialização: {list(dow_serializado['Stats'].keys())}")
        for day, stats in dow_serializado['Stats'].items():
            print(f"    {day} serializado: {stats}")
            rentabilidade = stats.get('Rentabilidade ($)', 0)
            print(f"      Rentabilidade ($): {rentabilidade} (tipo: {type(rentabilidade)})")
        
        # Testar análise mensal
        print("\n📅 TESTANDO ANÁLISE MENSAL:")
        monthly_result = calcular_monthly(df, cdi=0.12)
        
        print("🔍 Resultado original:")
        print(f"  Stats keys: {list(monthly_result['Stats'].keys())}")
        for month, stats in monthly_result['Stats'].items():
            print(f"    {month}: {stats}")
        
        # Testar serialização
        print("\n🔍 Testando serialização:")
        monthly_serializado = make_json_serializable(monthly_result)
        print(f"  Stats keys após serialização: {list(monthly_serializado['Stats'].keys())}")
        for month, stats in monthly_serializado['Stats'].items():
            print(f"    {month} serializado: {stats}")
            rentabilidade = stats.get('Rentabilidade ($)', 0)
            print(f"      Rentabilidade ($): {rentabilidade} (tipo: {type(rentabilidade)})")
        
        # Testar JSON serialization
        print("\n🔍 TESTANDO JSON SERIALIZATION:")
        try:
            json_str = json.dumps(monthly_serializado, indent=2)
            print("✅ JSON serialization bem-sucedida")
            print("📄 Primeiros 500 caracteres do JSON:")
            print(json_str[:500])
            
            # Testar deserialização
            json_parsed = json.loads(json_str)
            print("\n✅ JSON deserialization bem-sucedida")
            print(f"📊 Stats keys após JSON round-trip: {list(json_parsed['Stats'].keys())}")
            for month, stats in json_parsed['Stats'].items():
                rentabilidade = stats.get('Rentabilidade ($)', 0)
                print(f"    {month}: Rentabilidade ($) = {rentabilidade}")
                
        except Exception as e:
            print(f"❌ Erro na JSON serialization: {str(e)}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpar arquivo de teste
        if os.path.exists(arquivo_teste):
            os.remove(arquivo_teste)
            print(f"\n🗑️ Arquivo removido: {arquivo_teste}")

def testar_problema_especifico():
    """Testa um problema específico que pode estar causando o issue"""
    
    print("\n🔍 TESTANDO PROBLEMA ESPECÍFICO...")
    
    # Criar dados de teste diretamente
    test_data = {
        "Stats": {
            "Monday": {
                "Trades": 3,
                "Win Rate (%)": 100.0,
                "Net Profit": 300.0,
                "Profit Factor": 2.5,
                "Sharpe Ratio": 1.2,
                "Rentabilidade ($)": 300.0
            },
            "Tuesday": {
                "Trades": 2,
                "Win Rate (%)": 0.0,
                "Net Profit": -200.0,
                "Profit Factor": 0.0,
                "Sharpe Ratio": -1.0,
                "Rentabilidade ($)": -200.0
            }
        }
    }
    
    print("🔍 Dados de teste originais:")
    for day, stats in test_data["Stats"].items():
        print(f"    {day}: {stats}")
    
    # Testar serialização
    print("\n🔍 Após make_json_serializable:")
    serialized = make_json_serializable(test_data)
    for day, stats in serialized["Stats"].items():
        print(f"    {day}: {stats}")
        rentabilidade = stats.get('Rentabilidade ($)', 0)
        print(f"      Rentabilidade ($): {rentabilidade} (tipo: {type(rentabilidade)})")
    
    # Testar JSON
    print("\n🔍 Testando JSON:")
    try:
        json_str = json.dumps(serialized)
        print("✅ JSON OK")
        parsed = json.loads(json_str)
        for day, stats in parsed["Stats"].items():
            rentabilidade = stats.get('Rentabilidade ($)', 0)
            print(f"    {day}: Rentabilidade ($) = {rentabilidade}")
    except Exception as e:
        print(f"❌ JSON Error: {str(e)}")

if __name__ == "__main__":
    testar_serializacao_rentabilidade()
    testar_problema_especifico() 