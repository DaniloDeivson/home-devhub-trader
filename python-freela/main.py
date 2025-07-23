from flask import Flask, request, jsonify
import os
from flask_cors import CORS
import openai
from FunMultiCalculos import processar_multiplos_arquivos, processar_multiplos_arquivos_comparativo
from Correlacao import *
from FunCalculos import carregar_csv, calcular_performance, calcular_day_of_week, calcular_monthly, processar_backtest_completo
import dotenv
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple

dotenv.load_dotenv()

# main.py
app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
# Configuração da chave da API do OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY") 

# ============ FUNÇÃO AUXILIAR PARA ENCODING ============

def clean_numeric_value(value):
    """Converte valores numéricos brasileiros para float"""
    if pd.isna(value) or value == '':
        return np.nan
    
    # Converter para string se não for
    str_value = str(value)
    
    # Remover espaços em branco
    str_value = str_value.strip()
    
    # Se já for um número, retornar
    if isinstance(value, (int, float)):
        return float(value)
    
    # Remover pontos (separador de milhares) e trocar vírgula por ponto
    # Exemplo: "371.520,00" -> "371520.00"
    if ',' in str_value:
        # Separar parte inteira da decimal
        parts = str_value.split(',')
        if len(parts) == 2:
            integer_part = parts[0].replace('.', '')  # Remove pontos da parte inteira
            decimal_part = parts[1]
            cleaned_value = f"{integer_part}.{decimal_part}"
        else:
            cleaned_value = str_value.replace('.', '').replace(',', '.')
    else:
        # Se não tem vírgula, pode ser que tenha apenas pontos como separadores de milhares
        # ou seja um número sem decimais
        if str_value.count('.') > 1:
            # Múltiplos pontos = separadores de milhares
            cleaned_value = str_value.replace('.', '')
        else:
            cleaned_value = str_value
    
    try:
        return float(cleaned_value)
    except ValueError:
        return np.nan

def carregar_csv_trades(file_path_or_file):
    """Carrega CSV da planilha de trades com mapeamento específico e parsing melhorado"""
    try:
        if hasattr(file_path_or_file, 'read'):
            # É um arquivo upload - usar mesmos parâmetros da função original
            df = pd.read_csv(file_path_or_file, skiprows=5, sep=';', encoding='latin1', decimal=',')
        else:
            # É um caminho de arquivo
            df = pd.read_csv(file_path_or_file, skiprows=5, sep=';', encoding='latin1', decimal=',')
        
        # Processar datas conforme função original
        df['Abertura']   = pd.to_datetime(df['Abertura'],   format="%d/%m/%Y %H:%M:%S", errors='coerce')
        df['Fechamento'] = pd.to_datetime(df['Fechamento'], format="%d/%m/%Y %H:%M:%S", errors='coerce')
        
        # Usar função de limpeza para valores numéricos
        numeric_columns = ['Res. Operação', 'Res. Operação (%)', 'Preço Compra', 'Preço Venda', 
                          'Preço de Mercado', 'Médio', 'Res. Intervalo', 'Res. Intervalo (%)',
                          'Drawdown', 'Ganho Max.', 'Perda Max.', 'Qtd Compra', 'Qtd Venda']
        
        for col in numeric_columns:
            if col in df.columns:
                df[col] = df[col].apply(clean_numeric_value)
        
        # Renomear colunas para padronizar
        column_mapping = {
            'Ativo': 'symbol',
            'Abertura': 'entry_date',
            'Fechamento': 'exit_date',
            'Tempo Operação': 'duration_str',
            'Qtd Compra': 'qty_buy',
            'Qtd Venda': 'qty_sell',
            'Lado': 'direction',
            'Preço Compra': 'entry_price',
            'Preço Venda': 'exit_price',
            'Preço de Mercado': 'market_price',
            'Médio': 'avg_price',
            'Res. Intervalo': 'pnl',
            'Res. Intervalo (%)': 'pnl_pct',
            'Número Operação': 'trade_number',
            'Res. Operação': 'operation_result',
            'Res. Operação (%)': 'operation_result_pct',
            'Drawdown': 'drawdown',
            'Ganho Max.': 'max_gain',
            'Perda Max.': 'max_loss',
            'TET': 'tet',
            'Total': 'total'
        }
        
        # Renomear colunas existentes
        df = df.rename(columns=column_mapping)
        
        # Converter direção para formato padrão
        if 'direction' in df.columns:
            df['direction'] = df['direction'].map({'C': 'long', 'V': 'short'}).fillna('long')
        
        # Usar os resultados já processados (agora com valores limpos)
        if 'operation_result' in df.columns:
            df['pnl'] = df['operation_result']
        if 'operation_result_pct' in df.columns:
            df['pnl_pct'] = df['operation_result_pct']
        
        # Calcular duração em horas se não existir
        if 'entry_date' in df.columns and 'exit_date' in df.columns:
            if df['entry_date'].notna().any() and df['exit_date'].notna().any():
                df['duration_hours'] = (df['exit_date'] - df['entry_date']).dt.total_seconds() / 3600
        
        return df
        
    except Exception as e:
        raise ValueError(f"Erro ao processar CSV: {e}")

# Também atualize a função carregar_csv_safe para usar a mesma lógica
def carregar_csv_safe(file_path_or_file):
    """Função auxiliar para carregar CSV com encoding seguro baseada na função original"""
    try:
        if hasattr(file_path_or_file, 'read'):
            # É um arquivo upload - usar mesmos parâmetros da função original
            df = pd.read_csv(file_path_or_file, skiprows=5, sep=';', encoding='latin1', decimal=',')
        else:
            # É um caminho de arquivo
            df = pd.read_csv(file_path_or_file, skiprows=5, sep=';', encoding='latin1', decimal=',')
        
        # Processar datas conforme função original
        df['Abertura']   = pd.to_datetime(df['Abertura'],   format="%d/%m/%Y %H:%M:%S", errors='coerce')
        df['Fechamento'] = pd.to_datetime(df['Fechamento'], format="%d/%m/%Y %H:%M:%S", errors='coerce')
        
        # Usar função de limpeza para valores numéricos
        numeric_columns = ['Res. Operação', 'Res. Operação (%)']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = df[col].apply(clean_numeric_value)
        
        return df
                
    except Exception as e:
        raise ValueError(f"Erro ao processar CSV: {e}")

def processar_trades(df: pd.DataFrame) -> List[Dict]:
    """Converte DataFrame em lista de trades para o frontend"""
    trades = []
    
    for _, row in df.iterrows():
        if pd.isna(row.get('entry_date')) or pd.isna(row.get('exit_date')):
            continue
            
        trade = {
            "entry_date": row['entry_date'].isoformat() if pd.notna(row['entry_date']) else None,
            "exit_date": row['exit_date'].isoformat() if pd.notna(row['exit_date']) else None,
            "entry_price": float(row.get('entry_price', 0)) if pd.notna(row.get('entry_price')) else 0,
            "exit_price": float(row.get('exit_price', 0)) if pd.notna(row.get('exit_price')) else 0,
            "pnl": float(row.get('pnl', 0)) if pd.notna(row.get('pnl')) else 0,
            "pnl_pct": float(row.get('pnl_pct', 0)) if pd.notna(row.get('pnl_pct')) else 0,
            "direction": row.get('direction', 'long'),
            "symbol": str(row.get('symbol', 'N/A')),
            "strategy": "Manual",  # Pode ser extraído de outros campos se disponível
            "quantity_total": int(row.get('qty_buy'))+int(row.get('qty_sell')) if pd.notna(row.get('qty_buy')) and pd.notna(row.get('qty_sell')) else 0,
            "quantity_compra": int(row.get('qty_buy', 0)) if pd.notna(row.get('qty_buy')) else 0,
            "quantity_venda": int(row.get('qty_sell', 0)) if pd.notna(row.get('qty_sell')) else 0,
            "duration": float(row.get('duration_hours', 0)) if pd.notna(row.get('duration_hours')) else 0,
            "drawdown": float(row.get('drawdown', 0)) if pd.notna(row.get('drawdown')) else 0,
            "max_gain": float(row.get('max_gain', 0)) if pd.notna(row.get('max_gain')) else 0,
            "max_loss": float(row.get('max_loss', 0)) if pd.notna(row.get('max_loss')) else 0
        }
        trades.append(trade)
    
    return trades

