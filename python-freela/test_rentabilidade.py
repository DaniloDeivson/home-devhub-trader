#!/usr/bin/env python3
"""
Script de teste específico para verificar o problema da rentabilidade
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from FunMultiCalculos import processar_multiplos_arquivos

def criar_csv_simples(nome_arquivo, lucro_por_trade=100):
    """Cria um CSV simples com trades lucrativos"""
    
    # Criar trades para diferentes dias da semana
    trades = []
    dias_semana = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    for i, dia in enumerate(dias_semana):
        # Criar 10 trades para cada dia
        for j in range(10):
            # Data base: segunda-feira da primeira semana de janeiro
            data_base = datetime(2024, 1, 1)  # Segunda-feira
            data_trade = data_base + timedelta(days=i + (j * 7))  # Uma semana entre trades
            
            # Horário aleatório
            hora = np.random.randint(9, 17)
            minuto = np.random.randint(0, 60)
            data_abertura = data_trade.replace(hour=hora, minute=minuto)
            data_fechamento = data_abertura + timedelta(hours=np.random.randint(1, 4))
            
            # Lucro variável (alguns positivos, alguns negativos)
            lucro = np.random.choice([lucro_por_trade, -lucro_por_trade * 0.5], p=[0.6, 0.4])
            
            trades.append({
                'Abertura': data_abertura.strftime('%d/%m/%Y %H:%M:%S'),
                'Fechamento': data_fechamento.strftime('%d/%m/%Y %H:%M:%S'),
                'Res. Operação': f"{lucro:.2f}",
                'Res. Operação (%)': f"{(lucro/1000)*100:.2f}"
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
    
    print(f"✅ CSV criado: {nome_arquivo} com {len(trades)} trades")

def testar_rentabilidade():
    """Testa especificamente o cálculo de rentabilidade"""
    
    # Criar CSVs de teste
    arquivos_teste = ["teste_rentabilidade_1.csv", "teste_rentabilidade_2.csv"]
    
    for i, arquivo in enumerate(arquivos_teste):
        criar_csv_simples(arquivo, lucro_por_trade=100 + (i * 50))
    
    try:
        # Simular arquivos de upload
        class MockFile:
            def __init__(self, filename):
                self.filename = filename
            
            def read(self):
                with open(self.filename, 'rb') as f:
                    return f.read()
        
        # Criar lista de arquivos mock
        files = [MockFile(arquivo) for arquivo in arquivos_teste]
        
        print("\n🔍 TESTANDO CÁLCULO DE RENTABILIDADE...")
        
        # Processar múltiplos arquivos
        resultado, status_code = processar_multiplos_arquivos(
            files=files,
            carregar_csv_func=carregar_csv,
            calcular_performance_func=lambda df: calcular_performance(df, cdi=0.12),
            calcular_day_of_week_func=lambda df: calcular_day_of_week(df, cdi=0.12),
            calcular_monthly_func=lambda df: calcular_monthly(df, cdi=0.12)
        )
        
        if status_code == 200:
            print("✅ Processamento bem-sucedido!")
            
            # Verificar análise por dia da semana
            dow_analysis = resultado.get('Day of Week Analysis', {})
            if 'Stats' in dow_analysis:
                print("\n📅 ANÁLISE POR DIA DA SEMANA:")
                total_rentabilidade = 0
                for dia, stats in dow_analysis['Stats'].items():
                    trades = stats.get('Trades', 0)
                    rentabilidade = stats.get('Rentabilidade ($)', 0)
                    net_profit = stats.get('Net Profit', 0)
                    total_rentabilidade += rentabilidade
                    
                    print(f"  {dia}:")
                    print(f"    Trades: {trades}")
                    print(f"    Net Profit: {net_profit}")
                    print(f"    Rentabilidade Total ($): {rentabilidade}")
                    print(f"    Profit Factor: {stats.get('Profit Factor', 0)}")
                    print(f"    Win Rate (%): {stats.get('Win Rate (%)', 0)}")
                    print()
                
                print(f"💰 TOTAL RENTABILIDADE (soma de todos os dias): R$ {total_rentabilidade:.2f}")
                
                # Verificar se há algum dia com rentabilidade zero mas trades > 0
                dias_com_problema = []
                for dia, stats in dow_analysis['Stats'].items():
                    trades = stats.get('Trades', 0)
                    rentabilidade = stats.get('Rentabilidade ($)', 0)
                    if trades > 0 and rentabilidade == 0:
                        dias_com_problema.append(dia)
                
                if dias_com_problema:
                    print(f"⚠️ DIAS COM PROBLEMA (trades > 0 mas rentabilidade = 0): {dias_com_problema}")
                else:
                    print("✅ Todos os dias com trades têm rentabilidade calculada corretamente")
            
            # Verificar análise mensal
            monthly_analysis = resultado.get('Monthly Analysis', {})
            if 'Stats' in monthly_analysis:
                print("\n📅 ANÁLISE MENSAL:")
                for mes, stats in monthly_analysis['Stats'].items():
                    trades = stats.get('Trades', 0)
                    rentabilidade = stats.get('Rentabilidade ($)', 0)
                    if trades > 0:
                        print(f"  {mes}: {trades} trades, R$ {rentabilidade:.2f}")
            
        else:
            print(f"❌ Erro no processamento: {resultado}")
            
    except Exception as e:
        print(f"❌ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpar arquivos de teste
        for arquivo in arquivos_teste:
            if os.path.exists(arquivo):
                os.remove(arquivo)
                print(f"🗑️ Arquivo removido: {arquivo}")

if __name__ == "__main__":
    testar_rentabilidade() 