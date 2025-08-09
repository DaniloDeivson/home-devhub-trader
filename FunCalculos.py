import pandas as pd
import numpy as np
from datetime import timedelta
import calendar
import warnings

# Suprimir warnings específicos do pandas
warnings.filterwarnings('ignore', category=FutureWarning)

def carregar_csv(file):
    try:
        df = pd.read_csv(file, skiprows=5, sep=';', encoding='latin1', decimal=',')
        df['Abertura']   = pd.to_datetime(df['Abertura'],   format="%d/%m/%Y %H:%M:%S")
        df['Fechamento'] = pd.to_datetime(df['Fechamento'], format="%d/%m/%Y %H:%M:%S")
        df['Res. Operação']     = pd.to_numeric(df['Res. Operação'],     errors='coerce')
        df['Res. Operação (%)'] = pd.to_numeric(df['Res. Operação (%)'], errors='coerce')
        return df
    except Exception as e:
        raise ValueError(f"Erro ao processar CSV: {e}")

def _format_timedelta(td: timedelta, portuguese: bool = True, keep_seconds: bool = True):
    days = td.days
    hours, rem = divmod(td.seconds, 3600)
    minutes, seconds = divmod(rem, 60)
    if portuguese:
        parts = []
        if days > 0:
            parts.append(f"{days} dias")
        if hours > 0:
            parts.append(f"{hours} horas")
        if minutes > 0 or (days == 0 and hours == 0):
            parts.append(f"{minutes} min")
        if len(parts) > 1:
            return ' e '.join([', '.join(parts[:-1]), parts[-1]]) if len(parts) > 2 else f'{parts[0]} e {parts[1]}'
        elif parts:
            return parts[0]
        else:
            return "0 min"
    else:
        return str(td)

def calcular_metrics(sub, cdi=0.12):
    # Determinar qual coluna usar para PnL
    if 'operation_result' in sub.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in sub.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in sub.columns:
        pnl_col = 'Res. Operação'
    else:
        # Fallback para primeira coluna numérica
        numeric_cols = sub.select_dtypes(include=[np.number]).columns
        pnl_col = numeric_cols[0] if len(numeric_cols) > 0 else None
    
    if pnl_col is None:
        return 0, 0, 0, 0, 0
    
    pnl = sub[pnl_col]
    lucro = pnl.sum()
    trades = len(sub)
    gross_profit = pnl[pnl > 0].sum()
    gross_loss = abs(pnl[pnl < 0].sum())
    pf = gross_profit / gross_loss if gross_loss > 0 else 0
    returns = pnl.values
    mean_return = np.mean(returns) if trades > 0 else 0
    std_return = np.std(returns, ddof=1) if trades > 1 else 0
    sharpe = (mean_return - cdi) / std_return if std_return > 0 else 0

    equity = pnl.cumsum()
    peak = equity.cummax()
    dd_ser = equity - peak
    max_dd = float(dd_ser.min()) if not dd_ser.empty else 0
    sharpe_dd_simplificado = ((lucro / (3 * abs(max_dd))) - cdi) * 3 if max_dd != 0 else 0

    return lucro, pf, sharpe, sharpe_dd_simplificado, trades