def calcular_estatisticas_temporais(df: pd.DataFrame) -> Dict[str, Any]:
    """Calcula estatísticas temporais com serialização JSON correta"""
    if df.empty or 'entry_date' not in df.columns:
        return {}
    
    df_valid = df.dropna(subset=['entry_date', 'pnl'])
    
    if df_valid.empty:
        return {}
    
    # Por dia da semana
    df_valid['day_of_week'] = df_valid['entry_date'].dt.day_name()
    day_stats = df_valid.groupby('day_of_week')['pnl'].agg(['count', 'sum', 'mean']).round(2)
    
    # Por mês - converter Period para string
    df_valid['month'] = df_valid['entry_date'].dt.to_period('M').astype(str)
    month_stats = df_valid.groupby('month')['pnl'].agg(['count', 'sum', 'mean']).round(2)
    
    # Por hora
    df_valid['hour'] = df_valid['entry_date'].dt.hour
    hour_stats = df_valid.groupby('hour')['pnl'].agg(['count', 'sum', 'mean']).round(2)
    
    # Converter DataFrames para dicionários JSON-serializáveis
    def convert_stats_to_dict(stats_df):
        result = {}
        for index, row in stats_df.iterrows():
            # Garantir que o índice seja string
            key = str(index)
            result[key] = {
                'count': int(row['count']) if pd.notna(row['count']) else 0,
                'sum': float(row['sum']) if pd.notna(row['sum']) else 0.0,
                'mean': float(row['mean']) if pd.notna(row['mean']) else 0.0
            }
        return result
    
    return {
        "day_of_week": convert_stats_to_dict(day_stats),
        "monthly": convert_stats_to_dict(month_stats),
        "hourly": convert_stats_to_dict(hour_stats)
    }

# Função auxiliar para garantir que todos os valores sejam JSON-serializáveis
def make_json_serializable(obj):
    """Converte objetos pandas/numpy para tipos Python nativos"""
    if isinstance(obj, dict):
        return {str(k): make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, (pd.Period, pd.Timestamp)):
        return str(obj)
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif pd.isna(obj):
        return None
    else:
        return obj

# Versão atualizada das outras funções de estatísticas para garantir serialização
def calcular_estatisticas_gerais(df: pd.DataFrame) -> Dict[str, Any]:
    """Calcula estatísticas gerais das trades com serialização JSON correta"""
    if df.empty:
        return {}
    
    # Filtrar trades válidas
    df_valid = df.dropna(subset=['pnl'])
    
    total_trades = len(df_valid)
    if total_trades == 0:
        return {}
    
    # Resultados básicos
    total_pnl = df_valid['pnl'].sum()
    winning_trades = len(df_valid[df_valid['pnl'] > 0])
    losing_trades = len(df_valid[df_valid['pnl'] < 0])
    break_even_trades = len(df_valid[df_valid['pnl'] == 0])
    
    # Win rate
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    
    # Médias
    avg_win = df_valid[df_valid['pnl'] > 0]['pnl'].mean() if winning_trades > 0 else 0
    avg_loss = df_valid[df_valid['pnl'] < 0]['pnl'].mean() if losing_trades > 0 else 0
    avg_trade = df_valid['pnl'].mean()
    
    # Máximos e mínimos
    best_trade = df_valid['pnl'].max()
    worst_trade = df_valid['pnl'].min()
    
    # Profit Factor
    gross_profit = df_valid[df_valid['pnl'] > 0]['pnl'].sum()
    gross_loss = abs(df_valid[df_valid['pnl'] < 0]['pnl'].sum())
    profit_factor = gross_profit / gross_loss if gross_loss != 0 else float('inf')
    
    # Expectativa
    expectancy = (win_rate/100 * avg_win) + ((100-win_rate)/100 * avg_loss)
    
    # Drawdown (se disponível)
    max_drawdown = df_valid['drawdown'].min() if 'drawdown' in df_valid.columns else 0
    
    # Criar resultado e garantir serialização JSON
    resultado = {
        "total_trades": int(total_trades),
        "winning_trades": int(winning_trades),
        "losing_trades": int(losing_trades),
        "break_even_trades": int(break_even_trades),
        "win_rate": float(round(win_rate, 2)),
        "total_pnl": float(round(total_pnl, 2)),
        "avg_win": float(round(avg_win, 2)),
        "avg_loss": float(round(avg_loss, 2)),
        "avg_trade": float(round(avg_trade, 2)),
        "best_trade": float(round(best_trade, 2)),
        "worst_trade": float(round(worst_trade, 2)),
        "profit_factor": float(round(profit_factor, 2)) if profit_factor != float('inf') else None,
        "expectancy": float(round(expectancy, 2)),
        "gross_profit": float(round(gross_profit, 2)),
        "gross_loss": float(round(gross_loss, 2)),
        "max_drawdown": float(round(max_drawdown, 2))
    }
    
    return make_json_serializable(resultado)

def calcular_estatisticas_por_ativo(df: pd.DataFrame) -> Dict[str, Any]:
    """Calcula estatísticas agrupadas por ativo com serialização JSON correta"""
    if df.empty or 'symbol' not in df.columns:
        return {}
    
    stats_by_asset = {}
    
    for symbol in df['symbol'].unique():
        if pd.isna(symbol):
            continue
            
        asset_df = df[df['symbol'] == symbol].dropna(subset=['pnl'])
        
        if len(asset_df) == 0:
            continue
            
        stats_by_asset[str(symbol)] = {
            "total_trades": int(len(asset_df)),
            "total_pnl": float(round(asset_df['pnl'].sum(), 2)),
            "win_rate": float(round((len(asset_df[asset_df['pnl'] > 0]) / len(asset_df)) * 100, 2)),
            "avg_trade": float(round(asset_df['pnl'].mean(), 2)),
            "best_trade": float(round(asset_df['pnl'].max(), 2)),
            "worst_trade": float(round(asset_df['pnl'].min(), 2))
        }
    
    return make_json_serializable(stats_by_asset)

def calcular_custos_operacionais(df: pd.DataFrame, taxa_corretagem: float = 0.5, taxa_emolumentos: float = 0.03) -> Dict[str, Any]:
    """Calcula custos operacionais estimados"""
    if df.empty:
        return {}
    
    df_valid = df.dropna(subset=['entry_price', 'exit_price'])
    total_trades = len(df_valid)
    
    # Calcular valor total operado
    df_valid['valor_entrada'] = df_valid['entry_price'] * df_valid.get('quantity', 1)
    df_valid['valor_saida'] = df_valid['exit_price'] * df_valid.get('quantity', 1)
    valor_total_operado = (df_valid['valor_entrada'] + df_valid['valor_saida']).sum()
    
    # Custos estimados
    custo_corretagem = total_trades * taxa_corretagem  # Taxa fixa por operação
    custo_emolumentos = valor_total_operado * (taxa_emolumentos / 100)  # Taxa percentual
    custo_total = custo_corretagem + custo_emolumentos
    
    return {
        "total_trades": total_trades,
        "valor_total_operado": round(valor_total_operado, 2),
        "custo_corretagem": round(custo_corretagem, 2),
        "custo_emolumentos": round(custo_emolumentos, 2),
        "custo_total": round(custo_total, 2),
        "custo_por_trade": round(custo_total / total_trades, 2) if total_trades > 0 else 0
    }

# ============ FUNÇÕES PARA MÉTRICAS DIÁRIAS ============

def calcular_metricas_diarias(df: pd.DataFrame) -> Dict[str, Any]:
    """Calcula métricas diárias baseadas nas trades"""
    if df.empty:
        return {}
    
    # Filtrar trades válidas
    df_valid = df.dropna(subset=['pnl', 'entry_date'])
    
    if df_valid.empty:
        return {}
    
    # Agrupar por dia
    df_valid['date'] = df_valid['entry_date'].dt.date
    daily_stats = df_valid.groupby('date').agg({
        'pnl': ['sum', 'count', 'mean'],
    }).round(2)
    
    daily_stats.columns = ['total_pnl', 'total_trades', 'avg_pnl']
    daily_stats['win_rate'] = df_valid.groupby('date').apply(
        lambda x: (x['pnl'] > 0).sum() / len(x) * 100
    ).round(2)
    
    # Calcular sequências de dias
    daily_stats['is_winner'] = daily_stats['total_pnl'] > 0
    daily_stats['is_loser'] = daily_stats['total_pnl'] < 0
    
    # Calcular drawdown
    daily_stats['cumulative_pnl'] = daily_stats['total_pnl'].cumsum()
    daily_stats['running_max'] = daily_stats['cumulative_pnl'].expanding().max()
    daily_stats['drawdown'] = daily_stats['cumulative_pnl'] - daily_stats['running_max']
    

    return daily_stats

