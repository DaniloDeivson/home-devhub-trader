#!/usr/bin/env python3
"""
Teste final para verificar se a rentabilidade está sendo calculada corretamente
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from main import carregar_csv_safe
from FunMultiCalculos import processar_multiplos_arquivos

def criar_csv_teste_final(nome_arquivo):
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

def testar_rentabilidade_final():
    """Testa especificamente a rentabilidade com o código atualizado"""
    
    arquivo_teste = "teste_rentabilidade_final.csv"
    criar_csv_teste_final(arquivo_teste)
    
    try:
        print("\n🔍 TESTE FINAL DE RENTABILIDADE...")
        
        # Carregar CSV
        with open(arquivo_teste, 'rb') as f:
            df = carregar_csv_safe(f)
        
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
                print(f"    {day}: {trades} trades, Net Profit: {net_profit}, Rentabilidade: {rentabilidade}")
        
        # Testar análise mensal
        print("\n📅 TESTANDO ANÁLISE MENSAL:")
        monthly_result = calcular_monthly(df, cdi=0.12)
        
        print("🔍 Resultado:")
        for month, stats in monthly_result['Stats'].items():
            trades = stats.get('Trades', 0)
            rentabilidade = stats.get('Rentabilidade ($)', 0)
            net_profit = stats.get('Net Profit', 0)
            if trades > 0:
                print(f"    {month}: {trades} trades, Net Profit: {net_profit}, Rentabilidade: {rentabilidade}")
        
        # Testar processamento de múltiplos arquivos
        print("\n📁 TESTANDO PROCESSAMENTO DE MÚLTIPLOS ARQUIVOS:")
        
        # Criar arquivo simulado para o teste
        class MockFile:
            def __init__(self, filename, content):
                self.filename = filename
                self.content = content
                self.seek_pos = 0
            
            def read(self, size=None):
                if size is None:
                    return self.content[self.seek_pos:]
                else:
                    result = self.content[self.seek_pos:self.seek_pos + size]
                    self.seek_pos += size
                    return result
            
            def seek(self, pos):
                self.seek_pos = pos
        
        # Ler o arquivo de teste
        with open(arquivo_teste, 'rb') as f:
            content = f.read()
        
        # Criar arquivo mock
        mock_file = MockFile(arquivo_teste, content)
        
        # Testar processamento
        resultado, status_code = processar_multiplos_arquivos(
            files=[mock_file],
            carregar_csv_func=carregar_csv_safe,
            calcular_performance_func=lambda df: calcular_performance(df, cdi=0.12),
            calcular_day_of_week_func=lambda df: calcular_day_of_week(df, cdi=0.12),
            calcular_monthly_func=lambda df: calcular_monthly(df, cdi=0.12)
        )
        
        print(f"📊 Status code: {status_code}")
        
        if status_code == 200:
            print("✅ Processamento bem-sucedido")
            
            # Verificar Day of Week Analysis
            if 'Day of Week Analysis' in resultado:
                dow_analysis = resultado['Day of Week Analysis']
                if 'Stats' in dow_analysis:
                    print("\n📅 Day of Week Analysis:")
                    for day, stats in dow_analysis['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"    {day}: {trades} trades, Rentabilidade: {rentabilidade}")
            
            # Verificar Monthly Analysis
            if 'Monthly Analysis' in resultado:
                monthly_analysis = resultado['Monthly Analysis']
                if 'Stats' in monthly_analysis:
                    print("\n📅 Monthly Analysis:")
                    for month, stats in monthly_analysis['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"    {month}: {trades} trades, Rentabilidade: {rentabilidade}")
        else:
            print(f"❌ Erro no processamento: {resultado}")
        
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
    testar_rentabilidade_final() 