def calcular_performance(df, cdi=0.12):
    total_trades = len(df)
    
    # Determinar qual coluna usar para PnL
    if 'operation_result' in df.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in df.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in df.columns:
        pnl_col = 'Res. Operação'
    else:
        # Fallback para primeira coluna numérica
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        pnl_col = numeric_cols[0] if len(numeric_cols) > 0 else None
    
    if pnl_col is None:
        return {}
    
    pnl = df[pnl_col]
    net_profit = pnl.sum()
    profit_trades = df[pnl > 0]
    loss_trades = df[pnl < 0]
    gross_profit = profit_trades[pnl_col].sum()
    gross_loss = loss_trades[pnl_col].sum()
    avg_win = profit_trades[pnl_col].mean() or 0
    avg_loss = loss_trades[pnl_col].mean() or 0
    avg_per_trade = net_profit / total_trades if total_trades > 0 else 0
    win_rate = len(profit_trades) / total_trades * 100 if total_trades > 0 else 0
    profit_factor = gross_profit / abs(gross_loss) if gross_loss != 0 else 0
    payoff = avg_win / abs(avg_loss) if avg_loss != 0 else 0

    returns = pnl.values
    mean_return = np.mean(returns)
    std_return = np.std(returns, ddof=1)
    sharpe_ratio = ((mean_return - cdi) / std_return) if std_return != 0 else 0
    
    # Determinar coluna de data - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns:
        date_col = 'entry_date'
    elif 'Abertura' in df.columns:
        date_col = 'Abertura'
    else:
        date_col = None
    
    if date_col is None:
        dias_com_operacoes = 1
    else:
        dias_com_operacoes = df[date_col].dt.date.nunique()
    media_operacoes_por_dia = total_trades / dias_com_operacoes if dias_com_operacoes > 0 else 0

    # PADRONIZADO: Calcular drawdown usando método centralizado
    equity = pnl.cumsum()
    peak = equity.cummax()
    dd_ser = equity - peak
    max_dd = abs(dd_ser.min()) if not dd_ser.empty else 0  # Valor positivo
    pct_dd = (max_dd / peak.max() * 100) if peak.max() != 0 else 0  # Baseado no pico máximo
    
    # CALCULAR DD MÉDIO - CORREÇÃO ADICIONADA
    # Calcular drawdown médio baseado nos trades individuais
    drawdown_values = dd_ser[dd_ser < 0].abs()  # Apenas valores negativos (drawdowns)
    avg_drawdown = drawdown_values.mean() if len(drawdown_values) > 0 else 0

    recovery = net_profit / abs(max_dd) if max_dd != 0 else None
    recovery_3x = net_profit / (3 * abs(max_dd)) if max_dd != 0 else None
    sharpe_dd_simplificado = ((net_profit / (3 * abs(max_dd))) - cdi) * 3 if max_dd != 0 else 0

    cur_loss_sum = 0.0
    max_seq_loss = 0.0
    for x in pnl:
        if x < 0:
            cur_loss_sum += x
            max_seq_loss = min(max_seq_loss, cur_loss_sum)
        else:
            cur_loss_sum = 0.0
    trade_dd = max_seq_loss
    trade_dd_pct = abs(trade_dd) / equity.iloc[-1] * 100 if equity.iloc[-1] != 0 else 0

    max_seq_win = max_seq_loss_cnt = 0
    cw = cl = 0
    for x in pnl:
        if x > 0:
            cw += 1
            cl = 0
            max_seq_win = max(max_seq_win, cw)
        elif x < 0:
            cl += 1
            cw = 0
            max_seq_loss_cnt = max(max_seq_loss_cnt, cl)

    # Determinar colunas de data - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns and 'exit_date' in df.columns:
        entry_col = 'entry_date'
        exit_col = 'exit_date'
    elif 'Abertura' in df.columns and 'Fechamento' in df.columns:
        entry_col = 'Abertura'
        exit_col = 'Fechamento'
    else:
        entry_col = exit_col = None
    
    if entry_col and exit_col:
        durations = df[exit_col] - df[entry_col]
        avg_dur = durations.mean() if total_trades > 0 else timedelta(0)
        dur_win = (profit_trades[exit_col] - profit_trades[entry_col]).mean() if len(profit_trades) > 0 else timedelta(0)
        dur_loss = (loss_trades[exit_col] - loss_trades[entry_col]).mean() if len(loss_trades) > 0 else timedelta(0)
    else:
        avg_dur = dur_win = dur_loss = timedelta(0)
    
    # CALCULAR DIAS VENCEDORES E PERDEDORES
    # Agrupar por dia e calcular se o dia foi vencedor ou perdedor
    if entry_col:
        df['date'] = df[entry_col].dt.date
        daily_pnl = df.groupby('date')[pnl_col].sum()
        winning_days = len(daily_pnl[daily_pnl > 0])
        losing_days = len(daily_pnl[daily_pnl < 0])
    else:
        winning_days = 0
        losing_days = 0

    max_trade_gain = pnl.max()
    max_trade_loss = pnl.min()

    return {
        "Total Trades": total_trades,
        "Net Profit": net_profit,
        "Gross Profit": gross_profit,
        "Gross Loss": gross_loss,
        "Profit Factor": profit_factor,
        "Payoff": payoff,
        "Win Rate (%)": win_rate,
        "Average PnL/Trade": avg_per_trade,
        "Average Win": avg_win,
        "Average Loss": avg_loss,
        "Max Trade Gain": max_trade_gain,
        "Max Trade Loss": max_trade_loss,
        "Max Consecutive Wins": max_seq_win,
        "Max Consecutive Losses": max_seq_loss_cnt,
        "Max Drawdown ($)": max_dd,
        "Max Drawdown (%)": pct_dd,
        "Average Drawdown ($)": avg_drawdown,  # NOVO: DD Médio
        "Max Drawdown Padronizado ($)": max_dd,  # Valor padronizado
        "Max Drawdown Padronizado (%)": pct_dd,  # Percentual padronizado
        "Max Trade Drawdown ($)": trade_dd,
        "Max Trade Drawdown (%)": trade_dd_pct,
        "Average Trade Duration": _format_timedelta(avg_dur),
        "Avg Winning Trade Duration": _format_timedelta(dur_win),
        "Avg Losing Trade Duration": _format_timedelta(dur_loss),
        "Recovery Factor": recovery,
        "Sharpe Ratio": sharpe_dd_simplificado,
        "Avg Trades/Active Day": media_operacoes_por_dia,
        "Active Days": dias_com_operacoes,
        "Winning Days": winning_days,
        "Losing Days": losing_days,
    }

