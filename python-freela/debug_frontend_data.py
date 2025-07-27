#!/usr/bin/env python3
"""
Script para debugar a estrutura dos dados enviados para o frontend
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from main import carregar_csv_safe, make_json_serializable
from FunMultiCalculos import processar_multiplos_arquivos

def criar_csv_debug(nome_arquivo):
    """Cria um CSV de teste com dados específicos para debug"""
    
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
    
    print(f"✅ CSV de debug criado: {nome_arquivo}")

def debug_frontend_data():
    """Debuga a estrutura dos dados enviados para o frontend"""
    
    arquivo_teste = "debug_frontend.csv"
    criar_csv_debug(arquivo_teste)
    
    try:
        print("\n🔍 DEBUGANDO DADOS DO FRONTEND...")
        
        # Carregar CSV
        with open(arquivo_teste, 'rb') as f:
            df = carregar_csv_safe(f)
        
        print(f"📊 Total de registros: {len(df)}")
        print(f"📊 Soma 'Res. Operação': {df['Res. Operação'].sum()}")
        
        # Testar análise por dia da semana
        print("\n📅 ANÁLISE POR DIA DA SEMANA:")
        dow_result = calcular_day_of_week(df, cdi=0.12)
        
        print("🔍 Estrutura completa:")
        print(json.dumps(dow_result, indent=2, default=str))
        
        print("\n🔍 Stats detalhados:")
        for day, stats in dow_result['Stats'].items():
            print(f"  {day}:")
            for key, value in stats.items():
                print(f"    {key}: {value} (tipo: {type(value)})")
        
        # Testar análise mensal
        print("\n📅 ANÁLISE MENSAL:")
        monthly_result = calcular_monthly(df, cdi=0.12)
        
        print("🔍 Estrutura completa:")
        print(json.dumps(monthly_result, indent=2, default=str))
        
        print("\n🔍 Stats detalhados:")
        for month, stats in monthly_result['Stats'].items():
            print(f"  {month}:")
            for key, value in stats.items():
                print(f"    {key}: {value} (tipo: {type(value)})")
        
        # Testar serialização
        print("\n🔍 TESTANDO SERIALIZAÇÃO:")
        dow_serializado = make_json_serializable(dow_result)
        monthly_serializado = make_json_serializable(monthly_result)
        
        print("🔍 Day of Week após serialização:")
        for day, stats in dow_serializado['Stats'].items():
            print(f"  {day}:")
            for key, value in stats.items():
                print(f"    {key}: {value} (tipo: {type(value)})")
        
        print("🔍 Monthly após serialização:")
        for month, stats in monthly_serializado['Stats'].items():
            print(f"  {month}:")
            for key, value in stats.items():
                print(f"    {key}: {value} (tipo: {type(value)})")
        
        # Testar JSON completo
        print("\n🔍 TESTANDO JSON COMPLETO:")
        resultado_completo = {
            "Day of Week Analysis": dow_serializado,
            "Monthly Analysis": monthly_serializado
        }
        
        try:
            json_str = json.dumps(resultado_completo, indent=2)
            print("✅ JSON serialization bem-sucedida")
            print("📄 Estrutura JSON:")
            print(json_str)
            
            # Testar deserialização
            json_parsed = json.loads(json_str)
            print("\n✅ JSON deserialization bem-sucedida")
            
            # Verificar se os dados estão corretos após round-trip
            print("\n🔍 VERIFICAÇÃO APÓS ROUND-TRIP:")
            
            if 'Day of Week Analysis' in json_parsed:
                dow_parsed = json_parsed['Day of Week Analysis']
                if 'Stats' in dow_parsed:
                    for day, stats in dow_parsed['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"  {day}: {trades} trades, Rentabilidade: {rentabilidade}")
            
            if 'Monthly Analysis' in json_parsed:
                monthly_parsed = json_parsed['Monthly Analysis']
                if 'Stats' in monthly_parsed:
                    for month, stats in monthly_parsed['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"  {month}: {trades} trades, Rentabilidade: {rentabilidade}")
                
        except Exception as e:
            print(f"❌ Erro na JSON serialization: {str(e)}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Erro durante o debug: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpar arquivo de teste
        if os.path.exists(arquivo_teste):
            os.remove(arquivo_teste)
            print(f"\n🗑️ Arquivo removido: {arquivo_teste}")

if __name__ == "__main__":
    debug_frontend_data() 