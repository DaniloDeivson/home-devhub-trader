#!/usr/bin/env python3
"""
Script para testar a correção da rentabilidade (agora é lucro total, não médio)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from FunCalculos import carregar_csv, calcular_day_of_week, calcular_monthly

def criar_csv_teste_rentabilidade(nome_arquivo):
    """Cria um CSV de teste com dados conhecidos"""
    
    trades = []
    
    # Criar trades para diferentes dias da semana
    dias_semana = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    for i, dia in enumerate(dias_semana):
        # Criar 5 trades para cada dia
        for j in range(5):
            # Data base: segunda-feira da primeira semana de janeiro
            data_base = datetime(2024, 1, 1)  # Segunda-feira
            data_trade = data_base + timedelta(days=i + (j * 7))  # Uma semana entre trades
            
            # Horário aleatório
            hora = np.random.randint(9, 17)
            minuto = np.random.randint(0, 60)
            data_abertura = data_trade.replace(hour=hora, minute=minuto)
            data_fechamento = data_abertura + timedelta(hours=np.random.randint(1, 4))
            
            # Lucro fixo por dia (para facilitar o teste)
            lucro_por_dia = {
                'Monday': 100,      # 5 trades * 100 = 500 total
                'Tuesday': 200,     # 5 trades * 200 = 1000 total
                'Wednesday': -50,   # 5 trades * -50 = -250 total
                'Thursday': 150,    # 5 trades * 150 = 750 total
                'Friday': -100      # 5 trades * -100 = -500 total
            }
            
            lucro = lucro_por_dia[dia]
            
            trades.append({
                'Abertura': data_abertura.strftime('%d/%m/%Y %H:%M:%S'),
                'Fechamento': data_fechamento.strftime('%d/%m/%Y %H:%M:%S'),
                'Res. Operação': f"{lucro:.2f}",
                'Res. Operação (%)': f"{(lucro/1000)*100:.2f}"
            })
    
    # Criar DataFrame
    df = pd.DataFrame(trades)
    
    # Salvar CSV
    df.to_csv(nome_arquivo, index=False)
    
    print(f"✅ CSV criado: {nome_arquivo}")
    print(f"📊 Total de trades: {len(trades)}")
    print(f"📊 Soma total: {df['Res. Operação'].sum()}")

def testar_rentabilidade_corrigida():
    """Testa a correção da rentabilidade"""
    
    arquivo_teste = "teste_rentabilidade_corrigida.csv"
    criar_csv_teste_rentabilidade(arquivo_teste)
    
    try:
        print("\n🔍 TESTANDO RENTABILIDADE CORRIGIDA...")
        
        # Carregar CSV
        with open(arquivo_teste, 'rb') as f:
            df = carregar_csv(f)
        
        print(f"📊 Total de registros: {len(df)}")
        print(f"📊 Soma 'Res. Operação': {df['Res. Operação'].sum()}")
        
        # Testar análise por dia da semana
        print("\n📅 TESTANDO ANÁLISE POR DIA DA SEMANA:")
        dow_result = calcular_day_of_week(df, cdi=0.12)
        
        print("🔍 Resultado:")
        for day, stats in dow_result['Stats'].items():
            trades = stats.get('Trades', 0)
            rentabilidade = stats.get('Rentabilidade ($)', 0)
            net_profit = stats.get('Net Profit', 0)
            if trades > 0:
                print(f"    {day}: {trades} trades, Net Profit: {net_profit}, Rentabilidade Total: {rentabilidade}")
                print(f"      → Esperado: {trades * {'Monday': 100, 'Tuesday': 200, 'Wednesday': -50, 'Thursday': 150, 'Friday': -100}[day]}")
                print(f"      → Correto: {rentabilidade == trades * {'Monday': 100, 'Tuesday': 200, 'Wednesday': -50, 'Thursday': 150, 'Friday': -100}[day]}")
        
        # Testar análise mensal
        print("\n📅 TESTANDO ANÁLISE MENSAL:")
        monthly_result = calcular_monthly(df, cdi=0.12)
        
        print("🔍 Resultado:")
        for month, stats in monthly_result['Stats'].items():
            trades = stats.get('Trades', 0)
            rentabilidade = stats.get('Rentabilidade ($)', 0)
            net_profit = stats.get('Net Profit', 0)
            if trades > 0:
                print(f"    {month}: {trades} trades, Net Profit: {net_profit}, Rentabilidade Total: {rentabilidade}")
        
        print("\n✅ Teste concluído!")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpar arquivo de teste
        if os.path.exists(arquivo_teste):
            os.remove(arquivo_teste)
            print(f"🗑️ Arquivo removido: {arquivo_teste}")

if __name__ == "__main__":
    testar_rentabilidade_corrigida() 