def calcular_metricas_diarias_corrigido(df: pd.DataFrame) -> pd.DataFrame:
    """Calcula métricas diárias baseadas nas trades com drawdown correto"""
    if df.empty:
        return pd.DataFrame()
    
    # Filtrar trades válidas e ordenar por data
    df_valid = df.dropna(subset=['pnl', 'entry_date']).copy()
    df_valid = df_valid.sort_values('entry_date').reset_index(drop=True)
    
    if df_valid.empty:
        return pd.DataFrame()
    
    # Calcular saldo cumulativo (igual ao que fizemos nas outras funções)
    df_valid['saldo_cumulativo'] = df_valid['pnl'].cumsum()
    df_valid['saldo_maximo'] = df_valid['saldo_cumulativo'].cummax()
    df_valid['drawdown_trade'] = df_valid['saldo_cumulativo'] - df_valid['saldo_maximo']
    
    # Agrupar por dia
    df_valid['date'] = df_valid['entry_date'].dt.date
    
    # Calcular estatísticas diárias
    daily_stats = df_valid.groupby('date').agg({
        'pnl': ['sum', 'count', 'mean'],
        'saldo_cumulativo': 'last',  # Saldo final do dia
        'saldo_maximo': 'last',      # Pico até o final do dia
        'drawdown_trade': 'min'      # Pior drawdown do dia
    }).round(2)
    
    # Simplificar nomes das colunas
    daily_stats.columns = ['total_pnl', 'total_trades', 'avg_pnl', 'saldo_final', 'peak_final', 'drawdown_dia']
    
    # Calcular win rate diário
    win_rate_daily = df_valid.groupby('date')['pnl'].apply(
        lambda x: (x > 0).sum() / len(x) * 100
    ).round(2)
    daily_stats['win_rate'] = win_rate_daily
    
    # Calcular drawdown correto para o dia (baseado no saldo final vs pico final)
    daily_stats['drawdown'] = daily_stats['saldo_final'] - daily_stats['peak_final']
    
    # Adicionar colunas de controle
    daily_stats['is_winner'] = daily_stats['total_pnl'] > 0
    daily_stats['is_loser'] = daily_stats['total_pnl'] < 0
    
    # Calcular máximo histórico e drawdown cumulativo por dia
    daily_stats['running_max'] = daily_stats['saldo_final'].cummax()
    daily_stats['drawdown_cumulativo'] = daily_stats['saldo_final'] - daily_stats['running_max']
    
    return daily_stats.reset_index()


def calcular_metricas_principais(df: pd.DataFrame, taxa_juros_mensal: float = 0.01, capital_inicial: float = None) -> Dict[str, Any]:
    """
    Calcula as métricas principais do dashboard
    CORRIGIDO: Usa a mesma lógica de drawdown das outras funções
    E SHARPE RATIO com fórmula específica
    """
    if df.empty:
        return {}
    
    # Usar a função de métricas diárias corrigida
    daily_stats = calcular_metricas_diarias_corrigido(df)
    
    if daily_stats.empty:
        return {}
    
    # Calcular métricas globais usando os mesmos campos das outras funções
    df_valid = df.dropna(subset=['pnl', 'entry_date']).copy()
    df_valid = df_valid.sort_values('entry_date').reset_index(drop=True)
    
    # Calcular saldo cumulativo (igual às outras funções)
    df_valid['Saldo'] = df_valid['pnl'].cumsum()
    df_valid['Saldo_Maximo'] = df_valid['Saldo'].cummax()
    df_valid['Drawdown'] = df_valid['Saldo'] - df_valid['Saldo_Maximo']
    
    # Métricas gerais
    total_pnl = df_valid['pnl'].sum()
    total_trades = len(df_valid)
    winning_trades = len(df_valid[df_valid['pnl'] > 0])
    losing_trades = len(df_valid[df_valid['pnl'] < 0])
    
    # Payoff Ratio (Ganho médio / Perda média)
    avg_win = df_valid[df_valid['pnl'] > 0]['pnl'].mean() if winning_trades > 0 else 0
    avg_loss = abs(df_valid[df_valid['pnl'] < 0]['pnl'].mean()) if losing_trades > 0 else 0
    payoff_ratio = avg_win / avg_loss if avg_loss != 0 else 0
    
    # Drawdown máximo usando a mesma lógica das outras funções
    max_drawdown = abs(df_valid['Drawdown'].min())  # Valor positivo (absoluto)
    max_drawdown_pct = (max_drawdown / df_valid['Saldo'].iloc[-1] * 100) if df_valid['Saldo'].iloc[-1] != 0 else 0
    
    # CAPITAL INICIAL CORRIGIDO
    # Se não fornecido, calcular baseado no drawdown máximo
    if capital_inicial is None:
        # Método 1: Baseado no fato de que drawdown% = drawdown$ / saldo_final
        # Se drawdown% = 66.22% e drawdown$ = 835.8
        # Então: saldo_final = drawdown$ / (drawdown% / 100)
        saldo_final = df_valid['Saldo'].iloc[-1]  # 1262.2
        
        # Para calcular capital inicial, usar: capital = saldo_final + abs(saldo_minimo)
        saldo_minimo = df_valid['Saldo'].min()  # Ponto mais baixo
        capital_estimado = saldo_final + abs(saldo_minimo) if saldo_minimo < 0 else saldo_final + max_drawdown
        
        # Método alternativo: usar drawdown 3x como base mínima
        capital_por_drawdown = max_drawdown * 3  # 835.8 * 3 = 2507.4
        
        # Usar o maior entre os dois métodos para ser conservador
        capital_inicial = max(capital_estimado, capital_por_drawdown)
    
    # SHARPE RATIO CORRIGIDO - Fórmula específica
    # Calcular período em meses
    periodo_dias = (df_valid['entry_date'].max() - df_valid['entry_date'].min()).days
    periodo_meses = max(1, periodo_dias / 30)  # Mínimo 1 mês
    
    # Taxa de juros do período
    taxa_juros_periodo = taxa_juros_mensal * periodo_meses
    
    # Rentabilidade do período em percentual
    rentabilidade_periodo_pct = (total_pnl / capital_inicial) * 100
    
    # Fórmula: (Rentabilidade período - taxa de juros período) / (drawdown / 3x drawdown)
    # Numerador: Rentabilidade - juros
    numerador = rentabilidade_periodo_pct - (taxa_juros_periodo * 100)
    
    # Denominador: Risco (drawdown / 3x drawdown) = sempre 33.33%
    denominador = (max_drawdown / (max_drawdown * 3)) * 100  # Sempre 33.33%
    
    # Sharpe Ratio final
    sharpe_ratio_customizado = numerador / denominador if denominador != 0 else 0
    
    # Fator de Recuperação
    recovery_factor = total_pnl / max_drawdown if max_drawdown != 0 else 0
    
    # Dias operados
    days_traded = len(daily_stats)
    
    # Estatísticas diárias
    winning_days = len(daily_stats[daily_stats['total_pnl'] > 0])
    losing_days = len(daily_stats[daily_stats['total_pnl'] < 0])
    daily_win_rate = (winning_days / days_traded * 100) if days_traded > 0 else 0
    
    # Ganhos e perdas diárias
    daily_avg_win = daily_stats[daily_stats['total_pnl'] > 0]['total_pnl'].mean() if winning_days > 0 else 0
    daily_avg_loss = daily_stats[daily_stats['total_pnl'] < 0]['total_pnl'].mean() if losing_days > 0 else 0
    daily_max_win = daily_stats['total_pnl'].max()
    daily_max_loss = daily_stats['total_pnl'].min()
    
    # Média de operações por dia
    avg_trades_per_day = total_trades / days_traded if days_traded > 0 else 0
    
    # Sequências consecutivas
    consecutive_wins, consecutive_losses = calcular_sequencias_consecutivas(daily_stats)
    
    return {
        "metricas_principais": {
            "sharpe_ratio": round(sharpe_ratio_customizado, 2),  # CORRIGIDO
            "fator_recuperacao": round(recovery_factor, 2),
            "drawdown_maximo": round(-max_drawdown, 2),  # Negativo para compatibilidade
            "drawdown_maximo_pct": round(max_drawdown_pct, 2),
            "dias_operados": int(days_traded),
            "resultado_liquido": round(total_pnl, 2),
            # Campos adicionais para debug/transparência
            "periodo_meses": round(periodo_meses, 1),
            "taxa_juros_periodo": round(taxa_juros_periodo * 100, 2),
            "rentabilidade_periodo_pct": round(rentabilidade_periodo_pct, 2),
            "capital_estimado": round(capital_inicial, 2),
            "numerador_sharpe": round(numerador, 2),
            "denominador_sharpe": round(denominador, 2)
        },
        "ganhos_perdas": {
            "ganho_medio_diario": round(daily_avg_win, 2),
            "perda_media_diaria": round(daily_avg_loss, 2),
            "payoff_diario": round(daily_avg_win / abs(daily_avg_loss) if daily_avg_loss != 0 else 0, 2),
            "ganho_maximo_diario": round(daily_max_win, 2),
            "perda_maxima_diaria": round(daily_max_loss, 2)
        },
        "estatisticas_operacao": {
            "media_operacoes_dia": round(avg_trades_per_day, 1),
            "taxa_acerto_diaria": round(daily_win_rate, 2),
            "dias_vencedores_perdedores": f"{winning_days} / {losing_days}",
            "dias_perdedores_consecutivos": consecutive_losses,
            "dias_vencedores_consecutivos": consecutive_wins
        }
    }

