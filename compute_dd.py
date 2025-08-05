import pandas as pd
import io
import re
import sys
import csv
import math

def compute_max_dd(path):
    """Calcula drawdown consolidado exatamente como no Python de referência"""
    with open(path, 'r', encoding='latin-1') as f:
        lines = f.read().split('\n')
    
    # Encontrar header que começa com Ativo;
    header_idx = next((i for i,l in enumerate(lines) if l.startswith('Ativo;')), None)
    if header_idx is None:
        raise ValueError('Header not found')
    
    csv_text = '\n'.join(lines[header_idx:])
    
    # Remover pontos de milhares e trocar vírgula decimal por ponto
    processed = []
    for line in csv_text.split('\n'):
        if not line:
            continue
        # Remover . em milhares 
        line2 = re.sub(r'(\d)\.(?=\d{3},)', r'\1', line)
        # Converter vírgula decimal para ponto
        line2 = line2.replace(',', '.')
        processed.append(line2)
    
    csv_clean = '\n'.join(processed)
    df = pd.read_csv(io.StringIO(csv_clean), sep=';')
    
    # Converter coluna Total
    df['Total'] = pd.to_numeric(df['Total'], errors='coerce').fillna(0)
    
    # METODOLOGIA PYTHON PADRÃO (FunCalculos.py)
    # equity = pnl.cumsum() (começando do 0)
    equity = [0.0] + df['Total'].tolist()
    
    # Calcular peak, equity e drawdown como no Python
    max_peak = equity[0]
    max_dd = 0.0
    
    print(f"\nDebug {path}:")
    for i, val in enumerate(equity[:10]):  # Primeiros 10 pontos
        if val > max_peak:
            max_peak = val
        dd = max_peak - val  # saldo_maximo - saldo_atual
        if dd > max_dd:
            max_dd = dd
        print(f"  {i}: equity={val:.2f}, peak={max_peak:.2f}, dd={dd:.2f}")
    
    return max_dd

def compute_consolidated_dd():
    """Calcula drawdown consolidado de múltiplos arquivos"""
    print("=== CONSOLIDADO: Calculando DD de múltiplas estratégias ===")
    
    all_trades = []
    
    for fname in ['Topo Fundo 2min WIN.csv', 'Topo Fundo 2min WDO.csv']:
        try:
            with open(fname, 'r', encoding='latin-1') as f:
                lines = f.read().split('\n')
            
            # Encontrar header
            header_idx = next((i for i,l in enumerate(lines) if l.startswith('Ativo;')), None)
            if header_idx is None:
                continue
                
            csv_text = '\n'.join(lines[header_idx:])
            
            # Processar CSV
            processed = []
            for line in csv_text.split('\n'):
                if not line:
                    continue
                line2 = re.sub(r'(\d)\.(?=\d{3},)', r'\1', line)
                line2 = line2.replace(',', '.')
                processed.append(line2)
            
            csv_clean = '\n'.join(processed)
            df = pd.read_csv(io.StringIO(csv_clean), sep=';')
            df['Total'] = pd.to_numeric(df['Total'], errors='coerce').fillna(0)
            
            # Adicionar trades à lista consolidada
            for _, row in df.iterrows():
                all_trades.append({
                    'date': row.get('Data Saída', row.get('Data', '')),
                    'pnl': row['Total'],
                    'strategy': fname
                })
                
        except Exception as e:
            print(f"Erro ao processar {fname}: {e}")
    
    if not all_trades:
        return 0
    
    # Ordenar cronologicamente
    all_trades.sort(key=lambda x: x['date'])
    
    print(f"Total de trades consolidados: {len(all_trades)}")
    
    # Calcular equity consolidada
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    
    print("\nPrimeiros 10 pontos consolidados:")
    for i, trade in enumerate(all_trades[:10]):
        equity += trade['pnl']
        if equity > peak:
            peak = equity
        dd = peak - equity  # saldo_maximo - saldo_atual
        if dd > max_dd:
            max_dd = dd
        print(f"  {i+1}: {trade['strategy'][:3]} pnl={trade['pnl']:.2f} equity={equity:.2f} peak={peak:.2f} dd={dd:.2f}")
    
    # Processar todos os trades
    for trade in all_trades[10:]:
        equity += trade['pnl']
        if equity > peak:
            peak = equity
        dd = peak - equity
        if dd > max_dd:
            max_dd = dd
    
    print(f"\nEquity final: {equity:.2f}")
    print(f"Peak máximo: {peak:.2f}")
    print(f"Drawdown máximo consolidado: {max_dd:.2f}")
    
    return max_dd

# Calcular DD individual de cada estratégia
print("=== INDIVIDUAL: Drawdown de cada estratégia ===")
for fname in ['Topo Fundo 2min WIN.csv', 'Topo Fundo 2min WDO.csv']:
    try:
        dd = compute_max_dd(fname)
        print(f"{fname}: {dd:.2f}")
    except Exception as e:
        print(f"{fname}: erro - {e}")

print()

# Calcular DD consolidado
consolidated_dd = compute_consolidated_dd()
print(f"\n🎯 RESULTADO ESPERADO - DD Consolidado: {consolidated_dd:.2f}")