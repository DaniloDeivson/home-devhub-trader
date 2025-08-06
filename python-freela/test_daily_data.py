#!/usr/bin/env python3
"""
Test script to verify daily data generation
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import carregar_csv_safe
from FunCalculos import calcular_dados_grafico_agrupado, processar_backtest_completo
import pandas as pd

def test_daily_data():
    """Test daily data generation"""
    
    # Test file
    test_file = "../Topo Fundo 2min WIN.csv"
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return
    
    print(f"🔍 Testing daily data generation with file: {test_file}")
    
    try:
        # Load CSV
        df = carregar_csv_safe(test_file)
        print(f"✅ CSV loaded successfully, shape: {df.shape}")
        print(f"📋 Columns: {df.columns.tolist()}")
        
        # Check if we have date columns
        if 'entry_date' in df.columns:
            print(f"📅 Entry date column found")
            print(f"📅 Date range: {df['entry_date'].min()} to {df['entry_date'].max()}")
        else:
            print("⚠️ No entry_date column found!")
            return
        
        # Test daily data generation
        print(f"\n🔍 Testing daily data generation...")
        daily_data = calcular_dados_grafico_agrupado(df, capital_inicial=100000, agrupar_por='dia')
        
        print(f"📅 Daily data length: {len(daily_data)}")
        if len(daily_data) > 0:
            print(f"📅 First daily entry: {daily_data[0]}")
            print(f"📅 Last daily entry: {daily_data[-1]}")
        else:
            print("⚠️ No daily data generated!")
        
        # Test complete backtest
        print(f"\n🔍 Testing complete backtest...")
        resultado = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)
        
        if 'Equity Curve Data' in resultado:
            equity_data = resultado['Equity Curve Data']
            print(f"📊 Equity Curve Data keys: {list(equity_data.keys())}")
            
            if 'daily' in equity_data:
                daily_data = equity_data['daily']
                print(f"📅 Daily data from complete backtest: {len(daily_data)} entries")
                if len(daily_data) > 0:
                    print(f"📅 First entry: {daily_data[0]}")
                else:
                    print("⚠️ No daily data in complete backtest!")
            else:
                print("⚠️ No 'daily' key in Equity Curve Data!")
        else:
            print("⚠️ No 'Equity Curve Data' in resultado!")
        
        # Save sample data for debugging
        with open('debug_daily_data.json', 'w', encoding='utf-8') as f:
            import json
            json.dump(daily_data[:5], f, indent=2, ensure_ascii=False, default=str)
        print("💾 Sample daily data saved to debug_daily_data.json")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_daily_data() 