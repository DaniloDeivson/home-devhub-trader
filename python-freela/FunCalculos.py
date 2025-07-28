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
    pnl = sub['Res. Operação']
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
    pnl = df['Res. Operação']
    net_profit = pnl.sum()
    profit_trades = df[pnl > 0]
    loss_trades = df[pnl < 0]
    gross_profit = profit_trades['Res. Operação'].sum()
    gross_loss = loss_trades['Res. Operação'].sum()
    avg_win = profit_trades['Res. Operação'].mean() or 0
    avg_loss = loss_trades['Res. Operação'].mean() or 0
    avg_per_trade = net_profit / total_trades if total_trades > 0 else 0
    win_rate = len(profit_trades) / total_trades * 100 if total_trades > 0 else 0
    profit_factor = gross_profit / abs(gross_loss) if gross_loss != 0 else 0
    payoff = avg_win / abs(avg_loss) if avg_loss != 0 else 0

    returns = pnl.values
    mean_return = np.mean(returns)
    std_return = np.std(returns, ddof=1)
    sharpe_ratio = ((mean_return - cdi) / std_return) if std_return != 0 else 0
    dias_com_operacoes = df['Abertura'].dt.date.nunique()
    media_operacoes_por_dia = total_trades / dias_com_operacoes if dias_com_operacoes > 0 else 0

    equity = pnl.cumsum()
    peak = equity.cummax()
    dd_ser = equity - peak
    max_dd = float(dd_ser.min()) if not dd_ser.empty else 0
    pct_dd = abs(max_dd) / equity.iloc[-1] * 100 if equity.iloc[-1] != 0 else 0

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

    durations = df['Fechamento'] - df['Abertura']
    avg_dur = durations.mean() if total_trades > 0 else timedelta(0)
    dur_win = (profit_trades['Fechamento'] - profit_trades['Abertura']).mean() if len(profit_trades) > 0 else timedelta(0)
    dur_loss = (loss_trades['Fechamento'] - loss_trades['Abertura']).mean() if len(loss_trades) > 0 else timedelta(0)

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
        "Max Trade Drawdown ($)": trade_dd,
        "Max Trade Drawdown (%)": trade_dd_pct,
        "Average Trade Duration": _format_timedelta(avg_dur),
        "Avg Winning Trade Duration": _format_timedelta(dur_win),
        "Avg Losing Trade Duration": _format_timedelta(dur_loss),
        "Recovery Factor": recovery,
        "Sharpe Ratio": sharpe_dd_simplificado,
        "Avg Trades/Active Day": media_operacoes_por_dia,
        "Active Days": dias_com_operacoes,
    }

def calcular_day_of_week(df, cdi=0.12):
    df = df.copy()
    df['DayOfWeek'] = df['Abertura'].dt.day_name()
    dias = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    stats = {}
    for dia in dias:
        sub = df[df['DayOfWeek'] == dia]
        lucro, pf, sharpe, sharpe_simp, trades = calcular_metrics(sub, cdi=cdi)
        wins = sub[sub['Res. Operação'] > 0]
        win_rate = len(wins) / trades * 100 if trades > 0 else 0
        # Calcular rentabilidade total (lucro total do período)
        rentabilidade_total = lucro
        
        stats[dia] = {
            "Trades": trades,
            "Net Profit": lucro,
            "Profit Factor": pf,
            "Win Rate (%)": round(win_rate, 2),
            "Sharpe Ratio": sharpe_simp,
            "Rentabilidade ($)": round(rentabilidade_total, 2)
        }

    dias_com_operacoes = {k: v for k, v in stats.items() if v["Trades"] > 0}

    if dias_com_operacoes:
        best_day = max(dias_com_operacoes.items(), key=lambda x: x[1]['Net Profit'])[0]
        worst_day = min(dias_com_operacoes.items(), key=lambda x: x[1]['Net Profit'])[0]
        worst_day_stats = stats.get(worst_day, {})
        best_day_stats = stats.get(best_day, {})
    else:
        best_day = worst_day = 0
        worst_day_stats = best_day_stats = {
            "Trades": 0,
            "Net Profit": 0,
            "Profit Factor": 0,
            "Win Rate (%)": 0,
            "Sharpe Ratio": 0,
            "Rentabilidade ($)": 0
        }

    return {
        "Stats": stats,
        "Best Day": {"Day": best_day, **best_day_stats},
        "Worst Day": {"Day": worst_day, **worst_day_stats}
    }

