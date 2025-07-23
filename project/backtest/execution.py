"""
Trade execution logic module.
Handles the execution of trades based on strategy signals.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Callable, Optional, Union, Tuple

class TradeExecutor:
    """
    Handles trade execution logic for backtesting.
    """
    
    def __init__(self, 
                 position_sizing: str = 'fixed',
                 risk_per_trade: float = 0.02,
                 fixed_position_size: float = 1.0,
                 stop_loss_atr_multiple: float = 2.0,
                 take_profit_atr_multiple: float = 3.0,
                 trailing_stop: bool = False,
                 trailing_stop_activation: float = 1.0,
                 trailing_stop_distance: float = 1.0):
        """
        Initialize trade executor with execution parameters.
        
        Args:
            position_sizing: Method for position sizing ('fixed', 'percent_risk', 'percent_equity')
            risk_per_trade: Percentage of capital to risk per trade (for percent_risk)
            fixed_position_size: Fixed position size (for fixed)
            stop_loss_atr_multiple: Multiple of ATR for stop loss placement
            take_profit_atr_multiple: Multiple of ATR for take profit placement
            trailing_stop: Whether to use trailing stops
            trailing_stop_activation: Multiple of ATR to activate trailing stop
            trailing_stop_distance: Multiple of ATR for trailing stop distance
        """
        self.position_sizing = position_sizing
        self.risk_per_trade = risk_per_trade
        self.fixed_position_size = fixed_position_size
        self.stop_loss_atr_multiple = stop_loss_atr_multiple
        self.take_profit_atr_multiple = take_profit_atr_multiple
        self.trailing_stop = trailing_stop
        self.trailing_stop_activation = trailing_stop_activation
        self.trailing_stop_distance = trailing_stop_distance
    
    def calculate_position_size(self, 
                               capital: float, 
                               entry_price: float, 
                               stop_loss_price: Optional[float] = None) -> float:
        """
        Calculate position size based on position sizing method.
        
        Args:
            capital: Available capital
            entry_price: Entry price
            stop_loss_price: Stop loss price (for percent_risk)
            
        Returns:
            Position size (quantity)
        """
        if self.position_sizing == 'fixed':
            return self.fixed_position_size
        
        elif self.position_sizing == 'percent_equity':
            # Use a percentage of equity
            return (capital * self.risk_per_trade) / entry_price
        
        elif self.position_sizing == 'percent_risk':
            # Calculate based on risk per trade
            if stop_loss_price is None:
                # Default to 2% below entry if no stop loss provided
                stop_loss_price = entry_price * 0.98
            
            risk_per_unit = abs(entry_price - stop_loss_price)
            if risk_per_unit == 0:
                return self.fixed_position_size  # Fallback to fixed size
            
            risk_amount = capital * self.risk_per_trade
            return risk_amount / risk_per_unit
        
        else:
            # Default to fixed size
            return self.fixed_position_size
    
    def calculate_stop_loss(self, 
                           entry_price: float, 
                           direction: str, 
                           atr: Optional[float] = None) -> float:
        """
        Calculate stop loss price.
        
        Args:
            entry_price: Entry price
            direction: Trade direction ('long' or 'short')
            atr: Average True Range value (if available)
            
        Returns:
            Stop loss price
        """
        if atr is None:
            # Default to percentage-based stop if ATR not available
            if direction == 'long':
                return entry_price * 0.98  # 2% below entry
            else:
                return entry_price * 1.02  # 2% above entry
        else:
            # ATR-based stop
            if direction == 'long':
                return entry_price - (atr * self.stop_loss_atr_multiple)
            else:
                return entry_price + (atr * self.stop_loss_atr_multiple)
    
    def calculate_take_profit(self, 
                             entry_price: float, 
                             direction: str, 
                             atr: Optional[float] = None) -> float:
        """
        Calculate take profit price.
        
        Args:
            entry_price: Entry price
            direction: Trade direction ('long' or 'short')
            atr: Average True Range value (if available)
            
        Returns:
            Take profit price
        """
        if atr is None:
            # Default to percentage-based target if ATR not available
            if direction == 'long':
                return entry_price * 1.03  # 3% above entry
            else:
                return entry_price * 0.97  # 3% below entry
        else:
            # ATR-based target
            if direction == 'long':
                return entry_price + (atr * self.take_profit_atr_multiple)
            else:
                return entry_price - (atr * self.take_profit_atr_multiple)
    
    def update_trailing_stop(self, 
                            current_price: float, 
                            direction: str, 
                            entry_price: float,
                            current_stop: float,
                            atr: Optional[float] = None) -> float:
        """
        Update trailing stop price.
        
        Args:
            current_price: Current market price
            direction: Trade direction ('long' or 'short')
            entry_price: Entry price
            current_stop: Current stop loss price
            atr: Average True Range value (if available)
            
        Returns:
            Updated stop loss price
        """
        if not self.trailing_stop:
            return current_stop
        
        # Default ATR value if not provided
        atr_value = atr if atr is not None else (entry_price * 0.01)
        
        if direction == 'long':
            # Check if price has moved enough to activate trailing stop
            activation_threshold = entry_price + (atr_value * self.trailing_stop_activation)
            
            if current_price >= activation_threshold:
                # Calculate new stop based on trailing distance
                new_stop = current_price - (atr_value * self.trailing_stop_distance)
                # Only update if new stop is higher than current stop
                if new_stop > current_stop:
                    return new_stop
        
        elif direction == 'short':
            # Check if price has moved enough to activate trailing stop
            activation_threshold = entry_price - (atr_value * self.trailing_stop_activation)
            
            if current_price <= activation_threshold:
                # Calculate new stop based on trailing distance
                new_stop = current_price + (atr_value * self.trailing_stop_distance)
                # Only update if new stop is lower than current stop
                if new_stop < current_stop:
                    return new_stop
        
        return current_stop
    
    def check_stop_loss_hit(self, 
                           current_bar: pd.Series, 
                           stop_loss: float, 
                           direction: str) -> bool:
        """
        Check if stop loss was hit during the bar.
        
        Args:
            current_bar: Current price bar (OHLC)
            stop_loss: Stop loss price
            direction: Trade direction ('long' or 'short')
            
        Returns:
            True if stop loss was hit, False otherwise
        """
        if direction == 'long':
            return current_bar['low'] <= stop_loss
        else:
            return current_bar['high'] >= stop_loss
    
    def check_take_profit_hit(self, 
                             current_bar: pd.Series, 
                             take_profit: float, 
                             direction: str) -> bool:
        """
        Check if take profit was hit during the bar.
        
        Args:
            current_bar: Current price bar (OHLC)
            take_profit: Take profit price
            direction: Trade direction ('long' or 'short')
            
        Returns:
            True if take profit was hit, False otherwise
        """
        if direction == 'long':
            return current_bar['high'] >= take_profit
        else:
            return current_bar['low'] <= take_profit
    
    def apply_execution_logic(self, 
                             data: pd.DataFrame, 
                             signals: pd.Series, 
                             initial_capital: float = 10000.0,
                             commission: float = 0.0,
                             slippage: float = 0.0) -> Dict:
        """
        Apply execution logic to signals and generate trades.
        
        Args:
            data: DataFrame with price data
            signals: Series with trade signals (1 for buy, -1 for sell, 0 for no action)
            initial_capital: Initial capital
            commission: Commission per trade (percentage)
            slippage: Slippage per trade (percentage)
            
        Returns:
            Dictionary with execution results
        """
        # Ensure data has required columns
        required_columns = ['open', 'high', 'low', 'close']
        for col in required_columns:
            if col not in data.columns:
                raise ValueError(f"Data must contain '{col}' column")
        
        # Calculate ATR if not in data
        if 'atr' not in data.columns:
            data['atr'] = self._calculate_atr(data, period=14)
        
        # Initialize results
        trades = []
        equity_curve = [initial_capital]
        positions = []
        
        current_position = 0
        current_capital = initial_capital
        in_trade = False
        entry_price = 0
        entry_date = None
        stop_loss = 0
        take_profit = 0
        position_size = 0
        direction = ''
        
        # Combine data and signals
        if len(signals) != len(data):
            raise ValueError("Signals length must match data length")
        
        combined_data = data.copy()
        combined_data['signal'] = signals
        
        # Simulate trading
        for i in range(1, len(combined_data)):
            prev_row = combined_data.iloc[i-1]
            current_row = combined_data.iloc[i]
            
            # Update equity and positions
            if in_trade:
                # Check for exit conditions
                stop_hit = self.check_stop_loss_hit(current_row, stop_loss, direction)
                target_hit = self.check_take_profit_hit(current_row, take_profit, direction)
                exit_signal = prev_row['signal'] == -1 if direction == 'long' else prev_row['signal'] == 1
                
                if stop_hit or target_hit or exit_signal:
                    # Determine exit price
                    if stop_hit:
                        exit_price = stop_loss
                        exit_reason = 'stop_loss'
                    elif target_hit:
                        exit_price = take_profit
                        exit_reason = 'take_profit'
                    else:
                        exit_price = current_row['open'] * (1 - slippage) if direction == 'long' else current_row['open'] * (1 + slippage)
                        exit_reason = 'signal'
                    
                    # Calculate P&L
                    if direction == 'long':
                        pnl = (exit_price - entry_price) * position_size
                    else:
                        pnl = (entry_price - exit_price) * position_size
                    
                    # Subtract commission
                    commission_amount = (entry_price * position_size * commission) + (exit_price * position_size * commission)
                    pnl -= commission_amount
                    
                    # Update capital
                    current_capital += pnl
                    
                    # Record trade
                    trade = {
                        'entry_date': entry_date,
                        'entry_price': entry_price,
                        'exit_date': current_row.name if hasattr(current_row, 'name') else i,
                        'exit_price': exit_price,
                        'position_size': position_size,
                        'direction': direction,
                        'pnl': pnl,
                        'pnl_pct': (pnl / (entry_price * position_size)) * 100,
                        'exit_reason': exit_reason,
                        'commission': commission_amount,
                        'slippage': 0  # Slippage is already included in the price
                    }
                    trades.append(trade)
                    
                    # Reset trade variables
                    in_trade = False
                    current_position = 0
                
                else:
                    # Update trailing stop if enabled
                    stop_loss = self.update_trailing_stop(
                        current_row['close'],
                        direction,
                        entry_price,
                        stop_loss,
                        current_row['atr'] if 'atr' in current_row else None
                    )
                    
                    # Update current position value
                    if direction == 'long':
                        current_position = position_size * current_row['close']
                    else:
                        current_position = position_size * (2 * entry_price - current_row['close'])
            
            # Check for entry signals
            elif not in_trade:
                if prev_row['signal'] == 1:  # Buy signal
                    direction = 'long'
                    entry_price = current_row['open'] * (1 + slippage)
                    entry_date = current_row.name if hasattr(current_row, 'name') else i
                    
                    # Calculate stop loss and take profit
                    atr = current_row['atr'] if 'atr' in current_row else None
                    stop_loss = self.calculate_stop_loss(entry_price, direction, atr)
                    take_profit = self.calculate_take_profit(entry_price, direction, atr)
                    
                    # Calculate position size
                    position_size = self.calculate_position_size(current_capital, entry_price, stop_loss)
                    
                    # Update state
                    in_trade = True
                    current_position = position_size * entry_price
                
                elif prev_row['signal'] == -1:  # Sell signal (for short positions)
                    direction = 'short'
                    entry_price = current_row['open'] * (1 - slippage)
                    entry_date = current_row.name if hasattr(current_row, 'name') else i
                    
                    # Calculate stop loss and take profit
                    atr = current_row['atr'] if 'atr' in current_row else None
                    stop_loss = self.calculate_stop_loss(entry_price, direction, atr)
                    take_profit = self.calculate_take_profit(entry_price, direction, atr)
                    
                    # Calculate position size
                    position_size = self.calculate_position_size(current_capital, entry_price, stop_loss)
                    
                    # Update state
                    in_trade = True
                    current_position = position_size * entry_price
            
            # Update equity curve
            if in_trade:
                # Mark-to-market current position
                if direction == 'long':
                    position_value = position_size * current_row['close']
                    unrealized_pnl = position_value - (position_size * entry_price)
                else:
                    unrealized_pnl = position_size * (entry_price - current_row['close'])
                
                equity_curve.append(current_capital + unrealized_pnl)
            else:
                equity_curve.append(current_capital)
            
            # Record position
            positions.append(current_position)
        
        # Close any open positions at the end
        if in_trade:
            last_row = combined_data.iloc[-1]
            exit_price = last_row['close']
            
            # Calculate P&L
            if direction == 'long':
                pnl = (exit_price - entry_price) * position_size
            else:
                pnl = (entry_price - exit_price) * position_size
            
            # Subtract commission
            commission_amount = (entry_price * position_size * commission) + (exit_price * position_size * commission)
            pnl -= commission_amount
            
            # Update capital
            current_capital += pnl
            
            # Record trade
            trade = {
                'entry_date': entry_date,
                'entry_price': entry_price,
                'exit_date': last_row.name if hasattr(last_row, 'name') else len(combined_data) - 1,
                'exit_price': exit_price,
                'position_size': position_size,
                'direction': direction,
                'pnl': pnl,
                'pnl_pct': (pnl / (entry_price * position_size)) * 100,
                'exit_reason': 'end_of_data',
                'commission': commission_amount,
                'slippage': 0  # Slippage is already included in the price
            }
            trades.append(trade)
            
            # Update final equity
            equity_curve[-1] = current_capital
        
        # Prepare results
        results = {
            'trades': trades,
            'equity_curve': equity_curve,
            'positions': positions,
            'final_capital': current_capital,
            'return_pct': ((current_capital / initial_capital) - 1) * 100,
            'data': combined_data
        }
        
        return results
    
    def _calculate_atr(self, data: pd.DataFrame, period: int = 14) -> pd.Series:
        """
        Calculate Average True Range (ATR).
        
        Args:
            data: DataFrame with OHLC data
            period: ATR period
            
        Returns:
            Series with ATR values
        """
        high = data['high']
        low = data['low']
        close = data['close'].shift(1)
        
        tr1 = high - low
        tr2 = abs(high - close)
        tr3 = abs(low - close)
        
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        
        # Fill NaN values with a reasonable default
        atr = atr.fillna(tr.mean())
        
        return atr