def calcular_sharpe_ratio_customizado(total_pnl: float, max_drawdown: float, periodo_meses: float, taxa_juros_mensal: float = 0.01, capital_inicial: float = None) -> Dict[str, float]:
    """
    Calcula o Sharpe Ratio usando a fórmula específica fornecida
    
    Args:
        total_pnl: Lucro/prejuízo total
        max_drawdown: Drawdown máximo (valor positivo)
        periodo_meses: Período em meses
        taxa_juros_mensal: Taxa de juros mensal (padrão 1% = 0.01)
        capital_inicial: Capital inicial (se None, será estimado)
    
    Returns:
        Dict com os componentes do cálculo e o resultado final
    """
    
    # Estimar capital inicial se não fornecido
    if capital_inicial is None:
        capital_inicial = max(max_drawdown * 3, abs(total_pnl) * 2, 100000)
    
    # Taxa de juros do período
    taxa_juros_periodo = taxa_juros_mensal * periodo_meses
    
    # Rentabilidade do período em percentual
    rentabilidade_periodo_pct = (total_pnl / capital_inicial) * 100
    
    # Numerador: (Rentabilidade período - taxa de juros período)
    numerador = rentabilidade_periodo_pct - (taxa_juros_periodo * 100)
    
    # Denominador: Risco (drawdown / 3x drawdown)
    drawdown_3x = max_drawdown * 3
    risco_pct = (max_drawdown / drawdown_3x) * 100 if drawdown_3x > 0 else 100
    
    # Sharpe Ratio
    sharpe_ratio = numerador / risco_pct if risco_pct != 0 else 0
    
    return {
        "sharpe_ratio": round(sharpe_ratio, 2),
        "total_pnl": total_pnl,
        "capital_inicial": capital_inicial,
        "rentabilidade_pct": round(rentabilidade_periodo_pct, 2),
        "taxa_juros_periodo_pct": round(taxa_juros_periodo * 100, 2),
        "numerador": round(numerador, 2),
        "max_drawdown": max_drawdown,
        "drawdown_3x": drawdown_3x,
        "risco_pct": round(risco_pct, 2),
        "periodo_meses": periodo_meses
    }


def calcular_sequencias_consecutivas(daily_stats: pd.DataFrame) -> Tuple[int, int]:
    """Calcula sequências consecutivas de dias vencedores e perdedores"""
    if daily_stats.empty:
        return 0, 0
    
    # Sequências de vitórias
    wins = daily_stats['is_winner'].astype(int)
    win_sequences = []
    current_sequence = 0
    
    for win in wins:
        if win:
            current_sequence += 1
        else:
            if current_sequence > 0:
                win_sequences.append(current_sequence)
            current_sequence = 0
    if current_sequence > 0:
        win_sequences.append(current_sequence)
    
    # Sequências de perdas
    losses = daily_stats['is_loser'].astype(int)
    loss_sequences = []
    current_sequence = 0
    
    for loss in losses:
        if loss:
            current_sequence += 1
        else:
            if current_sequence > 0:
                loss_sequences.append(current_sequence)
            current_sequence = 0
    if current_sequence > 0:
        loss_sequences.append(current_sequence)
    
    max_consecutive_wins = max(win_sequences) if win_sequences else 0
    max_consecutive_losses = max(loss_sequences) if loss_sequences else 0
    
    return max_consecutive_wins, max_consecutive_losses
# Adicione ao seu main.py

import pandas as pd
import numpy as np
from typing import Dict, Any
from flask import Flask, request, jsonify

