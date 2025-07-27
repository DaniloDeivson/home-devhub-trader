#!/usr/bin/env python3
"""
Script para testar se os dados reais estão sendo processados corretamente
e se a rentabilidade está sendo calculada baseada no histórico de operações
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from main import carregar_csv_safe, make_json_serializable
from FunMultiCalculos import processar_multiplos_arquivos

def criar_csv_real_simulado(nome_arquivo):
    """Cria um CSV simulado com dados reais de operações"""
    
    # Criar trades com dados realistas
    trades = []
    
    # Janeiro - 15 trades com lucro total de 1500
    for i in range(15):
        trades.append({
            'Abertura': f'15/01/2024 09:00:00',
            'Fechamento': f'15/01/2024 10:00:00',
            'Res. Operação': '100.00',
            'Res. Operação (%)': '10.00'
        })
    
    # Fevereiro - 10 trades com prejuízo total de -800
    for i in range(10):
        trades.append({
            'Abertura': f'15/02/2024 09:00:00',
            'Fechamento': f'15/02/2024 10:00:00',
            'Res. Operação': '-80.00',
            'Res. Operação (%)': '-8.00'
        })
    
    # Março - 20 trades com lucro total de 2000
    for i in range(20):
        trades.append({
            'Abertura': f'15/03/2024 09:00:00',
            'Fechamento': f'15/03/2024 10:00:00',
            'Res. Operação': '100.00',
            'Res. Operação (%)': '10.00'
        })
    
    # Segunda-feira - 8 trades com lucro total de 800
    for i in range(8):
        trades.append({
            'Abertura': f'01/01/2024 09:00:00',  # Segunda-feira
            'Fechamento': f'01/01/2024 10:00:00',
            'Res. Operação': '100.00',
            'Res. Operação (%)': '10.00'
        })
    
    # Terça-feira - 5 trades com prejuízo total de -500
    for i in range(5):
        trades.append({
            'Abertura': f'02/01/2024 09:00:00',  # Terça-feira
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
    
    print(f"✅ CSV real simulado criado: {nome_arquivo}")
    print(f"   - Janeiro: 15 trades, lucro total esperado: R$ 1.500,00")
    print(f"   - Fevereiro: 10 trades, prejuízo total esperado: R$ -800,00")
    print(f"   - Março: 20 trades, lucro total esperado: R$ 2.000,00")
    print(f"   - Segunda-feira: 8 trades, lucro total esperado: R$ 800,00")
    print(f"   - Terça-feira: 5 trades, prejuízo total esperado: R$ -500,00")
    print(f"   - Total geral esperado: R$ 3.000,00")

def testar_dados_reais():
    """Testa se os dados reais estão sendo processados corretamente"""
    
    arquivo_teste = "teste_dados_reais.csv"
    criar_csv_real_simulado(arquivo_teste)
    
    try:
        print("\n🔍 TESTANDO DADOS REAIS...")
        
        # Carregar CSV
        with open(arquivo_teste, 'rb') as f:
            df = carregar_csv_safe(f)
        
        print(f"📊 Total de registros: {len(df)}")
        print(f"📊 Soma 'Res. Operação': {df['Res. Operação'].sum()}")
        print(f"📊 Valores únicos 'Res. Operação': {df['Res. Operação'].unique()}")
        
        # Verificar se os dados estão corretos
        expected_total = 1500 + (-800) + 2000  # Janeiro + Fevereiro + Março
        actual_total = df['Res. Operação'].sum()
        
        print(f"📊 Total esperado: {expected_total}")
        print(f"📊 Total real: {actual_total}")
        print(f"📊 Dados corretos? {abs(expected_total - actual_total) < 0.01}")
        
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
        
        # Verificar se a rentabilidade está correta
        print("\n🔍 VERIFICANDO RENTABILIDADE:")
        
        # Verificar Monday
        monday_stats = dow_result['Stats'].get('Monday', {})
        monday_rentabilidade = monday_stats.get('Rentabilidade ($)', 0)
        expected_monday = 800  # 8 trades * 100
        print(f"    Monday - Esperado: {expected_monday}, Real: {monday_rentabilidade}, Correto: {abs(monday_rentabilidade - expected_monday) < 0.01}")
        
        # Verificar Tuesday
        tuesday_stats = dow_result['Stats'].get('Tuesday', {})
        tuesday_rentabilidade = tuesday_stats.get('Rentabilidade ($)', 0)
        expected_tuesday = -500  # 5 trades * -100
        print(f"    Tuesday - Esperado: {expected_tuesday}, Real: {tuesday_rentabilidade}, Correto: {abs(tuesday_rentabilidade - expected_tuesday) < 0.01}")
        
        # Verificar January
        january_stats = monthly_result['Stats'].get('January', {})
        january_rentabilidade = january_stats.get('Rentabilidade ($)', 0)
        expected_january = 1500  # 15 trades * 100
        print(f"    January - Esperado: {expected_january}, Real: {january_rentabilidade}, Correto: {abs(january_rentabilidade - expected_january) < 0.01}")
        
        # Verificar February
        february_stats = monthly_result['Stats'].get('February', {})
        february_rentabilidade = february_stats.get('Rentabilidade ($)', 0)
        expected_february = -800  # 10 trades * -80
        print(f"    February - Esperado: {expected_february}, Real: {february_rentabilidade}, Correto: {abs(february_rentabilidade - expected_february) < 0.01}")
        
        # Verificar March
        march_stats = monthly_result['Stats'].get('March', {})
        march_rentabilidade = march_stats.get('Rentabilidade ($)', 0)
        expected_march = 2000  # 20 trades * 100
        print(f"    March - Esperado: {expected_march}, Real: {march_rentabilidade}, Correto: {abs(march_rentabilidade - expected_march) < 0.01}")
        
        # Testar processamento de múltiplos arquivos
        print("\n📁 TESTANDO PROCESSAMENTO DE MÚLTIPLOS ARQUIVOS:")
        
        # Criar segundo arquivo
        arquivo_teste2 = "teste_dados_reais2.csv"
        criar_csv_real_simulado(arquivo_teste2)
        
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
        
        # Ler os arquivos de teste
        with open(arquivo_teste, 'rb') as f:
            content1 = f.read()
        
        with open(arquivo_teste2, 'rb') as f:
            content2 = f.read()
        
        # Criar arquivos mock
        mock_file1 = MockFile(arquivo_teste, content1)
        mock_file2 = MockFile(arquivo_teste2, content2)
        
        # Testar processamento
        resultado, status_code = processar_multiplos_arquivos(
            files=[mock_file1, mock_file2],
            carregar_csv_func=carregar_csv_safe,
            calcular_performance_func=lambda df: calcular_performance(df, cdi=0.12),
            calcular_day_of_week_func=lambda df: calcular_day_of_week(df, cdi=0.12),
            calcular_monthly_func=lambda df: calcular_monthly(df, cdi=0.12)
        )
        
        print(f"📊 Status code: {status_code}")
        
        if status_code == 200:
            print("✅ Processamento de múltiplos arquivos bem-sucedido")
            
            # Verificar se os dados consolidados estão corretos
            total_trades = resultado.get('arquivos_info', {}).get('total_trades_consolidado', 0)
            print(f"📊 Total de trades consolidados: {total_trades}")
            
            # Verificar Day of Week Analysis consolidado
            if 'Day of Week Analysis' in resultado:
                dow_analysis = resultado['Day of Week Analysis']
                if 'Stats' in dow_analysis:
                    print("\n📅 Day of Week Analysis Consolidado:")
                    for day, stats in dow_analysis['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"    {day}: {trades} trades, Rentabilidade: {rentabilidade}")
            
            # Verificar Monthly Analysis consolidado
            if 'Monthly Analysis' in resultado:
                monthly_analysis = resultado['Monthly Analysis']
                if 'Stats' in monthly_analysis:
                    print("\n📅 Monthly Analysis Consolidado:")
                    for month, stats in monthly_analysis['Stats'].items():
                        trades = stats.get('Trades', 0)
                        rentabilidade = stats.get('Rentabilidade ($)', 0)
                        if trades > 0:
                            print(f"    {month}: {trades} trades, Rentabilidade: {rentabilidade}")
        else:
            print(f"❌ Erro no processamento: {resultado}")
        
        # Limpar segundo arquivo
        if os.path.exists(arquivo_teste2):
            os.remove(arquivo_teste2)
        
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
    testar_dados_reais() 