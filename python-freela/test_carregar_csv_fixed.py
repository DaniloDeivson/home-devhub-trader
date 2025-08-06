import pandas as pd
import io
from FunCalculos import processar_backtest_completo

def carregar_csv_fixed(file_path_or_file):
    """Versão corrigida que detecta automaticamente o formato do CSV"""
    try:
        # Primeiro, tentar ler como CSV simples
        if hasattr(file_path_or_file, 'read'):
            file_path_or_file.seek(0)  # Reset file pointer
            df = pd.read_csv(file_path_or_file)
        else:
            df = pd.read_csv(file_path_or_file)
        
        # Se não tem as colunas esperadas, tentar formato específico
        expected_columns = ['entry_date', 'exit_date', 'pnl']
        if not all(col in df.columns for col in expected_columns):
            # Tentar formato específico
            if hasattr(file_path_or_file, 'read'):
                file_path_or_file.seek(0)
                df = pd.read_csv(file_path_or_file, skiprows=5, sep=';', encoding='latin1', decimal=',')
            else:
                df = pd.read_csv(file_path_or_file, skiprows=5, sep=';', encoding='latin1', decimal=',')
            
            # Renomear colunas se necessário
            column_mapping = {
                'Abertura': 'entry_date',
                'Fechamento': 'exit_date',
                'Res. Operação': 'pnl',
                'Res. Intervalo': 'pnl'
            }
            
            for old_col, new_col in column_mapping.items():
                if old_col in df.columns and new_col not in df.columns:
                    df[new_col] = df[old_col]
        
        # Converter datas se necessário
        if 'entry_date' in df.columns:
            df['entry_date'] = pd.to_datetime(df['entry_date'], errors='coerce')
        if 'exit_date' in df.columns:
            df['exit_date'] = pd.to_datetime(df['exit_date'], errors='coerce')
        
        # Converter pnl para numérico
        if 'pnl' in df.columns:
            df['pnl'] = pd.to_numeric(df['pnl'], errors='coerce')
        
        return df
                
    except Exception as e:
        raise ValueError(f"Erro ao processar CSV: {e}")

# Testar com CSV simples
csv_content = """entry_date,exit_date,pnl
2024-01-01T10:00:00,2024-01-01T10:30:00,100
2024-01-01T11:00:00,2024-01-01T11:15:00,-50
2024-01-01T12:00:00,2024-01-01T12:45:00,200
2024-01-01T13:00:00,2024-01-01T13:20:00,-100
2024-01-01T14:00:00,2024-01-01T14:30:00,150"""

print("=== TESTE CARREGAR_CSV_FIXED ===")

# Criar arquivo simulado
csv_buffer = io.StringIO(csv_content)
csv_buffer.name = 'test.csv'

try:
    print("=== TESTE 1: carregar_csv_fixed ===")
    df = carregar_csv_fixed(csv_buffer)
    
    print(f"DataFrame carregado: {len(df)} linhas")
    print("Colunas:", df.columns.tolist())
    print("Primeiras linhas:")
    print(df.head())
    
    print("\n=== TESTE 2: processar_backtest_completo ===")
    resultado = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)
    
    # Verificar Performance Metrics
    performance_metrics = resultado.get("Performance Metrics", {})
    print(f"\n📊 Performance Metrics:")
    print(f"  Sharpe Ratio: {performance_metrics.get('Sharpe Ratio', 'NÃO ENCONTRADO')}")
    print(f"  Net Profit: {performance_metrics.get('Net Profit', 'N/A')}")
    print(f"  Total Trades: {performance_metrics.get('Total Trades', 'N/A')}")
    
    if performance_metrics.get('Sharpe Ratio'):
        print("✅ Sharpe Ratio calculado corretamente!")
    else:
        print("❌ Sharpe Ratio não encontrado")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 