def calcular_monthly(df, cdi=0.12):
    df = df.copy()
    
    # Ordenar por data de abertura para cálculo correto do drawdown
    df = df.sort_values('Abertura').reset_index(drop=True)
    
    # Calcular equity curve global para drawdown correto
    df['Saldo'] = df['Res. Operação'].cumsum()
    df['Saldo_Maximo'] = df['Saldo'].cummax()
    df['Drawdown'] = df['Saldo'] - df['Saldo_Maximo']
    
    df['MonthNum'] = df['Abertura'].dt.month
    df['Year'] = df['Abertura'].dt.year
    df['YearMonth'] = df['Abertura'].dt.to_period('M')
    
    stats = {}

    for m in range(1, 13):
        sub = df[df['MonthNum'] == m]
        
        if len(sub) > 0:
            lucro, pf, sharpe, sharpe_simp, trades = calcular_metrics(sub, cdi=cdi)

            # Taxa de acerto
            wins = sub[sub['Res. Operação'] > 0]
            win_rate = len(wins) / trades * 100 if trades > 0 else 0
            
            # Calcular drawdown máximo do mês
            max_drawdown_mes = sub['Drawdown'].min() if not sub['Drawdown'].empty else 0
            
            # Calcular drawdown percentual baseado no saldo final do mês
            saldo_final_mes = sub['Saldo'].iloc[-1] if not sub['Saldo'].empty else 0
            drawdown_percentual = (abs(max_drawdown_mes) / saldo_final_mes * 100) if saldo_final_mes != 0 else 0

            # Calcular rentabilidade total (lucro total do período)
            rentabilidade_total = lucro

            stats[calendar.month_name[m]] = {
                "Trades": trades,
                "Win Rate (%)": round(win_rate, 2),
                "Net Profit": lucro,
                "Profit Factor": pf,
                "Sharpe Ratio": sharpe_simp,
                "Max Drawdown ($)": round(max_drawdown_mes, 2),
                "Max Drawdown (%)": round(drawdown_percentual, 2),
                "Rentabilidade ($)": round(rentabilidade_total, 2)
            }
        else:
            stats[calendar.month_name[m]] = {
                "Trades": 0,
                "Win Rate (%)": 0,
                "Net Profit": 0.0,
                "Profit Factor": 0,
                "Sharpe Ratio": 0,
                "Max Drawdown ($)": 0.0,
                "Max Drawdown (%)": 0.0,
                "Rentabilidade ($)": 0.0
            }

    # Filtrar apenas meses com operações para determinar melhor/pior
    meses_com_operacoes = {k: v for k, v in stats.items() if v["Trades"] > 0}
    
    if meses_com_operacoes:
        best_month = max(meses_com_operacoes.items(), key=lambda x: x[1]['Net Profit'])[0]
        worst_month = min(
            (item for item in meses_com_operacoes.items() if item[1]['Net Profit'] < 0),
            key=lambda x: x[1]['Net Profit'],
            default=(None, {})
        )[0]
    else:
        best_month = None
        worst_month = None

    return {
        "Stats": stats,
        "Best Month": {"Month": best_month, **stats.get(best_month, {})} if best_month else {"Month": None},
        "Worst Month": {"Month": worst_month, **stats.get(worst_month, {})} if worst_month else {"Month": None}
    }