def calcular_disciplina_completa(df: pd.DataFrame, fator_disciplina: float = 0.2, multiplicador_furia: float = 2.0) -> Dict[str, Any]:
    """
    Calcula TODOS os índices de disciplina em uma função única:
    - Disciplina Stop (por operação)
    - Disciplina Perda/Dia (por dia)
    - Métrica de Fúria Diária (baseada em múltiplo da perda média)
    
    Args:
        df: DataFrame com as operações
        fator_disciplina: Fator para calcular meta máxima (padrão 20% = 0.2)
        multiplicador_furia: Multiplicador para definir "dia de fúria" (padrão 2.0 = 2x a perda média)
    
    Returns:
        Dict com todas as métricas de disciplina (JSON serializable)
    """
    if df.empty:
        return {"error": "DataFrame vazio"}
    
    # Encontrar colunas corretas
    resultado_col = None
    data_col = None
    quantidade_col = None
    
    for col_name in ['Res. Operação', 'pnl', 'operation_result', 'resultado']:
        if col_name in df.columns:
            resultado_col = col_name
            break
    
    for col_name in ['Abertura', 'entry_date', 'data_abertura', 'data']:
        if col_name in df.columns:
            data_col = col_name
            break
    
    for col_name in ['Qtd Compra', 'Quantidade', 'qtd', 'qty', 'volume', 'contratos', 'acoes', 'size']:
        if col_name in df.columns:
            quantidade_col = col_name
            break
    
    if resultado_col is None or data_col is None:
        return {"error": "Colunas de resultado ou data não encontradas"}
    
    # Quantidade é opcional
    quantidade_disponivel = quantidade_col is not None
    
    # Filtrar operações válidas
    if quantidade_disponivel:
        df_valid = df.dropna(subset=[resultado_col, data_col, quantidade_col]).copy()
    else:
        df_valid = df.dropna(subset=[resultado_col, data_col]).copy()
    
    if df_valid.empty:
        return {"error": "Nenhuma operação válida encontrada"}
    
    # Converter data para datetime se necessário
    if not pd.api.types.is_datetime64_any_dtype(df_valid[data_col]):
        df_valid[data_col] = pd.to_datetime(df_valid[data_col])
    
    # ===== VARIÁVEIS GERAIS =====
    total_operacoes = int(len(df_valid))
    
    # ===== DISCIPLINA ALAVANCAGEM =====
    if quantidade_disponivel:
        # Calcular média de quantidade
        media_quantidade = float(df_valid[quantidade_col].mean())
        limite_alavancagem = media_quantidade * 2  # 2x a média de quantidade
        
        # Identificar operações que ultrapassaram 2x a média
        operacoes_alavancadas = df_valid[df_valid[quantidade_col] > limite_alavancagem]
        qtd_operacoes_alavancadas = int(len(operacoes_alavancadas))
        total_operacoes_quantidade = int(len(df_valid))
        
        # Calcular índice de disciplina de alavancagem
        indice_disciplina_alavancagem = (1 - (qtd_operacoes_alavancadas / total_operacoes_quantidade)) * 100
        
        disciplina_alavancagem = {
            "disponivel": True,
            "total_operacoes": total_operacoes_quantidade,
            "media_quantidade": round(media_quantidade, 2),
            "limite_alavancagem": round(limite_alavancagem, 2),
            "operacoes_alavancadas": qtd_operacoes_alavancadas,
            "operacoes_dentro_limite": total_operacoes_quantidade - qtd_operacoes_alavancadas,
            "indice_disciplina_alavancagem": round(indice_disciplina_alavancagem, 2),
            "detalhes_alavancagem": [
                {
                    "operacao": i + 1,
                    "quantidade": int(row[quantidade_col]),
                    "excesso_limite": round(float(row[quantidade_col]) - limite_alavancagem, 2),
                    "multiplo_media": round(float(row[quantidade_col]) / media_quantidade, 2),
                    "data": row[data_col].strftime('%d/%m/%Y'),
                    "resultado": round(float(row[resultado_col]), 2)
                }
                for i, (_, row) in enumerate(operacoes_alavancadas.iterrows())
            ] if qtd_operacoes_alavancadas > 0 else []
        }
    else:
        disciplina_alavancagem = {
            "disponivel": False,
            "motivo": "Coluna de quantidade não encontrada",
            "colunas_procuradas": ['Qtd Compra', 'Quantidade', 'qtd', 'qty', 'volume', 'contratos', 'acoes', 'size']
        }
    
    # ===== PREPARAR DADOS DIÁRIOS =====
    df_valid['Data'] = df_valid[data_col].dt.date
    
    # Agrupar por dia
    resultado_diario = df_valid.groupby('Data').agg({
        resultado_col: ['sum', 'count', 'min']
    }).round(2)
    
    resultado_diario.columns = ['PnL_Dia', 'Trades_Dia', 'Pior_Trade_Dia']
    resultado_diario = resultado_diario.reset_index()
    
    # Separar dias com perda
    dias_com_perda = resultado_diario[resultado_diario['PnL_Dia'] < 0].copy()
    
    # ===== NOVA MÉTRICA: FÚRIA DIÁRIA =====
    if dias_com_perda.empty:
        furia_diaria = {
            "disponivel": False,
            "motivo": "Não há dias com perda para calcular fúria",
            "dias_com_perda": 0,
            "perda_media_diaria": 0.0,
            "limite_furia": 0.0,
            "dias_furia": 0,
            "total_dias_operados": int(len(resultado_diario)),
            "percentual_dias_furia": 0.0,
            "frequencia_furia": 0.0,
            "detalhes_furia": []
        }
    else:
        # Calcular perda média diária
        perda_media_diaria = float(abs(dias_com_perda['PnL_Dia'].mean()))
        
        # Definir limite de fúria (multiplicador da perda média)
        limite_furia = perda_media_diaria * multiplicador_furia
        
        # Identificar dias de fúria (perdas maiores que o limite)
        dias_furia = dias_com_perda[abs(dias_com_perda['PnL_Dia']) > limite_furia]
        qtd_dias_furia = int(len(dias_furia))
        
        # Calcular métricas
        total_dias_operados = int(len(resultado_diario))  # Total de dias que teve operações
        percentual_dias_furia = (qtd_dias_furia / total_dias_operados) * 100  # % em relação aos dias operados
        frequencia_furia = (qtd_dias_furia / len(dias_com_perda)) * 100  # Em relação aos dias com perda
        
        furia_diaria = {
            "disponivel": True,
            "dias_com_perda": int(len(dias_com_perda)),
            "perda_media_diaria": round(perda_media_diaria, 2),
            "limite_furia": round(limite_furia, 2),
            "multiplicador_usado": multiplicador_furia,
            "dias_furia": qtd_dias_furia,
            "total_dias_operados": total_dias_operados,
            "percentual_dias_furia": round(percentual_dias_furia, 2),
            "frequencia_furia_vs_dias_perda": round(frequencia_furia, 2),
            "detalhes_furia": [
                {
                    "data": row['Data'].strftime('%d/%m/%Y'),
                    "pnl_dia": round(float(row['PnL_Dia']), 2),
                    "perda_absoluta": round(abs(float(row['PnL_Dia'])), 2),
                    "trades_dia": int(row['Trades_Dia']),
                    "excesso_limite": round(abs(float(row['PnL_Dia'])) - limite_furia, 2),
                    "multiplo_media": round(abs(float(row['PnL_Dia'])) / perda_media_diaria, 2),
                    "pior_trade": round(float(row['Pior_Trade_Dia']), 2),
                    "intensidade": "extrema" if abs(float(row['PnL_Dia'])) > limite_furia * 1.5 else "alta"
                }
                for _, row in dias_furia.iterrows()
            ] if qtd_dias_furia > 0 else [],
            "estatisticas_intensidade": {
                "furia_alta": int(len(dias_furia[abs(dias_furia['PnL_Dia']) <= limite_furia * 1.5])),
                "furia_extrema": int(len(dias_furia[abs(dias_furia['PnL_Dia']) > limite_furia * 1.5])),
                "pior_dia_furia": round(float(dias_furia['PnL_Dia'].min()), 2) if qtd_dias_furia > 0 else 0.0,
                "media_perda_furia": round(float(dias_furia['PnL_Dia'].mean()), 2) if qtd_dias_furia > 0 else 0.0
            }
        }
    
    # ===== PROBABILIDADE DE FÚRIA (SEQUENCIAL) =====
    # Calcular sequências de perdas consecutivas
    df_valid['eh_perda'] = df_valid[resultado_col] < 0
    df_valid = df_valid.sort_values(data_col).reset_index(drop=True)
    
    # Identificar sequências de perdas
    sequencias_perdas = []
    sequencia_atual = 0
    
    for eh_perda in df_valid['eh_perda']:
        if eh_perda:
            sequencia_atual += 1
        else:
            if sequencia_atual > 0:
                sequencias_perdas.append(sequencia_atual)
                sequencia_atual = 0
    
    # Adicionar última sequência se terminou em perda
    if sequencia_atual > 0:
        sequencias_perdas.append(sequencia_atual)
    
    if sequencias_perdas:
        maior_sequencia_perdas = max(sequencias_perdas)
        total_sequencias = len(sequencias_perdas)
        media_sequencia_perdas = sum(sequencias_perdas) / len(sequencias_perdas)
        
        # Calcular probabilidade de "fúria" (sequência >= 3 perdas)
        sequencias_furia = [s for s in sequencias_perdas if s >= 3]
        qtd_episodios_furia = len(sequencias_furia)
        
        # Probabilidade = episódios de fúria / total de sequências de perda
        if total_sequencias > 0:
            probabilidade_furia = (qtd_episodios_furia / total_sequencias) * 100
        else:
            probabilidade_furia = 0.0
        
        # Calcular frequência de fúria por total de trades
        frequencia_furia_trades = (qtd_episodios_furia / total_operacoes) * 100
        
        probabilidade_furia_resultado = {
            "disponivel": True,
            "total_operacoes": total_operacoes,
            "total_operacoes_perdedoras": int(len(df_valid[df_valid['eh_perda']])),
            "total_sequencias_perda": total_sequencias,
            "maior_sequencia_perdas": maior_sequencia_perdas,
            "media_sequencia_perdas": round(media_sequencia_perdas, 2),
            "episodios_furia": qtd_episodios_furia,
            "probabilidade_furia": round(probabilidade_furia, 2),
            "frequencia_furia_por_trades": round(frequencia_furia_trades, 2),
            "detalhes_sequencias": [
                {
                    "sequencia_numero": i + 1,
                    "tamanho_sequencia": seq,
                    "eh_furia": seq >= 3,
                    "classificacao": "fúria" if seq >= 3 else "normal" if seq <= 2 else "moderada"
                }
                for i, seq in enumerate(sequencias_perdas)
            ],
            "estatisticas_sequencias": {
                "sequencias_1_perda": len([s for s in sequencias_perdas if s == 1]),
                "sequencias_2_perdas": len([s for s in sequencias_perdas if s == 2]),
                "sequencias_3_ou_mais": len([s for s in sequencias_perdas if s >= 3]),
                "sequencias_5_ou_mais": len([s for s in sequencias_perdas if s >= 5])
            }
        }
    else:
        probabilidade_furia_resultado = {
            "disponivel": True,
            "total_operacoes": total_operacoes,
            "total_operacoes_perdedoras": 0,
            "total_sequencias_perda": 0,
            "maior_sequencia_perdas": 0,
            "media_sequencia_perdas": 0.0,
            "episodios_furia": 0,
            "probabilidade_furia": 0.0,
            "frequencia_furia_por_trades": 0.0,
            "detalhes_sequencias": [],
            "estatisticas_sequencias": {
                "sequencias_1_perda": 0,
                "sequencias_2_perdas": 0,
                "sequencias_3_ou_mais": 0,
                "sequencias_5_ou_mais": 0
            }
        }
    
    # ===== DISCIPLINA STOP (POR OPERAÇÃO) =====
    operacoes_perdedoras = df_valid[df_valid[resultado_col] < 0].copy()
    
    if operacoes_perdedoras.empty:
        disciplina_operacao = {
            "operacoes_perdedoras": 0,
            "media_perda": 0.0,
            "meta_maxima_perda": 0.0,
            "operacoes_excederam_meta": 0,
            "indice_disciplina": 100.0,
            "operacoes_dentro_meta": 0,
            "detalhes_excesso": []
        }
    else:
        # Calcular disciplina por operação
        media_perda = float(operacoes_perdedoras[resultado_col].mean())
        meta_maxima_perda = media_perda + (media_perda * fator_disciplina)
        
        operacoes_excederam = operacoes_perdedoras[operacoes_perdedoras[resultado_col] < meta_maxima_perda]
        num_operacoes_excederam = int(len(operacoes_excederam))
        operacoes_dentro_meta = int(len(operacoes_perdedoras) - num_operacoes_excederam)
        
        indice_disciplina_op = (operacoes_dentro_meta / len(operacoes_perdedoras)) * 100
        
        disciplina_operacao = {
            "operacoes_perdedoras": int(len(operacoes_perdedoras)),
            "media_perda": round(media_perda, 2),
            "meta_maxima_perda": round(meta_maxima_perda, 2),
            "operacoes_excederam_meta": num_operacoes_excederam,
            "indice_disciplina": round(indice_disciplina_op, 2),
            "operacoes_dentro_meta": operacoes_dentro_meta,
            "detalhes_excesso": [
                {
                    "operacao": i + 1,
                    "resultado": round(float(row[resultado_col]), 2),
                    "excesso": round(float(row[resultado_col]) - meta_maxima_perda, 2)
                }
                for i, (_, row) in enumerate(operacoes_excederam.iterrows())
            ] if num_operacoes_excederam > 0 else []
        }
    
    # ===== DISCIPLINA PERDA/DIA (MÉTODO ORIGINAL) =====
    if dias_com_perda.empty:
        disciplina_dia = {
            "dias_com_perda": 0,
            "media_perda_diaria": 0.0,
            "meta_maxima_perda_dia": 0.0,
            "dias_excederam_meta": 0,
            "indice_disciplina_diaria": 100.0,
            "dias_dentro_meta": 0,
            "detalhes_dias_excesso": []
        }
    else:
        # Calcular disciplina por dia
        media_perda_diaria = float(dias_com_perda['PnL_Dia'].mean())
        meta_maxima_perda_dia = media_perda_diaria + (media_perda_diaria * fator_disciplina)
        
        dias_excederam = dias_com_perda[dias_com_perda['PnL_Dia'] < meta_maxima_perda_dia]
        num_dias_excederam = int(len(dias_excederam))
        dias_dentro_meta = int(len(dias_com_perda) - num_dias_excederam)
        
        indice_disciplina_dia = (dias_dentro_meta / len(dias_com_perda)) * 100
        
        disciplina_dia = {
            "dias_com_perda": int(len(dias_com_perda)),
            "media_perda_diaria": round(media_perda_diaria, 2),
            "meta_maxima_perda_dia": round(meta_maxima_perda_dia, 2),
            "dias_excederam_meta": num_dias_excederam,
            "indice_disciplina_diaria": round(indice_disciplina_dia, 2),
            "dias_dentro_meta": dias_dentro_meta,
            "detalhes_dias_excesso": [
                {
                    "data": row['Data'].strftime('%d/%m/%Y'),
                    "pnl_dia": round(float(row['PnL_Dia']), 2),
                    "trades_dia": int(row['Trades_Dia']),
                    "excesso": round(float(row['PnL_Dia']) - meta_maxima_perda_dia, 2),
                    "pior_trade": round(float(row['Pior_Trade_Dia']), 2)
                }
                for _, row in dias_excederam.iterrows()
            ] if num_dias_excederam > 0 else []
        }
    
    # ===== ESTATÍSTICAS GERAIS =====
    total_dias = int(len(resultado_diario))
    dias_com_ganho = int(len(resultado_diario[resultado_diario['PnL_Dia'] > 0]))
    dias_breakeven = int(len(resultado_diario[resultado_diario['PnL_Dia'] == 0]))
    
    pior_operacao = float(df_valid[resultado_col].min())
    melhor_operacao = float(df_valid[resultado_col].max())
    pior_dia = float(resultado_diario['PnL_Dia'].min())
    melhor_dia = float(resultado_diario['PnL_Dia'].max())
    
    # ===== RESUMO COMPARATIVO =====
    resumo = {
        "disciplina_operacao": disciplina_operacao["indice_disciplina"],
        "disciplina_dia": disciplina_dia["indice_disciplina_diaria"],
        "disciplina_alavancagem": disciplina_alavancagem["indice_disciplina_alavancagem"] if disciplina_alavancagem["disponivel"] else None,
        "probabilidade_furia_sequencial": probabilidade_furia_resultado["probabilidade_furia"],
        "percentual_dias_furia": furia_diaria["percentual_dias_furia"] if furia_diaria["disponivel"] else 0.0,
        "frequencia_furia_diaria": furia_diaria["frequencia_furia_vs_dias_perda"] if furia_diaria["disponivel"] else 0.0,
        "diferenca_operacao_dia": round(disciplina_operacao["indice_disciplina"] - disciplina_dia["indice_disciplina_diaria"], 2),
        "melhor_disciplina": "operacao" if disciplina_operacao["indice_disciplina"] > disciplina_dia["indice_disciplina_diaria"] else "dia",
        "media_perda_operacao": disciplina_operacao["media_perda"],
        "media_perda_dia": disciplina_dia["media_perda_diaria"],
        "limite_furia_diaria": furia_diaria["limite_furia"] if furia_diaria["disponivel"] else None
    }
    
    # Adicionar comparação com alavancagem se disponível
    if disciplina_alavancagem["disponivel"]:
        resumo["diferenca_operacao_alavancagem"] = round(disciplina_operacao["indice_disciplina"] - disciplina_alavancagem["indice_disciplina_alavancagem"], 2)
        resumo["diferenca_dia_alavancagem"] = round(disciplina_dia["indice_disciplina_diaria"] - disciplina_alavancagem["indice_disciplina_alavancagem"], 2)
        
        # Encontrar a melhor disciplina entre todas
        disciplinas = {
            "operacao": disciplina_operacao["indice_disciplina"],
            "dia": disciplina_dia["indice_disciplina_diaria"],
            "alavancagem": disciplina_alavancagem["indice_disciplina_alavancagem"]
        }
        resumo["melhor_disciplina_geral"] = max(disciplinas, key=disciplinas.get)
        resumo["pior_disciplina_geral"] = min(disciplinas, key=disciplinas.get)
    
    # Adicionar indicadores de risco baseados na fúria
    resumo["risco_emocional_sequencial"] = "alto" if probabilidade_furia_resultado["probabilidade_furia"] > 50 else "medio" if probabilidade_furia_resultado["probabilidade_furia"] > 25 else "baixo"
    resumo["risco_emocional_diario"] = "alto" if furia_diaria["percentual_dias_furia"] > 15 else "medio" if furia_diaria["percentual_dias_furia"] > 5 else "baixo"
    resumo["maior_sequencia_perdas"] = probabilidade_furia_resultado["maior_sequencia_perdas"]
    
    # ===== RESULTADO FINAL =====
    return {
        "disciplina_operacao": disciplina_operacao,
        "disciplina_dia": disciplina_dia,
        "disciplina_alavancagem": disciplina_alavancagem,
        "probabilidade_furia_sequencial": probabilidade_furia_resultado,
        "furia_diaria": furia_diaria,
        "estatisticas_gerais": {
            "total_operacoes": total_operacoes,
            "total_dias": total_dias,
            "dias_com_ganho": dias_com_ganho,
            "dias_com_perda": disciplina_dia["dias_com_perda"],
            "dias_breakeven": dias_breakeven,
            "operacoes_ganhadoras": total_operacoes - disciplina_operacao["operacoes_perdedoras"],
            "operacoes_perdedoras": disciplina_operacao["operacoes_perdedoras"],
            "pior_operacao": round(pior_operacao, 2),
            "melhor_operacao": round(melhor_operacao, 2),
            "pior_dia": round(pior_dia, 2),
            "melhor_dia": round(melhor_dia, 2),
            "media_trades_por_dia": round(total_operacoes / total_dias, 1),
            "fator_disciplina_usado": float(fator_disciplina),
            "multiplicador_furia_usado": float(multiplicador_furia),
            "coluna_quantidade_encontrada": quantidade_col if quantidade_disponivel else None
        },
        "resumo_comparativo": resumo,
        "resultado_diario_completo": [
            {
                "data": row['Data'].strftime('%d/%m/%Y'),
                "pnl_dia": round(float(row['PnL_Dia']), 2),
                "trades_dia": int(row['Trades_Dia']),
                "pior_trade": round(float(row['Pior_Trade_Dia']), 2),
                "status": "ganho" if row['PnL_Dia'] > 0 else "perda" if row['PnL_Dia'] < 0 else "breakeven",
                "dentro_meta": bool(row['PnL_Dia'] >= disciplina_dia["meta_maxima_perda_dia"] if row['PnL_Dia'] < 0 else True),
                "eh_furia": bool(abs(row['PnL_Dia']) > furia_diaria["limite_furia"] if furia_diaria["disponivel"] and row['PnL_Dia'] < 0 else False)
            }
            for _, row in resultado_diario.iterrows()
        ]
    }

