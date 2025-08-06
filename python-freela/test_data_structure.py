#!/usr/bin/env python3
"""
Test script to verify data structure and identify issues with graph and daily metrics
"""
import requests
import os
import json

def test_data_structure():
    """Test the data structure returned by the API"""
    
    # Test file
    test_file = "../Topo Fundo 2min WIN.csv"
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return
    
    print(f"🔍 Testing data structure with file: {test_file}")
    
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
                        else:
                            print("⚠️ No daily data found!")
                    
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
                
                # Save full response for debugging
                with open('debug_response.json', 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False, default=str)
                print("💾 Full response saved to debug_response.json")
                
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"📄 Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error during upload: {e}")

if __name__ == "__main__":
    test_data_structure() 