def calcular_weekly(df, cdi=0.12):
    df = df.copy()
    df['WeekNum'] = df['Abertura'].dt.isocalendar().week
    stats = {}
    weeks = sorted(df['WeekNum'].unique())
    for w in weeks:
        sub = df[df['WeekNum'] == w]
        lucro, pf, sharpe, sharpe_simp, trades = calcular_metrics(sub, cdi=cdi)
        wins = sub[sub['Res. Operação'] > 0]
        win_rate = len(wins) / trades * 100 if trades > 0 else 0
        # Calcular rentabilidade total (lucro total do período)
        rentabilidade_total = lucro
        
        stats[f"Semana {w}"] = {
            "Trades": trades,
            "Net Profit": lucro,
            "Profit Factor": pf,
            "Sharpe Ratio": sharpe,
            "Sharpe DDx3": sharpe_simp,
            "Win Rate (%)": round(win_rate, 2),
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
    
    # Ordenar por data de abertura
    df = df.sort_values('Abertura').reset_index(drop=True)
    
    # Calcular equity curve trade por trade (PADRONIZADO: apenas saldo cumulativo)
    df['Saldo'] = df['Res. Operação'].cumsum()
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
    grafico_dados.append({
        "date": df['Abertura'].iloc[0].strftime('%Y-%m-%d'),
        "fullDate": df['Abertura'].iloc[0].strftime('%d/%m/%Y'),
        "saldo": 0.0,  # Saldo inicial sempre 0
        "valor": float(capital_inicial),  # Patrimônio inicial
        "resultado": 0.0,  # Resultado inicial sempre 0
        "drawdown": 0.0,
        "drawdownPercent": 0.0,
        "peak": float(capital_inicial),
        "trades": 0,
        "isStart": True
    })
    
    # Dados para cada trade (incluindo trades com resultado 0)
    for i, row in df.iterrows():
        grafico_dados.append({
            "date": row['Abertura'].strftime('%Y-%m-%d'),
            "fullDate": row['Abertura'].strftime('%d/%m/%Y %H:%M'),
            "saldo": float(row['Saldo']),  # ESTE é o valor que você quer mostrar
            "valor": float(row['Valor_Carteira']),  # Patrimônio total (saldo + capital)
            "resultado": float(row['Saldo']),  # Mantém compatibilidade
            "drawdown": float(abs(row['Drawdown_Carteira'])),  # Sempre positivo
            "drawdownPercent": float(abs(row['Drawdown_Percentual'])),
            "peak": float(row['Peak_Carteira']),
            "trades": int(i + 1),
            "trade_result": float(row['Res. Operação']),  # Incluir mesmo se for 0
            "trade_percent": float(row['Res. Operação (%)']) if pd.notna(row['Res. Operação (%)']) else 0.0,
            "month": row['Abertura'].strftime('%B'),
            "isStart": False
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
    
    # Ordenar por data de abertura
    df = df.sort_values('Abertura').reset_index(drop=True)
    
    # Calcular equity curve trade por trade (PADRONIZADO: apenas saldo cumulativo)
    df['Saldo'] = df['Res. Operação'].cumsum()
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
        df['Periodo'] = df['Abertura'].dt.date
    elif agrupar_por == 'semana':
        df['Periodo'] = df['Abertura'].dt.to_period('W')
    elif agrupar_por == 'mes':
        df['Periodo'] = df['Abertura'].dt.to_period('M')
    else:
        raise ValueError("agrupar_por deve ser 'dia', 'semana', 'mes' ou 'trade'")
    
    # Agrupar dados - CORRIGIDO para versões antigas do pandas
    try:
        # Tentar com include_groups=False (pandas >= 2.1)
        grupos = df.groupby('Periodo', include_groups=False).agg({
            'Res. Operação': ['sum', 'count'],
            'Saldo': 'last',
            'Saldo_Maximo': 'last',
            'Drawdown': 'min',
            'Valor_Carteira': 'last',
            'Peak_Carteira': 'last',
            'Drawdown_Carteira': 'max',
            'Drawdown_Percentual': 'max',
            'Abertura': 'first'
        }).reset_index()
    except TypeError:
        # Fallback para versões antigas do pandas
        grupos = df.groupby('Periodo').agg({
            'Res. Operação': ['sum', 'count'],
            'Saldo': 'last',
            'Saldo_Maximo': 'last',
            'Drawdown': 'min',
            'Valor_Carteira': 'last',
            'Peak_Carteira': 'last',
            'Drawdown_Carteira': 'max',
            'Drawdown_Percentual': 'max',
            'Abertura': 'first'
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
        "date": primeira_data.strftime('%Y-%m-%d'),
        "fullDate": primeira_data.strftime('%d/%m/%Y'),
        "saldo": 0.0,  # Saldo inicial sempre 0
        "valor": capital_inicial,  # Patrimônio inicial
        "resultado": 0.0,  # Resultado inicial sempre 0
        "drawdown": 0,
        "drawdownPercent": 0,
        "peak": capital_inicial,
        "trades": 0,
        "isStart": True
    })
    
    # Dados para cada período (incluindo períodos com valores 0)
    for i, row in grupos.iterrows():
        if agrupar_por == 'dia':
            date_str = row['Periodo'].strftime('%Y-%m-%d')
            display_date = row['Periodo'].strftime('%d/%m/%Y')
        elif agrupar_por == 'semana':
            date_str = f"{row['Periodo'].year}-W{row['Periodo'].week:02d}"
            display_date = f"Semana {row['Periodo'].week}/{row['Periodo'].year}"
        elif agrupar_por == 'mes':
            date_str = f"{row['Periodo'].year}-{row['Periodo'].month:02d}"
            display_date = f"{row['Periodo'].month:02d}/{row['Periodo'].year}"
        
        # Garantir que valores 0 sejam preservados
        grafico_dados.append({
            "date": date_str,
            "fullDate": display_date,
            "saldo": float(row['Saldo']) if pd.notna(row['Saldo']) else 0.0,  # Saldo cumulativo
            "valor": float(row['Valor_Carteira']) if pd.notna(row['Valor_Carteira']) else 0.0,  # Patrimônio total
            "resultado": float(row['Saldo']) if pd.notna(row['Saldo']) else 0.0,  # Mantém compatibilidade
            "drawdown": float(abs(row['Drawdown_Carteira'])) if pd.notna(row['Drawdown_Carteira']) else 0.0,
            "drawdownPercent": float(abs(row['Drawdown_Percentual'])) if pd.notna(row['Drawdown_Percentual']) else 0.0,
            "peak": float(row['Peak_Carteira']) if pd.notna(row['Peak_Carteira']) else 0.0,
            "trades": int(row['Trades_Periodo']) if pd.notna(row['Trades_Periodo']) else 0,
            "resultado_periodo": float(row['Resultado_Periodo']) if pd.notna(row['Resultado_Periodo']) else 0.0,
            "periodo": agrupar_por,
            "isStart": False
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
    
    # Calcular métricas existentes
    performance = calcular_performance(df, cdi=cdi)
    monthly = calcular_monthly(df, cdi=cdi)
    day_of_week = calcular_day_of_week(df, cdi=cdi)
    weekly = calcular_weekly(df, cdi=cdi)
    
    # Calcular dados para gráfico
    equity_curve_data = {
        "trade_by_trade": calcular_dados_grafico(df, capital_inicial),
        "daily": calcular_dados_grafico_agrupado(df, capital_inicial, 'dia'),
        "weekly": calcular_dados_grafico_agrupado(df, capital_inicial, 'semana'),
        "monthly": calcular_dados_grafico_agrupado(df, capital_inicial, 'mes')
    }
    
    # Resposta completa
    return {
        "Performance Metrics": performance,
        "Monthly Analysis": monthly,
        "Day of Week Analysis": day_of_week,
        "Weekly Analysis": weekly,
        "Equity Curve Data": equity_curve_data
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