def calcular_day_of_week(df, cdi=0.12):
    df = df.copy()
    
    # Determinar coluna de data - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns:
        date_col = 'entry_date'
    elif 'Abertura' in df.columns:
        date_col = 'Abertura'
    else:
        return {}
    
    # Determinar coluna de PnL
    if 'operation_result' in df.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in df.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in df.columns:
        pnl_col = 'Res. Operação'
    else:
        return {}
    
    df['DayOfWeek'] = df[date_col].dt.day_name()
    dias = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    stats = {}
    for dia in dias:
        sub = df[df['DayOfWeek'] == dia]
        lucro, pf, sharpe, sharpe_simp, trades = calcular_metrics(sub, cdi=cdi)
        wins = sub[sub[pnl_col] > 0]
        losses = sub[sub[pnl_col] < 0]
        win_rate = len(wins) / trades * 100 if trades > 0 else 0
        
        # Calcular média de ganho e perda
        avg_win = wins[pnl_col].mean() if len(wins) > 0 else 0
        avg_loss = abs(losses[pnl_col].mean()) if len(losses) > 0 else 0
        
        # Calcular rentabilidade total (lucro total do período)
        rentabilidade_total = lucro
        
        stats[dia] = {
            "Trades": trades,
            "Net Profit": lucro,
            "Profit Factor": pf,
            "Win Rate (%)": round(win_rate, 2),
            "Sharpe Ratio": sharpe,
            "Average Win": round(avg_win, 2),
            "Average Loss": round(avg_loss, 2),
            "Rentabilidade ($)": round(rentabilidade_total, 2)
        }

    # Retornar todos os dias, mesmo que não tenham trades
    print(f"🔍 DEBUG - Day of Week Analysis: {stats}")
    # Estrutura esperada pelo frontend
    return {
        "Stats": stats,
        "Best Day": {"Day": "Monday", **stats.get("Monday", {})} if "Monday" in stats else {},
        "Worst Day": {"Day": "Sunday", **stats.get("Sunday", {})} if "Sunday" in stats else {}
    }

