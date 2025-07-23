"""
Example usage of the backtesting system.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from backtest import BacktestEngine, PerformanceMetrics, BacktestVisualizer, TradeExecutor

def load_sample_data():
    """Load sample price data or generate synthetic data"""
    # Generate synthetic data for demonstration
    np.random.seed(42)
    dates = pd.date_range(start='2023-01-01', periods=252)  # One year of trading days
    
    # Start with a price and add random walk
    price = 100
    prices = [price]
    for _ in range(251):
        change = np.random.normal(0, 1)  # Random price change
        price += change
        prices.append(price)
    
    # Create OHLC data
    data = pd.DataFrame({
        'date': dates,
        'open': prices,
        'high': [p + abs(np.random.normal(0, 0.5)) for p in prices],
        'low': [p - abs(np.random.normal(0, 0.5)) for p in prices],
        'close': [p + np.random.normal(0, 0.2) for p in prices]
    })
    
    # Ensure high is always highest and low is always lowest
    data['high'] = data[['open', 'high', 'close']].max(axis=1)
    data['low'] = data[['open', 'low', 'close']].min(axis=1)
    
    return data

def simple_moving_average_strategy(data, short_period=20, long_period=50):
    """
    Simple moving average crossover strategy.
    
    Args:
        data: DataFrame with price data
        short_period: Short moving average period
        long_period: Long moving average period
        
    Returns:
        DataFrame with signal column
    """
    # Calculate moving averages
    data = data.copy()
    data['short_ma'] = data['close'].rolling(window=short_period).mean()
    data['long_ma'] = data['close'].rolling(window=long_period).mean()
    
    # Generate signals
    data['signal'] = 0
    
    # Buy signal: short MA crosses above long MA
    data.loc[data['short_ma'] > data['long_ma'], 'signal'] = 1
    
    # Sell signal: short MA crosses below long MA
    data.loc[data['short_ma'] < data['long_ma'], 'signal'] = -1
    
    # Remove signals before moving averages are calculated
    data.loc[:long_period, 'signal'] = 0
    
    return data[['signal']]

def main():
    """Main function to run the example"""
    # Load or generate data
    data = load_sample_data()
    
    # Initialize backtesting components
    engine = BacktestEngine(data, initial_capital=10000, commission=0.001)
    executor = TradeExecutor(
        position_sizing='percent_risk',
        risk_per_trade=0.02,
        stop_loss_atr_multiple=2.0,
        take_profit_atr_multiple=3.0,
        trailing_stop=True
    )
    
    # Run backtest
    results = engine.run(lambda data: simple_moving_average_strategy(data))
    
    # Calculate performance metrics
    metrics = PerformanceMetrics(results).get_metrics()
    
    # Create visualizations
    visualizer = BacktestVisualizer(results, metrics)
    dashboard = visualizer.create_dashboard()
    
    # Print summary
    print("\nBacktest Results Summary:")
    print(f"Net Profit: ${metrics['netProfit']:.2f}")
    print(f"Total Trades: {metrics['totalTrades']}")
    print(f"Win Rate: {metrics['winRate']:.2f}%")
    print(f"Profit Factor: {metrics['profitFactor']:.2f}")
    print(f"Max Drawdown: {metrics['maxDrawdown']:.2f}%")
    print(f"Sharpe Ratio: {metrics['sharpeRatio']:.2f}")
    
    # Show the dashboard
    plt.show()

if __name__ == "__main__":
    main()