#!/usr/bin/env python3
"""
Test script to verify complete API response structure
"""
import requests
import os
import json

def test_api_response():
    """Test the complete API response structure"""
    
    # Test file
    test_file = "../Topo Fundo 2min WIN.csv"
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return
    
    print(f"🔍 Testing complete API response with file: {test_file}")
    
    # Test the /api/tabela endpoint
    url = "http://localhost:5002/api/tabela"
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': (os.path.basename(test_file), f, 'text/csv')}
            data = {'capital_inicial': '100000', 'cdi': '0.12'}
            
            print(f"📤 Uploading file to {url}...")
            response = requests.post(url, files=files, data=data)
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Upload successful!")
                print(f"📋 Response keys: {list(result.keys())}")
                
                # Check Equity Curve Data structure
                if 'Equity Curve Data' in result:
                    equity_data = result['Equity Curve Data']
                    print(f"📊 Equity Curve Data keys: {list(equity_data.keys())}")
                    
                    # Check daily data
                    if 'daily' in equity_data:
                        daily_data = equity_data['daily']
                        print(f"📅 Daily data length: {len(daily_data)}")
                        if len(daily_data) > 0:
                            print(f"📅 First daily entry: {daily_data[0]}")
                            print(f"📅 Daily data keys: {list(daily_data[0].keys())}")
                        else:
                            print("⚠️ No daily data found!")
                    else:
                        print("⚠️ No 'daily' key in Equity Curve Data!")
                    
                    # Check trade_by_trade data
                    if 'trade_by_trade' in equity_data:
                        trade_data = equity_data['trade_by_trade']
                        print(f"📈 Trade by trade data length: {len(trade_data)}")
                        if len(trade_data) > 0:
                            print(f"📈 First trade entry: {trade_data[0]}")
                        else:
                            print("⚠️ No trade by trade data found!")
                
                # Check Performance Metrics
                if 'Performance Metrics' in result:
                    perf_metrics = result['Performance Metrics']
                    print(f"📈 Performance Metrics keys: {list(perf_metrics.keys())}")
                
                # Test metrics-from-data endpoint
                print(f"\n🔍 Testing /api/trades/metrics-from-data endpoint...")
                metrics_url = "http://localhost:5002/api/trades/metrics-from-data"
                
                # Prepare trades data for metrics endpoint
                if 'Equity Curve Data' in result and 'trade_by_trade' in result['Equity Curve Data']:
                    trades_data = result['Equity Curve Data']['trade_by_trade']
                    
                    # Convert to format expected by metrics endpoint
                    trades_for_metrics = []
                    for trade in trades_data:
                        if not trade.get('isStart', False):
                            trades_for_metrics.append({
                                'entry_date': trade.get('date', ''),
                                'exit_date': trade.get('date', ''),
                                'pnl': trade.get('resultado', 0)
                            })
                    
                    metrics_data = {
                        'trades': trades_for_metrics,
                        'capital_inicial': 100000,
                        'cdi': 0.12
                    }
                    
                    print(f"📊 Sending {len(trades_for_metrics)} trades to metrics endpoint...")
                    metrics_response = requests.post(metrics_url, json=metrics_data)
                    
                    print(f"📊 Metrics response status: {metrics_response.status_code}")
                    
                    if metrics_response.status_code == 200:
                        metrics_result = metrics_response.json()
                        print(f"✅ Metrics endpoint successful!")
                        print(f"📋 Metrics response keys: {list(metrics_result.keys())}")
                        
                        if 'metricas_principais' in metrics_result:
                            metricas = metrics_result['metricas_principais']
                            print(f"📈 Métricas principais keys: {list(metricas.keys())}")
                            print(f"📈 Drawdown médio: {metricas.get('drawdown_medio', 'N/A')}")
                            print(f"📈 Resultado líquido: {metricas.get('resultado_liquido', 'N/A')}")
                        else:
                            print("⚠️ No 'metricas_principais' in metrics response!")
                    else:
                        print(f"❌ Metrics endpoint failed: {metrics_response.status_code}")
                        print(f"📄 Response: {metrics_response.text}")
                else:
                    print("⚠️ No trade data available for metrics endpoint test!")
                
                # Save full response for debugging
                with open('debug_complete_response.json', 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False, default=str)
                print("💾 Complete response saved to debug_complete_response.json")
                
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"📄 Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error during upload: {e}")

if __name__ == "__main__":
    test_api_response() 