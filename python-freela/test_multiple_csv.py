#!/usr/bin/env python3
"""
Script de teste para verificar a integração de rentabilidade para múltiplos CSVs
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly
from FunMultiCalculos import processar_multiplos_arquivos

def criar_csv_teste(nome_arquivo, num_trades=50, lucro_medio=100):
    """Cria um CSV de teste com dados simulados"""
    
    # Gerar datas aleatórias
    data_inicio = datetime(2024, 1, 1)
    datas = [data_inicio + timedelta(days=np.random.randint(0, 365)) for _ in range(num_trades)]
    datas = sorted(datas)
    
    # Gerar trades com lucro variável
    trades = []
    for i, data in enumerate(datas):
        # Lucro aleatório com tendência positiva
        lucro = np.random.normal(lucro_medio, lucro_medio * 0.5)
        
        # Horário aleatório
        hora_abertura = np.random.randint(9, 17)
        minuto_abertura = np.random.randint(0, 60)
        hora_fechamento = hora_abertura + np.random.randint(1, 4)
        minuto_fechamento = np.random.randint(0, 60)
        
        data_abertura = data.replace(hour=hora_abertura, minute=minuto_abertura)
        data_fechamento = data.replace(hour=hora_fechamento, minute=minuto_fechamento)
        
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
    
    print(f"✅ CSV de teste criado: {nome_arquivo}")

def testar_multiplos_csv():
    """Testa o processamento de múltiplos CSVs"""
    
    # Criar CSVs de teste
    arquivos_teste = [
        "teste_csv_1.csv",
        "teste_csv_2.csv", 
        "teste_csv_3.csv"
    ]
    
    # Criar CSVs com diferentes lucros
    lucros = [50, 150, 200]
    for i, (arquivo, lucro) in enumerate(zip(arquivos_teste, lucros)):
        criar_csv_teste(arquivo, num_trades=30, lucro_medio=lucro)
    
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
        
        print("\n🔍 TESTANDO PROCESSAMENTO DE MÚLTIPLOS CSVs...")
        
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
            
            # Verificar informações dos arquivos
            arquivos_info = resultado.get('arquivos_info', {})
            print(f"📊 Total de arquivos: {arquivos_info.get('total_arquivos', 0)}")
            print(f"📊 Total de trades consolidados: {arquivos_info.get('total_trades_consolidado', 0)}")
            print(f"📊 Soma PnL consolidada: {arquivos_info.get('soma_pnl_consolidada', 0)}")
            
            # Verificar análise por dia da semana
            dow_analysis = resultado.get('Day of Week Analysis', {})
            if 'Stats' in dow_analysis:
                print("\n📅 ANÁLISE POR DIA DA SEMANA:")
                for dia, stats in dow_analysis['Stats'].items():
                    trades = stats.get('Trades', 0)
                    rentabilidade = stats.get('Rentabilidade ($)', 0)
                    print(f"  {dia}: {trades} trades, R$ {rentabilidade:.2f}")
            
            # Verificar análise mensal
            monthly_analysis = resultado.get('Monthly Analysis', {})
            if 'Stats' in monthly_analysis:
                print("\n📅 ANÁLISE MENSAL:")
                for mes, stats in monthly_analysis['Stats'].items():
                    trades = stats.get('Trades', 0)
                    rentabilidade = stats.get('Rentabilidade ($)', 0)
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
    testar_multiplos_csv() 