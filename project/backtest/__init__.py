"""
Backtesting system package.
Provides tools for backtesting trading strategies.
"""

from .engine import BacktestEngine
from .metrics import PerformanceMetrics
from .visualization import BacktestVisualizer
from .execution import TradeExecutor

__all__ = ['BacktestEngine', 'PerformanceMetrics', 'BacktestVisualizer', 'TradeExecutor']