# ============ API ÚNICA SIMPLIFICADA PARA MÚLTIPLOS ARQUIVOS ============

@app.route('/api/disciplina-completa', methods=['POST'])
def api_disciplina_completa():
    """
    Endpoint ÚNICO para calcular TODAS as métricas de disciplina
    Suporta tanto um arquivo ('file') quanto múltiplos arquivos ('files')
    """
    try:
        # Parâmetros opcionais
        fator_disciplina = float(request.form.get('fator_disciplina', 0.2))
        multiplicador_furia = float(request.form.get('multiplicador_furia', 2.0))
        
        # Lista para armazenar todos os DataFrames
        dataframes = []
        arquivos_processados = []
        
        # Verificar se tem arquivo único
        if 'file' in request.files:
            arquivo = request.files['file']
            if arquivo.filename != '':
                df = carregar_csv_safe(arquivo)
                dataframes.append(df)
                arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem múltiplos arquivos
        if 'files' in request.files:
            arquivos = request.files.getlist('files')
            for arquivo in arquivos:
                if arquivo.filename != '':
                    df = carregar_csv_safe(arquivo)
                    dataframes.append(df)
                    arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem caminho de arquivo
        if 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_safe(path)
            dataframes.append(df)
            arquivos_processados.append(os.path.basename(path))
        
        # Se não tem nenhum arquivo
        if not dataframes:
            return jsonify({"error": "Nenhum arquivo enviado. Use 'file' para um arquivo ou 'files' para múltiplos"}), 400
        
        # Concatenar todos os DataFrames em um só
        df_consolidado = pd.concat(dataframes, ignore_index=True)
        
        # Calcular disciplina no DataFrame consolidado
        resultado = calcular_disciplina_completa(df_consolidado, fator_disciplina, multiplicador_furia)
        
        if 'error' in resultado:
            return jsonify(resultado), 400
        
        # Adicionar informações sobre os arquivos processados
        resultado['info_arquivos'] = {
            "total_arquivos": len(arquivos_processados),
            "nomes_arquivos": arquivos_processados,
            "total_registros_consolidados": len(df_consolidado)
        }
        
        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ============ FUNÇÃO AUXILIAR PARA DEBUG ============

