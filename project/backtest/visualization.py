"""
Data visualization module.
Creates charts and visualizations for backtest results.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, List, Optional, Tuple
import matplotlib.dates as mdates
from datetime import datetime

class BacktestVisualizer:
    """
    Creates visualizations for backtest results.
    """
    
    def __init__(self, backtest_results: Dict, metrics: Dict):
        """
        Initialize with backtest results and metrics.
        
        Args:
            backtest_results: Dictionary containing backtest results
            metrics: Dictionary containing performance metrics
        """
        self.results = backtest_results
        self.metrics = metrics
        self.equity_curve = backtest_results['equity_curve']
        self.trades = backtest_results['trades']
        self.data = backtest_results['data']
        
        # Set default style
        plt.style.use('dark_background')
    
    def plot_equity_curve(self, figsize: Tuple[int, int] = (10, 6)) -> plt.Figure:
        """
        Plot equity curve.
        
        Args:
            figsize: Figure size (width, height) in inches
            
        Returns:
            Matplotlib figure object
        """
        fig, ax = plt.subplots(figsize=figsize)
        
        # Convert dates if needed
        if 'date' in self.data.columns:
            dates = self.data['date']
            if len(dates) > len(self.equity_curve):
                dates = dates[:len(self.equity_curve)]
            elif len(dates) < len(self.equity_curve):
                # Pad dates if needed
                last_date = dates.iloc[-1]
                for i in range(len(self.equity_curve) - len(dates)):
                    if isinstance(last_date, pd.Timestamp):
                        last_date = last_date + pd.Timedelta(days=1)
                    else:
                        last_date = pd.Timestamp(last_date) + pd.Timedelta(days=1)
                    dates = pd.concat([dates, pd.Series([last_date])])
        else:
            dates = pd.date_range(start='2023-01-01', periods=len(self.equity_curve))
        
        # Plot equity curve
        ax.plot(dates, self.equity_curve, label='Equity', color='#4CAF50', linewidth=2)
        
        # Add initial capital as horizontal line
        ax.axhline(y=self.equity_curve[0], color='#90A4AE', linestyle='--', alpha=0.7, label='Initial Capital')
        
        # Calculate drawdowns
        equity_array = np.array(self.equity_curve)
        max_equity = np.maximum.accumulate(equity_array)
        drawdowns = max_equity - equity_array
        
        # Find max drawdown period
        max_dd_idx = np.argmax(drawdowns)
        max_dd_start = np.where(equity_array[:max_dd_idx] == max_equity[max_dd_idx])[0][-1] if max_dd_idx > 0 else 0
        
        # Highlight max drawdown
        if max_dd_idx > max_dd_start:
            ax.fill_between(
                dates[max_dd_start:max_dd_idx+1],
                equity_array[max_dd_start:max_dd_idx+1],
                max_equity[max_dd_start:max_dd_idx+1],
                color='#F44336',
                alpha=0.3,
                label=f'Max Drawdown: {self.metrics["maxDrawdown"]:.2f}%'
            )
        
        # Format x-axis to show dates nicely
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.xticks(rotation=45)
        
        # Add grid, legend, and labels
        ax.grid(True, alpha=0.3)
        ax.legend()
        ax.set_title('Equity Curve', fontsize=14)
        ax.set_xlabel('Date')
        ax.set_ylabel('Equity ($)')
        
        # Add key metrics as text
        metrics_text = (
            f"Net Profit: ${self.metrics['netProfit']:.2f}\n"
            f"Win Rate: {self.metrics['winRate']:.2f}%\n"
            f"Profit Factor: {self.metrics['profitFactor']:.2f}\n"
            f"Max Drawdown: {self.metrics['maxDrawdown']:.2f}%"
        )
        
        # Position text in the upper left with a slight offset
        ax.text(
            0.02, 0.98, metrics_text,
            transform=ax.transAxes,
            verticalalignment='top',
            horizontalalignment='left',
            bbox=dict(boxstyle='round', facecolor='#333333', alpha=0.7)
        )
        
        plt.tight_layout()
        return fig
    
    def plot_trade_distribution(self, figsize: Tuple[int, int] = (10, 6)) -> plt.Figure:
        """
        Plot trade profit/loss distribution.
        
        Args:
            figsize: Figure size (width, height) in inches
            
        Returns:
            Matplotlib figure object
        """
        if not self.trades:
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No trades to display", ha='center', va='center')
            return fig
        
        # Extract P&L from completed trades
        pnl_values = [t['pnl'] for t in self.trades if t['exit_date'] is not None]
        
        fig, ax = plt.subplots(figsize=figsize)
        
        # Create histogram
        n, bins, patches = ax.hist(pnl_values, bins=20, alpha=0.7, color='#2196F3')
        
        # Color positive and negative bars differently
        for i, patch in enumerate(patches):
            if bins[i] >= 0:
                patch.set_facecolor('#4CAF50')  # Green for profits
            else:
                patch.set_facecolor('#F44336')  # Red for losses
        
        # Add vertical line at zero
        ax.axvline(x=0, color='#FFFFFF', linestyle='-', alpha=0.7)
        
        # Add grid, labels, and title
        ax.grid(True, alpha=0.3)
        ax.set_title('Trade P&L Distribution', fontsize=14)
        ax.set_xlabel('Profit/Loss ($)')
        ax.set_ylabel('Number of Trades')
        
        # Add key metrics as text
        metrics_text = (
            f"Total Trades: {self.metrics['totalTrades']}\n"
            f"Winning Trades: {int(self.metrics['totalTrades'] * self.metrics['winRate'] / 100)}\n"
            f"Losing Trades: {int(self.metrics['totalTrades'] * (1 - self.metrics['winRate'] / 100))}\n"
            f"Average Win: ${self.metrics['averageWin']:.2f}\n"
            f"Average Loss: ${self.metrics['averageLoss']:.2f}"
        )
        
        # Position text in the upper right
        ax.text(
            0.98, 0.98, metrics_text,
            transform=ax.transAxes,
            verticalalignment='top',
            horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='#333333', alpha=0.7)
        )
        
        plt.tight_layout()
        return fig
    
    def plot_monthly_performance(self, figsize: Tuple[int, int] = (12, 6)) -> plt.Figure:
        """
        Plot monthly performance heatmap.
        
        Args:
            figsize: Figure size (width, height) in inches
            
        Returns:
            Matplotlib figure object
        """
        monthly_analysis = self.metrics.get('monthlyAnalysis', {})
        
        if not monthly_analysis:
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No monthly data available", ha='center', va='center')
            return fig
        
        # Month order
        months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ]
        
        # Extract profit factors
        profit_factors = [monthly_analysis.get(month, {}).get('profitFactor', 0) for month in months]
        
        # Create figure
        fig, ax = plt.subplots(figsize=figsize)
        
        # Create bar chart
        bars = ax.bar(
            [m.capitalize() for m in months],
            profit_factors,
            color=['#4CAF50' if pf >= 1 else '#F44336' for pf in profit_factors]
        )
        
        # Add value labels on top of bars
        for bar, pf in zip(bars, profit_factors):
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width()/2.,
                height + 0.1,
                f'{pf:.2f}',
                ha='center', 
                va='bottom',
                fontsize=9
            )
        
        # Add horizontal line at profit factor = 1
        ax.axhline(y=1, color='#FFFFFF', linestyle='--', alpha=0.7)
        
        # Add grid, labels, and title
        ax.grid(True, axis='y', alpha=0.3)
        ax.set_title('Monthly Profit Factor', fontsize=14)
        ax.set_ylabel('Profit Factor')
        
        # Rotate x-axis labels for better readability
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        return fig
    
    def plot_drawdown(self, figsize: Tuple[int, int] = (10, 6)) -> plt.Figure:
        """
        Plot drawdown chart.
        
        Args:
            figsize: Figure size (width, height) in inches
            
        Returns:
            Matplotlib figure object
        """
        # Calculate drawdowns
        equity_array = np.array(self.equity_curve)
        max_equity = np.maximum.accumulate(equity_array)
        drawdown_pct = (max_equity - equity_array) / max_equity * 100
        
        # Convert dates if needed
        if 'date' in self.data.columns:
            dates = self.data['date']
            if len(dates) > len(drawdown_pct):
                dates = dates[:len(drawdown_pct)]
            elif len(dates) < len(drawdown_pct):
                # Pad dates if needed
                last_date = dates.iloc[-1]
                for i in range(len(drawdown_pct) - len(dates)):
                    if isinstance(last_date, pd.Timestamp):
                        last_date = last_date + pd.Timedelta(days=1)
                    else:
                        last_date = pd.Timestamp(last_date) + pd.Timedelta(days=1)
                    dates = pd.concat([dates, pd.Series([last_date])])
        else:
            dates = pd.date_range(start='2023-01-01', periods=len(drawdown_pct))
        
        # Create figure
        fig, ax = plt.subplots(figsize=figsize)
        
        # Plot drawdown
        ax.fill_between(dates, 0, -drawdown_pct, color='#F44336', alpha=0.7)
        ax.plot(dates, -drawdown_pct, color='#F44336', linewidth=1)
        
        # Add horizontal line at zero
        ax.axhline(y=0, color='#FFFFFF', linestyle='-', alpha=0.3)
        
        # Format x-axis to show dates nicely
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.xticks(rotation=45)
        
        # Add grid, labels, and title
        ax.grid(True, alpha=0.3)
        ax.set_title('Drawdown Chart', fontsize=14)
        ax.set_xlabel('Date')
        ax.set_ylabel('Drawdown (%)')
        
        # Invert y-axis to show drawdowns as negative values going down
        ax.invert_yaxis()
        
        # Add max drawdown as text
        ax.text(
            0.02, 0.02,
            f"Max Drawdown: {self.metrics['maxDrawdown']:.2f}%",
            transform=ax.transAxes,
            verticalalignment='bottom',
            horizontalalignment='left',
            bbox=dict(boxstyle='round', facecolor='#333333', alpha=0.7)
        )
        
        plt.tight_layout()
        return fig
    
    def create_dashboard(self, figsize: Tuple[int, int] = (15, 10)) -> plt.Figure:
        """
        Create a comprehensive dashboard with multiple plots.
        
        Args:
            figsize: Figure size (width, height) in inches
            
        Returns:
            Matplotlib figure object
        """
        fig = plt.figure(figsize=figsize)
        
        # Create a 2x2 grid of subplots
        gs = fig.add_gridspec(2, 2, hspace=0.3, wspace=0.3)
        
        # Equity curve (top left)
        ax1 = fig.add_subplot(gs[0, 0])
        self._plot_equity_curve_on_axis(ax1)
        
        # Drawdown (top right)
        ax2 = fig.add_subplot(gs[0, 1])
        self._plot_drawdown_on_axis(ax2)
        
        # Trade distribution (bottom left)
        ax3 = fig.add_subplot(gs[1, 0])
        self._plot_trade_distribution_on_axis(ax3)
        
        # Monthly performance (bottom right)
        ax4 = fig.add_subplot(gs[1, 1])
        self._plot_monthly_performance_on_axis(ax4)
        
        # Add title to the figure
        fig.suptitle('Backtest Performance Dashboard', fontsize=16)
        
        plt.tight_layout(rect=[0, 0, 1, 0.97])  # Adjust for the suptitle
        return fig
    
    def _plot_equity_curve_on_axis(self, ax: plt.Axes) -> None:
        """Helper method to plot equity curve on a given axis"""
        # Convert dates if needed
        if 'date' in self.data.columns:
            dates = self.data['date']
            if len(dates) > len(self.equity_curve):
                dates = dates[:len(self.equity_curve)]
            elif len(dates) < len(self.equity_curve):
                # Pad dates if needed
                last_date = dates.iloc[-1]
                for i in range(len(self.equity_curve) - len(dates)):
                    if isinstance(last_date, pd.Timestamp):
                        last_date = last_date + pd.Timedelta(days=1)
                    else:
                        last_date = pd.Timestamp(last_date) + pd.Timedelta(days=1)
                    dates = pd.concat([dates, pd.Series([last_date])])
        else:
            dates = pd.date_range(start='2023-01-01', periods=len(self.equity_curve))
        
        # Plot equity curve
        ax.plot(dates, self.equity_curve, label='Equity', color='#4CAF50', linewidth=2)
        
        # Add initial capital as horizontal line
        ax.axhline(y=self.equity_curve[0], color='#90A4AE', linestyle='--', alpha=0.7)
        
        # Format x-axis to show dates nicely
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.setp(ax.get_xticklabels(), rotation=45, ha='right')
        
        # Add grid and labels
        ax.grid(True, alpha=0.3)
        ax.set_title('Equity Curve')
        ax.set_ylabel('Equity ($)')
    
    def _plot_drawdown_on_axis(self, ax: plt.Axes) -> None:
        """Helper method to plot drawdown on a given axis"""
        # Calculate drawdowns
        equity_array = np.array(self.equity_curve)
        max_equity = np.maximum.accumulate(equity_array)
        drawdown_pct = (max_equity - equity_array) / max_equity * 100
        
        # Convert dates if needed
        if 'date' in self.data.columns:
            dates = self.data['date']
            if len(dates) > len(drawdown_pct):
                dates = dates[:len(drawdown_pct)]
            elif len(dates) < len(drawdown_pct):
                # Pad dates if needed
                last_date = dates.iloc[-1]
                for i in range(len(drawdown_pct) - len(dates)):
                    if isinstance(last_date, pd.Timestamp):
                        last_date = last_date + pd.Timedelta(days=1)
                    else:
                        last_date = pd.Timestamp(last_date) + pd.Timedelta(days=1)
                    dates = pd.concat([dates, pd.Series([last_date])])
        else:
            dates = pd.date_range(start='2023-01-01', periods=len(drawdown_pct))
        
        # Plot drawdown
        ax.fill_between(dates, 0, -drawdown_pct, color='#F44336', alpha=0.7)
        
        # Format x-axis to show dates nicely
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.setp(ax.get_xticklabels(), rotation=45, ha='right')
        
        # Add grid and labels
        ax.grid(True, alpha=0.3)
        ax.set_title('Drawdown')
        ax.set_ylabel('Drawdown (%)')
        
        # Invert y-axis to show drawdowns as negative values going down
        ax.invert_yaxis()
    
    def _plot_trade_distribution_on_axis(self, ax: plt.Axes) -> None:
        """Helper method to plot trade distribution on a given axis"""
        if not self.trades:
            ax.text(0.5, 0.5, "No trades to display", ha='center', va='center')
            return
        
        # Extract P&L from completed trades
        pnl_values = [t['pnl'] for t in self.trades if t['exit_date'] is not None]
        
        # Create histogram
        n, bins, patches = ax.hist(pnl_values, bins=20, alpha=0.7, color='#2196F3')
        
        # Color positive and negative bars differently
        for i, patch in enumerate(patches):
            if bins[i] >= 0:
                patch.set_facecolor('#4CAF50')  # Green for profits
            else:
                patch.set_facecolor('#F44336')  # Red for losses
        
        # Add vertical line at zero
        ax.axvline(x=0, color='#FFFFFF', linestyle='-', alpha=0.7)
        
        # Add grid and labels
        ax.grid(True, alpha=0.3)
        ax.set_title('Trade P&L Distribution')
        ax.set_xlabel('Profit/Loss ($)')
        ax.set_ylabel('Number of Trades')
    
    def _plot_monthly_performance_on_axis(self, ax: plt.Axes) -> None:
        """Helper method to plot monthly performance on a given axis"""
        monthly_analysis = self.metrics.get('monthlyAnalysis', {})
        
        if not monthly_analysis:
            ax.text(0.5, 0.5, "No monthly data available", ha='center', va='center')
            return
        
        # Month order
        months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ]
        
        # Extract profit factors
        profit_factors = [monthly_analysis.get(month, {}).get('profitFactor', 0) for month in months]
        
        # Create bar chart
        bars = ax.bar(
            [m[:3].capitalize() for m in months],  # Use abbreviated month names
            profit_factors,
            color=['#4CAF50' if pf >= 1 else '#F44336' for pf in profit_factors]
        )
        
        # Add horizontal line at profit factor = 1
        ax.axhline(y=1, color='#FFFFFF', linestyle='--', alpha=0.7)
        
        # Add grid and labels
        ax.grid(True, axis='y', alpha=0.3)
        ax.set_title('Monthly Profit Factor')
        ax.set_ylabel('Profit Factor')