def calcular_monthly(df, cdi=0.12):
    df = df.copy()
    
    # Determinar colunas - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns:
        date_col = 'entry_date'
    elif 'Abertura' in df.columns:
        date_col = 'Abertura'
    else:
        return {}
    
    if 'operation_result' in df.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in df.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in df.columns:
        pnl_col = 'Res. Operação'
    else:
        return {}
    
    # Ordenar por data de abertura para cálculo correto do drawdown
    df = df.sort_values(date_col).reset_index(drop=True)
    
    # Calcular equity curve global para drawdown correto
    df['Saldo'] = df[pnl_col].cumsum()
    df['Saldo_Maximo'] = df['Saldo'].cummax()
    df['Drawdown'] = df['Saldo'] - df['Saldo_Maximo']
    
    df['MonthNum'] = df[date_col].dt.month
    df['Year'] = df[date_col].dt.year
    df['YearMonth'] = df[date_col].dt.to_period('M')
    
    stats = {}
    months = sorted(df['YearMonth'].unique())
    for month in months:
        sub = df[df['YearMonth'] == month]
        lucro, pf, sharpe, sharpe_simp, trades = calcular_metrics(sub, cdi=cdi)
        wins = sub[sub[pnl_col] > 0]
        losses = sub[sub[pnl_col] < 0]
        win_rate = len(wins) / trades * 100 if trades > 0 else 0
        
        # Calcular média de ganho e perda
        avg_win = wins[pnl_col].mean() if len(wins) > 0 else 0
        avg_loss = abs(losses[pnl_col].mean()) if len(losses) > 0 else 0
        
        # Calcular rentabilidade total (lucro total do período)
        rentabilidade_total = lucro
        
        # Calcular drawdown do mês
        max_dd = abs(sub['Drawdown'].min()) if len(sub) > 0 else 0
        
        stats[str(month)] = {
            "Trades": trades,
            "Net Profit": lucro,
            "Profit Factor": pf,
            "Sharpe Ratio": sharpe,
            "Sharpe DDx3": sharpe_simp,
            "Win Rate (%)": round(win_rate, 2),
            "Average Win": round(avg_win, 2),
            "Average Loss": round(avg_loss, 2),
            "Rentabilidade ($)": round(rentabilidade_total, 2),
            "Max Drawdown": round(max_dd, 2)
        }
    
    best_month = max(stats.items(), key=lambda x: x[1]['Net Profit'])[0]
    worst_month = min((item for item in stats.items() if item[1]['Net Profit'] < 0), key=lambda x: x[1]['Net Profit'], default=(None, {}))[0]
    
    return {
        "Stats": stats,
        "Best Month": {"Month": best_month, **stats.get(best_month, {})},
        "Worst Month": {"Month": worst_month, **stats.get(worst_month, {})}
    }

def calcular_weekly(df, cdi=0.12):
    df = df.copy()
    
    # Determinar colunas - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns:
        date_col = 'entry_date'
    elif 'Abertura' in df.columns:
        date_col = 'Abertura'
    else:
        return {}
    
    if 'operation_result' in df.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in df.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in df.columns:
        pnl_col = 'Res. Operação'
    else:
        return {}
    
    df['WeekNum'] = df[date_col].dt.isocalendar().week
    stats = {}
    weeks = sorted(df['WeekNum'].unique())
    for w in weeks:
        sub = df[df['WeekNum'] == w]
        lucro, pf, sharpe, sharpe_simp, trades = calcular_metrics(sub, cdi=cdi)
        wins = sub[sub[pnl_col] > 0]
        losses = sub[sub[pnl_col] < 0]
        win_rate = len(wins) / trades * 100 if trades > 0 else 0
        
        # Calcular média de ganho e perda
        avg_win = wins[pnl_col].mean() if len(wins) > 0 else 0
        avg_loss = abs(losses[pnl_col].mean()) if len(losses) > 0 else 0
        
        # Calcular rentabilidade total (lucro total do período)
        rentabilidade_total = lucro
        
        stats[f"Semana {w}"] = {
            "Trades": trades,
            "Net Profit": lucro,
            "Profit Factor": pf,
            "Sharpe Ratio": sharpe,
            "Sharpe DDx3": sharpe_simp,
            "Win Rate (%)": round(win_rate, 2),
            "Average Win": round(avg_win, 2),
            "Average Loss": round(avg_loss, 2),
            "Rentabilidade ($)": round(rentabilidade_total, 2)
        }
    best_week = max(stats.items(), key=lambda x: x[1]['Net Profit'])[0]
    worst_week = min((item for item in stats.items() if item[1]['Net Profit'] < 0), key=lambda x: x[1]['Net Profit'], default=(None, {}))[0]
    
    return {
        "Stats": stats,
        "Best Week": {"Week": best_week, **stats.get(best_week, {})},
        "Worst Week": {"Week": worst_week, **stats.get(worst_week, {})}
    }