def debug_json_serializable(obj, path=""):
    """
    Função para identificar valores não serializáveis em JSON
    """
    import json
    import numpy as np
    
    try:
        if isinstance(obj, dict):
            for key, value in obj.items():
                debug_json_serializable(value, f"{path}.{key}")
        elif isinstance(obj, (list, tuple)):
            for i, value in enumerate(obj):
                debug_json_serializable(value, f"{path}[{i}]")
        else:
            # Tentar serializar o valor individual
            json.dumps(obj)
    except TypeError as e:
        print(f"Erro em {path}: {type(obj)} - {obj}")
        print(f"Erro: {e}")
        
        # Sugerir correção
        if isinstance(obj, np.bool_):
            print(f"Correção: bool({obj})")
        elif isinstance(obj, np.int64):
            print(f"Correção: int({obj})")
        elif isinstance(obj, np.float64):
            print(f"Correção: float({obj})")
        elif hasattr(obj, 'item'):
            print(f"Correção: {obj}.item()")

# ============ FUNÇÃO AUXILIAR PARA DEBUG ============


#Rota para receber o CSV e retornar as métricas
@app.route('/api/tabela-multipla', methods=['POST'])
def api_tabela_multipla():
    """
    Endpoint para processar múltiplos arquivos de backtest
    Garantindo que retorne TODOS os dados incluindo Equity Curve Data
    """
    try:
        # Lista para armazenar todos os DataFrames
        dataframes = []
        arquivos_processados = []
        
        # Verificar se tem arquivo único
        if 'file' in request.files:
            arquivo = request.files['file']
            if arquivo.filename != '':
                df = carregar_csv_safe(arquivo)
                dataframes.append(df)
                arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem múltiplos arquivos
        if 'files' in request.files:
            arquivos = request.files.getlist('files')
            for arquivo in arquivos:
                if arquivo.filename != '':
                    df = carregar_csv_safe(arquivo)
                    dataframes.append(df)
                    arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem caminho de arquivo
        if 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_safe(path)
            dataframes.append(df)
            arquivos_processados.append(os.path.basename(path))
        
        # Se não tem nenhum arquivo
        if not dataframes:
            return jsonify({"error": "Nenhum arquivo enviado. Use 'file' para um arquivo ou 'files' para múltiplos"}), 400
        
        # Parâmetros opcionais
        capital_inicial = float(request.form.get('capital_inicial', 100000))
        cdi = float(request.form.get('cdi', 0.12))
        
        # Concatenar todos os DataFrames em um só
        df_consolidado = pd.concat(dataframes, ignore_index=True)
        
        # Processar backtest completo no DataFrame consolidado
        resultado = processar_backtest_completo(df_consolidado, capital_inicial=capital_inicial, cdi=cdi)
        
        # Verificar se equity_curve_data existe, se não, gerar
        if 'equity_curve_data' not in resultado:
            # Gerar equity curve data se não existir
            equity_data = gerar_equity_curve_data(df_consolidado, capital_inicial)
            resultado['equity_curve_data'] = equity_data
        
        # Adicionar informações dos arquivos processados
        resultado['info_arquivos'] = {
            "total_arquivos": len(arquivos_processados),
            "nomes_arquivos": arquivos_processados,
            "total_registros_consolidados": len(df_consolidado)
        }
        
        # Adicionar análises complementares
        if len(arquivos_processados) > 1:
            resultado['day_of_week'] = calcular_day_of_week(df_consolidado)
            resultado['monthly'] = calcular_monthly(df_consolidado)
        
        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def gerar_equity_curve_data(df, capital_inicial=100000):
    """
    Função auxiliar para garantir que os dados da equity curve sejam gerados
    caso não existam na função processar_backtest_completo
    """
    try:
        # Encontrar coluna de resultado
        resultado_col = None
        data_col = None
        
        for col_name in ['Res. Operação', 'pnl', 'operation_result', 'resultado']:
            if col_name in df.columns:
                resultado_col = col_name
                break
        
        for col_name in ['Abertura', 'entry_date', 'data_abertura', 'data']:
            if col_name in df.columns:
                data_col = col_name
                break
        
        if resultado_col is None or data_col is None:
            return []
        
        # Filtrar dados válidos
        df_valid = df.dropna(subset=[resultado_col, data_col]).copy()
        
        if df_valid.empty:
            return []
        
        # Converter data se necessário
        if not pd.api.types.is_datetime64_any_dtype(df_valid[data_col]):
            df_valid[data_col] = pd.to_datetime(df_valid[data_col])
        
        # Ordenar por data
        df_valid = df_valid.sort_values(data_col).reset_index(drop=True)
        
        # Calcular equity curve
        equity_curve = []
        capital_atual = capital_inicial
        
        for i, row in df_valid.iterrows():
            resultado = float(row[resultado_col])
            capital_atual += resultado
            
            equity_curve.append({
                "date": row[data_col].strftime('%Y-%m-%d'),
                "equity": round(capital_atual, 2),
                "pnl": round(resultado, 2),
                "trade_number": i + 1,
                "drawdown": round(((capital_atual / max([e.get('equity', capital_inicial) for e in equity_curve] + [capital_inicial])) - 1) * 100, 2)
            })
        
        return equity_curve
        
    except Exception as e:
        print(f"Erro ao gerar equity curve data: {e}")
        return []

@app.route('/api/tabela', methods=['POST'])
def api_tabela():
    """
    Endpoint para processar arquivo único de backtest
    Suporta tanto arquivo único quanto múltiplos arquivos
    """
    try:
        # Lista para armazenar todos os DataFrames
        dataframes = []
        arquivos_processados = []
        
        # Verificar se tem arquivo único
        if 'file' in request.files:
            arquivo = request.files['file']
            if arquivo.filename != '':
                df = carregar_csv_safe(arquivo)
                dataframes.append(df)
                arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem múltiplos arquivos
        if 'files' in request.files:
            arquivos = request.files.getlist('files')
            for arquivo in arquivos:
                if arquivo.filename != '':
                    df = carregar_csv_safe(arquivo)
                    dataframes.append(df)
                    arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem caminho de arquivo
        if 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_safe(path)
            dataframes.append(df)
            arquivos_processados.append(os.path.basename(path))
        
        # Se não tem nenhum arquivo
        if not dataframes:
            return jsonify({"error": "Envie um arquivo ou caminho via POST"}), 400
        
        # Concatenar todos os DataFrames em um só
        df_consolidado = pd.concat(dataframes, ignore_index=True)
        
        # Parâmetros opcionais
        capital_inicial = float(request.form.get('capital_inicial', 100000))
        cdi = float(request.form.get('cdi', 0.12))
        
        # Usar processar_backtest_completo
        resultado = processar_backtest_completo(df_consolidado, capital_inicial=capital_inicial, cdi=cdi)
        
        # Verificar se equity_curve_data existe, se não, gerar
        if 'equity_curve_data' not in resultado:
            equity_data = gerar_equity_curve_data(df_consolidado, capital_inicial)
            resultado['equity_curve_data'] = equity_data
        
        # Adicionar informações dos arquivos se múltiplos
        if len(arquivos_processados) > 1:
            resultado['info_arquivos'] = {
                "total_arquivos": len(arquivos_processados),
                "nomes_arquivos": arquivos_processados,
                "total_registros_consolidados": len(df_consolidado)
            }

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ============ NOVA ROTA ESPECÍFICA PARA DADOS DO GRÁFICO ============

