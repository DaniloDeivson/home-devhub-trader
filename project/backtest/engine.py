"""
Core backtesting engine module.
Handles the simulation of trading strategies on historical data.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Callable, Tuple, Optional, Union
from datetime import datetime, timedelta

class BacktestEngine:
    """
    Core backtesting engine that simulates trading strategies on historical data.
    """
    
    def __init__(self, 
                 data: pd.DataFrame, 
                 initial_capital: float = 10000.0,
                 commission: float = 0.0,
                 slippage: float = 0.0):
        """
        Initialize the backtesting engine.
        
        Args:
            data: DataFrame with historical price data (must include 'open', 'high', 'low', 'close')
            initial_capital: Starting capital for the backtest
            commission: Commission per trade (percentage)
            slippage: Slippage per trade (percentage)
        """
        self.data = data.copy()
        self.initial_capital = initial_capital
        self.commission = commission
        self.slippage = slippage
        
        # Ensure required columns exist
        required_columns = ['open', 'high', 'low', 'close', 'date']
        for col in required_columns:
            if col not in self.data.columns:
                if col == 'date' and 'datetime' in self.data.columns:
                    self.data['date'] = self.data['datetime']
                else:
                    raise ValueError(f"Data must contain '{col}' column")
        
        # Convert date column to datetime if it's not already
        if not pd.api.types.is_datetime64_any_dtype(self.data['date']):
            self.data['date'] = pd.to_datetime(self.data['date'])
            
        # Add day of week and month columns for analysis
        self.data['day_of_week'] = self.data['date'].dt.day_name().str.lower()
        self.data['month'] = self.data['date'].dt.month_name().str.lower()
        
        # Initialize results containers
        self.trades = []
        self.equity_curve = []
        self.positions = []
        self.current_position = 0
        self.current_capital = initial_capital
        
    def run(self, strategy_func: Callable) -> Dict:
        """
        Run the backtest using the provided strategy function.
        
        Args:
            strategy_func: Function that generates entry/exit signals
                           Should return a DataFrame with 'signal' column (1 for buy, -1 for sell, 0 for no action)
        
        Returns:
            Dict containing backtest results
        """
        # Reset state
        self.trades = []
        self.equity_curve = [self.initial_capital]
        self.positions = []
        self.current_position = 0
        self.current_capital = self.initial_capital
        
        # Generate signals using the strategy function
        signals = strategy_func(self.data)
        if not isinstance(signals, pd.DataFrame) or 'signal' not in signals.columns:
            raise ValueError("Strategy function must return DataFrame with 'signal' column")
        
        # Merge signals with price data
        backtest_data = pd.concat([self.data, signals['signal']], axis=1)
        
        # Simulate trading
        for i in range(1, len(backtest_data)):
            prev_row = backtest_data.iloc[i-1]
            current_row = backtest_data.iloc[i]
            
            # Process signals
            if self.current_position == 0 and prev_row['signal'] == 1:  # Buy signal
                entry_price = self._calculate_entry_price(current_row, 'buy')
                position_size = self._calculate_position_size(self.current_capital, entry_price)
                
                # Record trade
                trade = {
                    'entry_date': current_row['date'],
                    'entry_price': entry_price,
                    'position_size': position_size,
                    'direction': 'long',
                    'exit_date': None,
                    'exit_price': None,
                    'pnl': 0,
                    'pnl_pct': 0,
                    'commission': self._calculate_commission(entry_price * position_size),
                    'slippage': self._calculate_slippage(entry_price * position_size)
                }
                self.trades.append(trade)
                self.current_position = position_size
                
            elif self.current_position > 0 and prev_row['signal'] == -1:  # Sell signal
                exit_price = self._calculate_entry_price(current_row, 'sell')
                
                # Update last trade
                if self.trades:
                    last_trade = self.trades[-1]
                    if last_trade['exit_date'] is None:
                        last_trade['exit_date'] = current_row['date']
                        last_trade['exit_price'] = exit_price
                        
                        # Calculate P&L
                        entry_value = last_trade['entry_price'] * last_trade['position_size']
                        exit_value = exit_price * last_trade['position_size']
                        commission = last_trade['commission'] + self._calculate_commission(exit_value)
                        slippage = last_trade['slippage'] + self._calculate_slippage(exit_value)
                        
                        last_trade['pnl'] = exit_value - entry_value - commission - slippage
                        last_trade['pnl_pct'] = (last_trade['pnl'] / entry_value) * 100
                        
                        # Update capital
                        self.current_capital += last_trade['pnl']
                
                self.current_position = 0
            
            # Update equity curve
            if self.current_position > 0:
                # Mark-to-market current position
                current_value = self.current_position * current_row['close']
                unrealized_pnl = current_value - (self.trades[-1]['entry_price'] * self.trades[-1]['position_size'])
                self.equity_curve.append(self.current_capital + unrealized_pnl)
            else:
                self.equity_curve.append(self.current_capital)
            
            # Record position
            self.positions.append(self.current_position)
        
        # Close any open positions at the end of the backtest
        if self.current_position > 0 and self.trades and self.trades[-1]['exit_date'] is None:
            last_row = backtest_data.iloc[-1]
            last_trade = self.trades[-1]
            
            last_trade['exit_date'] = last_row['date']
            last_trade['exit_price'] = last_row['close']
            
            # Calculate P&L
            entry_value = last_trade['entry_price'] * last_trade['position_size']
            exit_value = last_trade['exit_price'] * last_trade['position_size']
            commission = last_trade['commission'] + self._calculate_commission(exit_value)
            slippage = last_trade['slippage'] + self._calculate_slippage(exit_value)
            
            last_trade['pnl'] = exit_value - entry_value - commission - slippage
            last_trade['pnl_pct'] = (last_trade['pnl'] / entry_value) * 100
            
            # Update capital
            self.current_capital += last_trade['pnl']
            self.equity_curve[-1] = self.current_capital
            self.current_position = 0
        
        # Prepare results
        results = {
            'trades': self.trades,
            'equity_curve': self.equity_curve,
            'positions': self.positions,
            'final_capital': self.current_capital,
            'return_pct': ((self.current_capital / self.initial_capital) - 1) * 100,
            'data': backtest_data
        }
        
        return results
    
    def _calculate_entry_price(self, row: pd.Series, direction: str) -> float:
        """Calculate entry price with slippage"""
        if direction == 'buy':
            return row['open'] * (1 + self.slippage)
        else:  # sell
            return row['open'] * (1 - self.slippage)
    
    def _calculate_position_size(self, capital: float, price: float) -> float:
        """Calculate position size based on available capital"""
        # Simple implementation: use all available capital
        return capital / price
    
    def _calculate_commission(self, trade_value: float) -> float:
        """Calculate commission for a trade"""
        return trade_value * self.commission
    
    def _calculate_slippage(self, trade_value: float) -> float:
        """Calculate slippage for a trade"""
        return trade_value * self.slippage