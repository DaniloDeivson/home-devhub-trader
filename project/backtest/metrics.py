"""
Performance metrics calculation module.
Calculates various trading performance metrics from backtest results.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class PerformanceMetrics:
    """
    Calculates performance metrics from backtest results.
    """
    
    def __init__(self, backtest_results: Dict):
        """
        Initialize with backtest results.
        
        Args:
            backtest_results: Dictionary containing backtest results from BacktestEngine
        """
        self.results = backtest_results
        self.trades = backtest_results['trades']
        self.equity_curve = backtest_results['equity_curve']
        self.initial_capital = self.equity_curve[0]
        self.data = backtest_results['data']
        
        # Filter out trades with no exit (should not happen if backtest is complete)
        self.completed_trades = [t for t in self.trades if t['exit_date'] is not None]
        
        # Calculate basic metrics
        self.metrics = self._calculate_metrics()
    
    def _calculate_metrics(self) -> Dict:
        """
        Calculate all performance metrics.
        
        Returns:
            Dictionary containing all calculated metrics
        """
        if not self.completed_trades:
            return {
                'netProfit': 0,
                'totalTrades': 0,
                'winRate': 0,
                'averageWin': 0,
                'averageLoss': 0,
                'payoff': 0,
                'profitFactor': 0,
                'averageTrade': 0,
                'maxDrawdown': 0,
                'maxDrawdownAmount': 0,
                'maxConsecutiveLosses': 0,
                'maxConsecutiveWins': 0,
                'recoveryFactor': 0,
                'sharpeRatio': 0,
                'expectancy': 0,
                'averageTradeDuration': "0h 0min"
            }
        
        # Basic metrics
        net_profit = sum(t['pnl'] for t in self.completed_trades)
        total_trades = len(self.completed_trades)
        
        # Winning and losing trades
        winning_trades = [t for t in self.completed_trades if t['pnl'] > 0]
        losing_trades = [t for t in self.completed_trades if t['pnl'] <= 0]
        
        win_rate = (len(winning_trades) / total_trades) * 100 if total_trades > 0 else 0
        
        # Average win and loss
        avg_win = sum(t['pnl'] for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t['pnl'] for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        # Payoff ratio
        payoff = abs(avg_win / avg_loss) if avg_loss != 0 else 0
        
        # Profit factor
        gross_profit = sum(t['pnl'] for t in winning_trades)
        gross_loss = abs(sum(t['pnl'] for t in losing_trades))
        profit_factor = gross_profit / gross_loss if gross_loss != 0 else 0
        
        # Average trade
        avg_trade = net_profit / total_trades if total_trades > 0 else 0
        
        # Drawdown calculation
        equity_array = np.array(self.equity_curve)
        max_equity = np.maximum.accumulate(equity_array)
        drawdowns = (max_equity - equity_array) / max_equity * 100
        max_drawdown = np.max(drawdowns)
        max_drawdown_amount = np.max(max_equity - equity_array)
        
        # Consecutive wins and losses
        trade_results = [1 if t['pnl'] > 0 else 0 for t in self.completed_trades]
        max_consecutive_wins = self._max_consecutive(trade_results, 1)
        max_consecutive_losses = self._max_consecutive(trade_results, 0)
        
        # Recovery factor
        recovery_factor = net_profit / max_drawdown_amount if max_drawdown_amount > 0 else 0
        
        # Sharpe ratio (assuming daily returns)
        daily_returns = np.diff(equity_array) / equity_array[:-1]
        sharpe_ratio = np.mean(daily_returns) / np.std(daily_returns) * np.sqrt(252) if np.std(daily_returns) > 0 else 0
        
        # Expectancy
        expectancy = (win_rate/100 * avg_win) + ((1 - win_rate/100) * avg_loss)
        
        # Average trade duration
        durations = []
        for trade in self.completed_trades:
            if isinstance(trade['entry_date'], str):
                entry_date = pd.to_datetime(trade['entry_date'])
            else:
                entry_date = trade['entry_date']
                
            if isinstance(trade['exit_date'], str):
                exit_date = pd.to_datetime(trade['exit_date'])
            else:
                exit_date = trade['exit_date']
                
            duration = exit_date - entry_date
            durations.append(duration.total_seconds())
        
        avg_duration_seconds = sum(durations) / len(durations) if durations else 0
        hours = int(avg_duration_seconds // 3600)
        minutes = int((avg_duration_seconds % 3600) // 60)
        avg_trade_duration = f"{hours}h {minutes}min"
        
        # Day of week analysis
        day_of_week_analysis = self._analyze_by_day_of_week()
        
        # Monthly analysis
        monthly_analysis = self._analyze_by_month()
        
        return {
            'netProfit': net_profit,
            'totalTrades': total_trades,
            'winRate': win_rate,
            'averageWin': avg_win,
            'averageLoss': avg_loss,
            'payoff': payoff,
            'profitFactor': profit_factor,
            'averageTrade': avg_trade,
            'maxDrawdown': max_drawdown,
            'maxDrawdownAmount': max_drawdown_amount,
            'maxConsecutiveLosses': max_consecutive_losses,
            'maxConsecutiveWins': max_consecutive_wins,
            'recoveryFactor': recovery_factor,
            'sharpeRatio': sharpe_ratio,
            'expectancy': expectancy,
            'averageTradeDuration': avg_trade_duration,
            'dayOfWeekAnalysis': day_of_week_analysis,
            'monthlyAnalysis': monthly_analysis
        }
    
    def _max_consecutive(self, arr: List[int], value: int) -> int:
        """Calculate maximum consecutive occurrences of a value in an array"""
        max_count = 0
        current_count = 0
        
        for item in arr:
            if item == value:
                current_count += 1
                max_count = max(max_count, current_count)
            else:
                current_count = 0
                
        return max_count
    
    def _analyze_by_day_of_week(self) -> Dict:
        """Analyze performance by day of the week"""
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        day_analysis = {}
        
        for day in days:
            day_trades = []
            
            for trade in self.completed_trades:
                entry_date = pd.to_datetime(trade['entry_date']) if isinstance(trade['entry_date'], str) else trade['entry_date']
                day_of_week = entry_date.day_name().lower()
                
                if day_of_week == day:
                    day_trades.append(trade)
            
            if day_trades:
                winning_trades = [t for t in day_trades if t['pnl'] > 0]
                win_rate = (len(winning_trades) / len(day_trades)) * 100
                
                gross_profit = sum(t['pnl'] for t in day_trades if t['pnl'] > 0)
                gross_loss = abs(sum(t['pnl'] for t in day_trades if t['pnl'] <= 0))
                profit_factor = gross_profit / gross_loss if gross_loss > 0 else 1.0
                
                day_analysis[day] = {
                    'trades': len(day_trades),
                    'winRate': round(win_rate, 2),
                    'profitFactor': round(profit_factor, 2)
                }
            else:
                day_analysis[day] = {
                    'trades': 0,
                    'winRate': 0,
                    'profitFactor': 0
                }
        
        return day_analysis
    
    def _analyze_by_month(self) -> Dict:
        """Analyze performance by month"""
        months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ]
        month_analysis = {}
        
        for month in months:
            month_trades = []
            
            for trade in self.completed_trades:
                entry_date = pd.to_datetime(trade['entry_date']) if isinstance(trade['entry_date'], str) else trade['entry_date']
                trade_month = entry_date.month_name().lower()
                
                if trade_month == month:
                    month_trades.append(trade)
            
            if month_trades:
                winning_trades = [t for t in month_trades if t['pnl'] > 0]
                win_rate = (len(winning_trades) / len(month_trades)) * 100
                
                gross_profit = sum(t['pnl'] for t in month_trades if t['pnl'] > 0)
                gross_loss = abs(sum(t['pnl'] for t in month_trades if t['pnl'] <= 0))
                profit_factor = gross_profit / gross_loss if gross_loss > 0 else 1.0
                
                month_analysis[month] = {
                    'trades': len(month_trades),
                    'winRate': round(win_rate, 2),
                    'profitFactor': round(profit_factor, 2)
                }
            else:
                month_analysis[month] = {
                    'trades': 0,
                    'winRate': 0,
                    'profitFactor': 0
                }
        
        return month_analysis
    
    def get_metrics(self) -> Dict:
        """
        Get all calculated performance metrics.
        
        Returns:
            Dictionary containing all performance metrics
        """
        return self.metrics
    
    def get_summary(self) -> str:
        """
        Get a text summary of key performance metrics.
        
        Returns:
            String containing summary of key metrics
        """
        m = self.metrics
        
        summary = f"""
        Backtest Summary:
        -----------------
        Net Profit: ${m['netProfit']:.2f} ({((m['netProfit'] / self.initial_capital) * 100):.2f}%)
        Total Trades: {m['totalTrades']}
        Win Rate: {m['winRate']:.2f}%
        Profit Factor: {m['profitFactor']:.2f}
        Payoff Ratio: {m['payoff']:.2f}
        Average Trade: ${m['averageTrade']:.2f}
        Max Drawdown: {m['maxDrawdown']:.2f}% (${m['maxDrawdownAmount']:.2f})
        Sharpe Ratio: {m['sharpeRatio']:.2f}
        Expectancy: ${m['expectancy']:.2f}
        """
        
        return summary