@app.route('/api/equity-curve', methods=['POST'])
def api_equity_curve():
    """Endpoint específico para dados da curva de equity"""
    try:
        if 'file' in request.files:
            df = carregar_csv_safe(request.files['file'])
        elif 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_safe(path)
        else:
            return jsonify({"error": "Envie um arquivo ou caminho via POST"}), 400

        # Parâmetros opcionais
        capital_inicial = float(request.form.get('capital_inicial', 100000))
        tipo_agrupamento = request.form.get('tipo', 'daily')  # 'trade', 'daily', 'weekly', 'monthly'
        
        # Importar as funções específicas do gráfico
        from FunCalculos import calcular_dados_grafico, calcular_dados_grafico_agrupado
        
        # Calcular dados baseado no tipo solicitado
        if tipo_agrupamento == 'trade':
            dados = calcular_dados_grafico(df, capital_inicial)
        else:
            dados = calcular_dados_grafico_agrupado(df, capital_inicial, tipo_agrupamento)
        
        resultado = {
            "equity_curve_data": dados,
            "tipo": tipo_agrupamento,
            "capital_inicial": capital_inicial,
            "total_pontos": len(dados)
        }

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============ ROTA PARA BACKTEST COMPLETO ============

@app.route('/api/backtest-completo', methods=['POST'])
def api_backtest_completo():
    """Endpoint para backtest completo com todos os dados incluindo gráfico"""
    try:
        if 'file' in request.files:
            df = carregar_csv_safe(request.files['file'])
        elif 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_safe(path)
        else:
            return jsonify({"error": "Envie um arquivo ou caminho via POST"}), 400

        # Parâmetros opcionais
        capital_inicial = float(request.form.get('capital_inicial', 100000))
        cdi = float(request.form.get('cdi', 0.12))
        
        # Usar a função completa
        resultado = processar_backtest_completo(df, capital_inicial=capital_inicial, cdi=cdi)
        
        # Adicionar metadados úteis
        resultado["metadata"] = {
            "total_trades": len(df),
            "capital_inicial": capital_inicial,
            "cdi": cdi,
            "periodo": {
                "inicio": df['Abertura'].min().isoformat() if not df.empty and 'Abertura' in df.columns else None,
                "fim": df['Abertura'].max().isoformat() if not df.empty and 'Abertura' in df.columns else None
            }
        }

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============ ROTA PARA TABELA MÚLTIPLA CORRIGIDA ============

@app.route('/api/correlacao', methods=['POST'])
def api_correlacao_data_direcao():
    try:
        if 'files' not in request.files:
            return jsonify({"error": "Nenhum arquivo enviado"}), 400
        
        files = request.files.getlist('files')
        
        if len(files) < 2:
            return jsonify({"error": "Precisa de pelo menos 2 arquivos"}), 400
        
        # Processar cada arquivo
        arquivos_processados = []
        
        for file in files:
            try:
                df = carregar_csv_safe(file)  # Usar função com encoding seguro
                nome = file.filename.replace('.csv', '').replace('.xlsx', '')
                arquivos_processados.append({
                    'nome': nome,
                    'df': df
                })
            except Exception as e:
                return jsonify({"error": f"Erro ao processar {file.filename}: {str(e)}"}), 500
        
        # Calcular correlação por data e direção
        resultado = calcular_correlacao_por_data_e_direcao(arquivos_processados)
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    messages = data.get('messages', [])

    try:
        # novo formato de chamada, sem usar ChatCompletion
        resp = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            stream=False
        )
        # extrai role + content
        choice = resp.choices[0].message
        return jsonify({
            "role": choice.role,
            "content": choice.content
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============ NOVAS ROTAS PARA TRADES ============

@app.route('/api/trades', methods=['POST'])
def api_trades():
    """Endpoint principal para análise de trades - suporta arquivo único ou múltiplos arquivos"""
    try:
        # Obter parâmetros opcionais
        taxa_corretagem = float(request.form.get('taxa_corretagem', 0.5))
        taxa_emolumentos = float(request.form.get('taxa_emolumentos', 0.03))
        
        # Lista para armazenar todos os DataFrames
        dataframes = []
        arquivos_processados = []
        
        # Verificar se tem arquivo único
        if 'file' in request.files:
            arquivo = request.files['file']
            if arquivo.filename != '':
                df = carregar_csv_trades(arquivo)
                dataframes.append(df)
                arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem múltiplos arquivos
        if 'files' in request.files:
            arquivos = request.files.getlist('files')
            for arquivo in arquivos:
                if arquivo.filename != '':
                    df = carregar_csv_trades(arquivo)
                    dataframes.append(df)
                    arquivos_processados.append(arquivo.filename)
        
        # Verificar se tem caminho de arquivo
        if 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_trades(path)
            dataframes.append(df)
            arquivos_processados.append(os.path.basename(path))
        
        # Se não tem nenhum arquivo
        if not dataframes:
            return jsonify({"error": "Nenhum arquivo enviado. Use 'file' para um arquivo ou 'files' para múltiplos"}), 400
        
        # Concatenar todos os DataFrames em um só
        df_consolidado = pd.concat(dataframes, ignore_index=True)
        
        # Processar dados consolidados
        trades = processar_trades(df_consolidado)
        estatisticas_gerais = calcular_estatisticas_gerais(df_consolidado)
        estatisticas_por_ativo = calcular_estatisticas_por_ativo(df_consolidado)
        estatisticas_temporais = calcular_estatisticas_temporais(df_consolidado)
        custos = calcular_custos_operacionais(df_consolidado, taxa_corretagem, taxa_emolumentos)
        
        # Extrair listas únicas para filtros
        available_assets = sorted([str(symbol) for symbol in df_consolidado['symbol'].unique() if pd.notna(symbol)])
        available_strategies = ["Manual"]  # Pode ser expandido conforme necessário

        resultado = {
            "trades": trades,
            "statistics": {
                "general": estatisticas_gerais,
                "by_asset": estatisticas_por_ativo,
                "temporal": estatisticas_temporais,
                "costs": custos
            },
            "filters": {
                "available_assets": available_assets,
                "available_strategies": available_strategies
            },
            "metadata": {
                "total_records": len(df_consolidado),
                "valid_trades": len(trades),
                "date_range": {
                    "start": df_consolidado['entry_date'].min().isoformat() if df_consolidado['entry_date'].notna().any() else None,
                    "end": df_consolidado['entry_date'].max().isoformat() if df_consolidado['entry_date'].notna().any() else None
                },
                "info_arquivos": {
                    "total_arquivos": len(arquivos_processados),
                    "nomes_arquivos": arquivos_processados,
                    "total_registros_consolidados": len(df_consolidado)
                }
            }
        }

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/trades/summary', methods=['POST'])
def api_trades_summary():
    """Endpoint para obter apenas um resumo das estatísticas"""
    try:
        # Carregar arquivo
        if 'file' in request.files:
            df = carregar_csv_trades(request.files['file'])
        elif 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_trades(path)
        else:
            return jsonify({"error": "Envie um arquivo ou caminho via POST"}), 400

        # Calcular apenas estatísticas essenciais
        estatisticas_gerais = calcular_estatisticas_gerais(df)
        custos = calcular_custos_operacionais(df)
        
        resultado = {
            "summary": estatisticas_gerais,
            "costs": custos,
            "total_records": len(df)
        }

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============ NOVAS ROTAS PARA MÉTRICAS DIÁRIAS ============

@app.route('/api/trades/daily-metrics', methods=['POST'])
def api_daily_metrics():
    """Endpoint para obter métricas diárias"""
    try:
        # Carregar arquivo
        if 'file' in request.files:
            df = carregar_csv_trades(request.files['file'])
        elif 'path' in request.form:
            path = request.form['path']
            if not os.path.exists(path):
                return jsonify({"error": "Arquivo não encontrado"}), 404
            df = carregar_csv_trades(path)
        else:
            return jsonify({"error": "Envie um arquivo ou caminho via POST"}), 400

        # Calcular métricas
        metricas = calcular_metricas_principais(df)
        
        if not metricas:
            return jsonify({"error": "Não foi possível calcular métricas"}), 400
        
        return jsonify(metricas)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trades/metrics-from-data', methods=['POST'])
def api_metrics_from_data():
    """Endpoint para calcular métricas a partir de dados JSON já processados"""
    try:
        data = request.get_json()
        
        if not data or 'trades' not in data:
            return jsonify({"error": "Dados de trades não fornecidos"}), 400
        
        # Converter trades JSON para DataFrame
        trades_data = data['trades']
        
        if not trades_data:
            return jsonify({"error": "Lista de trades vazia"}), 400
        
        # Criar DataFrame
        df = pd.DataFrame(trades_data)
        
        # Converter datas
        df['entry_date'] = pd.to_datetime(df['entry_date'])
        df['exit_date'] = pd.to_datetime(df['exit_date'])
        
        # Garantir que pnl seja numérico
        df['pnl'] = pd.to_numeric(df['pnl'], errors='coerce')
        
        # Calcular métricas
        metricas = calcular_metricas_principais(df)
        
        if not metricas:
            return jsonify({"error": "Não foi possível calcular métricas"}), 400
        
        return jsonify(metricas)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0',
            port=5000,
            debug=False,
            use_reloader=False)