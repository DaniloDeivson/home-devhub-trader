#!/usr/bin/env python3
"""
Script de teste específico para verificar o carregamento de CSVs e cálculo de rentabilidade
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from main import carregar_csv_safe

def criar_csv_teste_simples(nome_arquivo):
    """Cria um CSV de teste com dados simples e conhecidos"""
    
    # Criar trades com valores conhecidos
    trades = []
    
    # Segunda-feira - 5 trades com lucro total de 500
    for i in range(5):
        trades.append({
            'Abertura': f'01/01/2024 09:00:00',
            'Fechamento': f'01/01/2024 10:00:00',
            'Res. Operação': '100.00',
            'Res. Operação (%)': '10.00'
        })
    
    # Terça-feira - 3 trades com lucro total de 300
    for i in range(3):
        trades.append({
            'Abertura': f'02/01/2024 09:00:00',
            'Fechamento': f'02/01/2024 10:00:00',
            'Res. Operação': '100.00',
            'Res. Operação (%)': '10.00'
        })
    
    # Quarta-feira - 2 trades com prejuízo total de -200
    for i in range(2):
        trades.append({
            'Abertura': f'03/01/2024 09:00:00',
            'Fechamento': f'03/01/2024 10:00:00',
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
    
    print(f"✅ CSV de teste criado: {nome_arquivo}")
    print(f"   - Segunda-feira: 5 trades, lucro total esperado: R$ 500.00")
    print(f"   - Terça-feira: 3 trades, lucro total esperado: R$ 300.00")
    print(f"   - Quarta-feira: 2 trades, prejuízo total esperado: R$ -200.00")
    print(f"   - Total geral esperado: R$ 600.00")

def testar_carregamento_csv():
    """Testa o carregamento de CSV com ambas as funções"""
    
    arquivo_teste = "teste_csv_simples.csv"
    criar_csv_teste_simples(arquivo_teste)
    
    try:
        print("\n🔍 TESTANDO CARREGAMENTO DE CSV...")
        
        # Testar com carregar_csv (FunCalculos)
        print("\n📁 Testando carregar_csv (FunCalculos):")
        try:
            with open(arquivo_teste, 'rb') as f:
                df1 = carregar_csv(f)
            
            print(f"  ✅ Carregamento bem-sucedido")
            print(f"  📊 Total de registros: {len(df1)}")
            print(f"  📊 Colunas: {list(df1.columns)}")
            print(f"  📊 Soma 'Res. Operação': {df1['Res. Operação'].sum()}")
            print(f"  📊 Valores únicos 'Res. Operação': {df1['Res. Operação'].unique()}")
            
        except Exception as e:
            print(f"  ❌ Erro no carregamento: {str(e)}")
        
        # Testar com carregar_csv_safe (main)
        print("\n📁 Testando carregar_csv_safe (main):")
        try:
            with open(arquivo_teste, 'rb') as f:
                df2 = carregar_csv_safe(f)
            
            print(f"  ✅ Carregamento bem-sucedido")
            print(f"  📊 Total de registros: {len(df2)}")
            print(f"  📊 Colunas: {list(df2.columns)}")
            print(f"  📊 Soma 'Res. Operação': {df2['Res. Operação'].sum()}")
            print(f"  📊 Valores únicos 'Res. Operação': {df2['Res. Operação'].unique()}")
            
        except Exception as e:
            print(f"  ❌ Erro no carregamento: {str(e)}")
        
        # Comparar resultados
        if 'df1' in locals() and 'df2' in locals():
            print("\n🔍 COMPARAÇÃO DOS RESULTADOS:")
            print(f"  Soma df1 (carregar_csv): {df1['Res. Operação'].sum()}")
            print(f"  Soma df2 (carregar_csv_safe): {df2['Res. Operação'].sum()}")
            print(f"  São iguais? {df1['Res. Operação'].sum() == df2['Res. Operação'].sum()}")
        
        # Testar cálculo de rentabilidade
        print("\n🔍 TESTANDO CÁLCULO DE RENTABILIDADE...")
        
        if 'df1' in locals():
            print("\n📊 Usando df1 (carregar_csv):")
            try:
                # Testar análise por dia da semana
                dow_result = calcular_day_of_week(df1, cdi=0.12)
                print("  📅 Análise por Dia da Semana:")
                if 'Stats' in dow_result:
                    for dia, stats in dow_result['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        net_profit = stats.get('Net Profit', 0)
                        print(f"    {dia}: {trades} trades, Net Profit: {net_profit}, Rentabilidade: {rentabilidade}")
                
                # Testar análise mensal
                monthly_result = calcular_monthly(df1, cdi=0.12)
                print("  📅 Análise Mensal:")
                if 'Stats' in monthly_result:
                    for mes, stats in monthly_result['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"    {mes}: {trades} trades, Rentabilidade: {rentabilidade}")
                
            except Exception as e:
                print(f"  ❌ Erro no cálculo: {str(e)}")
        
        if 'df2' in locals():
            print("\n📊 Usando df2 (carregar_csv_safe):")
            try:
                # Testar análise por dia da semana
                dow_result = calcular_day_of_week(df2, cdi=0.12)
                print("  📅 Análise por Dia da Semana:")
                if 'Stats' in dow_result:
                    for dia, stats in dow_result['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        net_profit = stats.get('Net Profit', 0)
                        print(f"    {dia}: {trades} trades, Net Profit: {net_profit}, Rentabilidade: {rentabilidade}")
                
                # Testar análise mensal
                monthly_result = calcular_monthly(df2, cdi=0.12)
                print("  📅 Análise Mensal:")
                if 'Stats' in monthly_result:
                    for mes, stats in monthly_result['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"    {mes}: {trades} trades, Rentabilidade: {rentabilidade}")
                
            except Exception as e:
                print(f"  ❌ Erro no cálculo: {str(e)}")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpar arquivo de teste
        if os.path.exists(arquivo_teste):
            os.remove(arquivo_teste)
            print(f"\n🗑️ Arquivo removido: {arquivo_teste}")

if __name__ == "__main__":
    testar_carregamento_csv() 