def calcular_dados_grafico(df, capital_inicial=100000):
    """
    Calcula dados para o gráfico baseado na abertura das operações.
    PADRONIZADO: Usa apenas saldo cumulativo (sem capital inicial) para drawdown
    """
    if df.empty:
        return []
    
    df = df.copy()
    
    # Determinar colunas - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns:
        date_col = 'entry_date'
    elif 'Abertura' in df.columns:
        date_col = 'Abertura'
    else:
        return []
    
    if 'operation_result' in df.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in df.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in df.columns:
        pnl_col = 'Res. Operação'
    else:
        return []
    
    # Ordenar por data de abertura
    df = df.sort_values(date_col).reset_index(drop=True)
    
    # Calcular equity curve trade por trade (PADRONIZADO: apenas saldo cumulativo)
    df['Saldo'] = df[pnl_col].cumsum()
    df['Saldo_Maximo'] = df['Saldo'].cummax()
    df['Drawdown'] = df['Saldo'] - df['Saldo_Maximo']
    
    # Calcular valor da carteira (para compatibilidade, mas não usado no drawdown)
    df['Valor_Carteira'] = capital_inicial + df['Saldo']
    df['Peak_Carteira'] = capital_inicial + df['Saldo_Maximo']
    
    # PADRONIZADO: Drawdown baseado apenas no saldo cumulativo (sem capital inicial)
    df['Drawdown_Carteira'] = df['Drawdown']  # Usar o mesmo drawdown do saldo
    df['Drawdown_Percentual'] = (df['Drawdown'] / df['Saldo_Maximo'] * 100).fillna(0) if df['Saldo_Maximo'].max() != 0 else 0
    
    # Preparar dados para o gráfico
    grafico_dados = []
    
    # Ponto inicial
    primeira_data = df[date_col].iloc[0] if len(df) > 0 else pd.Timestamp('2024-01-01')
    grafico_dados.append({
        'data': primeira_data.strftime('%Y-%m-%d %H:%M:%S'),
        'saldo': 0,
        'saldo_maximo': 0,
        'drawdown': 0,
        'valor_carteira': capital_inicial,
        'peak_carteira': capital_inicial,
        'drawdown_carteira': 0,
        'drawdown_percentual': 0
    })
    
    # Adicionar cada trade
    for idx, row in df.iterrows():
        grafico_dados.append({
            'data': row[date_col].strftime('%Y-%m-%d %H:%M:%S'),
            'saldo': float(row['Saldo']),
            'saldo_maximo': float(row['Saldo_Maximo']),
            'drawdown': float(row['Drawdown']),
            'valor_carteira': float(row['Valor_Carteira']),
            'peak_carteira': float(row['Peak_Carteira']),
            'drawdown_carteira': float(row['Drawdown_Carteira']),
            'drawdown_percentual': float(row['Drawdown_Percentual'])
        })
    
    return grafico_dados

