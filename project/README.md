# Streamlined Backtesting System

A modular, efficient backtesting system for trading strategies with a focus on performance and simplicity.

## Features

- **Modular Design**: Separate components for core engine, metrics calculation, visualization, and trade execution
- **Performance Optimized**: Streamlined code for efficient backtesting
- **Comprehensive Metrics**: Calculates all essential trading performance metrics
- **Visualization Tools**: Creates insightful charts and dashboards
- **Flexible Execution Logic**: Supports various position sizing and risk management approaches

## Components

The system is organized into four main modules:

1. **Engine** (`backtest/engine.py`): Core backtesting engine that simulates trading strategies on historical data
2. **Metrics** (`backtest/metrics.py`): Calculates performance metrics from backtest results
3. **Visualization** (`backtest/visualization.py`): Creates charts and visualizations for backtest results
4. **Execution** (`backtest/execution.py`): Handles trade execution logic based on strategy signals

## Usage Example

```python
import pandas as pd
from backtest import BacktestEngine, PerformanceMetrics, BacktestVisualizer, TradeExecutor

# Load your price data
data = pd.read_csv('price_data.csv')

# Define your strategy function
def my_strategy(data):
    # Your strategy logic here
    # Should return a DataFrame with a 'signal' column
    signals = pd.DataFrame(index=data.index)
    signals['signal'] = 0  # 1 for buy, -1 for sell, 0 for no action
    
    # Example: Simple moving average crossover
    data['short_ma'] = data['close'].rolling(window=20).mean()
    data['long_ma'] = data['close'].rolling(window=50).mean()
    
    signals.loc[data['short_ma'] > data['long_ma'], 'signal'] = 1
    signals.loc[data['short_ma'] < data['long_ma'], 'signal'] = -1
    
    return signals

# Initialize backtesting components
engine = BacktestEngine(data, initial_capital=10000, commission=0.001)
executor = TradeExecutor(position_sizing='percent_risk', risk_per_trade=0.02)

# Run backtest
results = engine.run(my_strategy)

# Calculate performance metrics
metrics = PerformanceMetrics(results).get_metrics()

# Create visualizations
visualizer = BacktestVisualizer(results, metrics)
dashboard = visualizer.create_dashboard()
dashboard.show()
```

## Key Metrics Calculated

- Net Profit
- Total Trades
- Win Rate
- Average Win/Loss
- Payoff Ratio
- Profit Factor
- Maximum Drawdown
- Sharpe Ratio
- Recovery Factor
- Expectancy
- Day of Week Analysis
- Monthly Performance Analysis

## Requirements

- Python 3.7+
- pandas
- numpy
- matplotlib

## Installation

Clone the repository and install the required packages:

```bash
git clone https://github.com/yourusername/streamlined-backtesting.git
cd streamlined-backtesting
pip install -r requirements.txt
```

## License

MIT