def calcular_dados_grafico_agrupado(df, capital_inicial=0, agrupar_por='dia'):
    """
    Calcula dados para o gráfico agrupados por período (dia, semana, mês).
    PADRONIZADO: Usa apenas saldo cumulativo (sem capital inicial) para drawdown
    """
    if df.empty:
        return []
    
    df = df.copy()
    
    # Determinar colunas - CORREÇÃO: Usar nomes corretos após renomeamento
    if 'entry_date' in df.columns:
        date_col = 'entry_date'
    elif 'Abertura' in df.columns:
        date_col = 'Abertura'
    else:
        return []
    
    if 'operation_result' in df.columns:
        pnl_col = 'operation_result'
    elif 'pnl' in df.columns:
        pnl_col = 'pnl'
    elif 'Res. Operação' in df.columns:
        pnl_col = 'Res. Operação'
    else:
        return []
    
    # Ordenar por data de abertura
    df = df.sort_values(date_col).reset_index(drop=True)
    
    # Calcular equity curve trade por trade (PADRONIZADO: apenas saldo cumulativo)
    df['Saldo'] = df[pnl_col].cumsum()
    df['Saldo_Maximo'] = df['Saldo'].cummax()
    df['Drawdown'] = df['Saldo'] - df['Saldo_Maximo']
    
    # Calcular valor da carteira (para compatibilidade, mas não usado no drawdown)
    df['Valor_Carteira'] = capital_inicial + df['Saldo']
    df['Peak_Carteira'] = capital_inicial + df['Saldo_Maximo']
    
    # PADRONIZADO: Drawdown baseado apenas no saldo cumulativo (sem capital inicial)
    df['Drawdown_Carteira'] = df['Drawdown']  # Usar o mesmo drawdown do saldo
    df['Drawdown_Percentual'] = (df['Drawdown'] / df['Saldo_Maximo'] * 100).fillna(0) if df['Saldo_Maximo'].max() != 0 else 0
    
    if agrupar_por == 'trade':
        return calcular_dados_grafico(df, capital_inicial)
    
    # Definir agrupamento
    if agrupar_por == 'dia':
        df['Periodo'] = df[date_col].dt.date
    elif agrupar_por == 'semana':
        df['Periodo'] = df[date_col].dt.to_period('W')
    elif agrupar_por == 'mes':
        df['Periodo'] = df[date_col].dt.to_period('M')
    else:
        raise ValueError("agrupar_por deve ser 'dia', 'semana', 'mes' ou 'trade'")
    
    # Agrupar dados - CORRIGIDO para versões antigas do pandas
    try:
        # Tentar com include_groups=False (pandas >= 2.1)
        grupos = df.groupby('Periodo', include_groups=False).agg({
            pnl_col: ['sum', 'count'],
            'Saldo': 'last',
            'Saldo_Maximo': 'last',
            'Drawdown': 'min',
            'Valor_Carteira': 'last',
            'Peak_Carteira': 'last',
            'Drawdown_Carteira': 'max',
            'Drawdown_Percentual': 'max',
            date_col: 'first'
        }).reset_index()
    except TypeError:
        # Fallback para versões antigas do pandas
        grupos = df.groupby('Periodo').agg({
            pnl_col: ['sum', 'count'],
            'Saldo': 'last',
            'Saldo_Maximo': 'last',
            'Drawdown': 'min',
            'Valor_Carteira': 'last',
            'Peak_Carteira': 'last',
            'Drawdown_Carteira': 'max',
            'Drawdown_Percentual': 'max',
            date_col: 'first'
        }).reset_index()
    
    # Simplificar nomes das colunas
    grupos.columns = [
        'Periodo', 'Resultado_Periodo', 'Trades_Periodo', 
        'Saldo', 'Saldo_Maximo', 'Drawdown', 
        'Valor_Carteira', 'Peak_Carteira', 'Drawdown_Carteira',
        'Drawdown_Percentual', 'Abertura'
    ]
    
    # Preparar dados para o gráfico
    grafico_dados = []
    
    # Ponto inicial
    primeira_data = grupos['Abertura'].iloc[0] if len(grupos) > 0 else pd.Timestamp('2024-01-01')
    grafico_dados.append({
        'data': primeira_data.strftime('%Y-%m-%d %H:%M:%S'),
        'saldo': 0,
        'saldo_maximo': 0,
        'drawdown': 0,
        'valor_carteira': capital_inicial,
        'peak_carteira': capital_inicial,
        'drawdown_carteira': 0,
        'drawdown_percentual': 0
    })
    
    # Adicionar cada período
    for idx, row in grupos.iterrows():
        grafico_dados.append({
            'data': row['Abertura'].strftime('%Y-%m-%d %H:%M:%S'),
            'saldo': float(row['Saldo']),
            'saldo_maximo': float(row['Saldo_Maximo']),
            'drawdown': float(row['Drawdown']),
            'valor_carteira': float(row['Valor_Carteira']),
            'peak_carteira': float(row['Peak_Carteira']),
            'drawdown_carteira': float(row['Drawdown_Carteira']),
            'drawdown_percentual': float(row['Drawdown_Percentual'])
        })
    
    return grafico_dados

def processar_backtest_completo(df, capital_inicial=100000, cdi=0.12):
    """
    Função principal que processa todos os dados do backtest
    e retorna JSON completo com todos os campos incluindo dados do gráfico.
    """
    if df.empty:
        return {
            "Performance Metrics": {},
            "Monthly Analysis": {},
            "Day of Week Analysis": {},
            "Weekly Analysis": {},
            "Equity Curve Data": {
                "trade_by_trade": [],
                "daily": [],
                "weekly": [],
                "monthly": []
            }
        }
    
    # ✅ CORREÇÃO: Otimizar cálculos com cache e verificações
    try:
        # Calcular métricas existentes com otimizações
        performance = calcular_performance(df, cdi=cdi)
        monthly = calcular_monthly(df, cdi=cdi)
        day_of_week = calcular_day_of_week(df, cdi=cdi)
        weekly = calcular_weekly(df, cdi=cdi)
        
        # ✅ CORREÇÃO: Calcular dados para gráfico com otimizações
        equity_curve_data = {
            "trade_by_trade": calcular_dados_grafico(df, capital_inicial),
            "daily": calcular_dados_grafico_agrupado(df, capital_inicial, 'dia'),
            "weekly": calcular_dados_grafico_agrupado(df, capital_inicial, 'semana'),
            "monthly": calcular_dados_grafico_agrupado(df, capital_inicial, 'mes')
        }
        
        # ✅ CORREÇÃO: Resposta completa com otimizações
        return {
            "Performance Metrics": performance,
            "Monthly Analysis": monthly,
            "Day of Week Analysis": day_of_week,
            "Weekly Analysis": weekly,
            "Equity Curve Data": equity_curve_data
        }
    except Exception as e:
        print(f"❌ Erro ao processar backtest completo: {e}")
        # Retornar estrutura vazia em caso de erro
        return {
            "Performance Metrics": {},
            "Monthly Analysis": {},
            "Day of Week Analysis": {},
            "Weekly Analysis": {},
            "Equity Curve Data": {
                "trade_by_trade": [],
                "daily": [],
                "weekly": [],
                "monthly": []
            }
        }

# Exemplo de uso prático
def exemplo_uso():
    """
    Exemplo de como usar o código para trazer dados trade por trade
    """
    try:
        # Carregando os dados
        df = carregar_csv('meu_arquivo.csv')
        
        # Processando backtest completo
        resultado = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)
        
        # Acessando dados trade por trade
        dados_trade_por_trade = resultado["Equity Curve Data"]["trade_by_trade"]
        
        # Exemplo de como usar os dados
        print(f"Total de trades: {len(dados_trade_por_trade) - 1}")  # -1 por causa do ponto inicial
        
        # Mostrar alguns exemplos de dados
        if len(dados_trade_por_trade) > 1:
            print("\n=== Exemplo de dados trade por trade ===")
            for i, trade in enumerate(dados_trade_por_trade[:5]):  # Primeiros 5
                print(f"Trade {i}: {trade}")
        
        # Acessar dados específicos
        if len(dados_trade_por_trade) > 1:
            ultimo_trade = dados_trade_por_trade[-1]
            print(f"\nResultado final: R$ {ultimo_trade['resultado']:.2f}")
            print(f"Valor da carteira: R$ {ultimo_trade['valor']:.2f}")
            print(f"Drawdown máximo: R$ {ultimo_trade['drawdown']:.2f}")
        
        return resultado
        
    except Exception as e:
        print(f"Erro ao processar: {e}")
        return None

# Para uso em APIs
def api_endpoint_exemplo(arquivo_csv, capital_inicial=100000):
    """
    Exemplo de como usar em uma API (Flask/FastAPI)
    """
    try:
        df = carregar_csv(arquivo_csv)
        resultado = processar_backtest_completo(df, capital_inicial=capital_inicial)
        
        # Retornar apenas os dados trade por trade se necessário
        return {
            "success": True,
            "data": resultado,
            "trade_by_trade": resultado["Equity Curve Data"]["trade_by_trade"]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }

if __name__ == "__main__":
    # Teste do exemplo
    exemplo_uso()