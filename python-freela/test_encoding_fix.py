#!/usr/bin/env python3
"""
Test script to verify the improved CSV loading function
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import carregar_csv_safe
import pandas as pd

def test_csv_loading():
    """Test the improved CSV loading function with different files"""
    
    # Test files to try
    test_files = [
        "../Topo Fundo 2min WDO.csv",
        "../Topo Fundo 2min WIN.csv", 
        "Doc/csv teste.csv"
    ]
    
    for file_path in test_files:
        if os.path.exists(file_path):
            print(f"\n🔍 Testing file: {file_path}")
            try:
                df = carregar_csv_safe(file_path)
                print(f"✅ Successfully loaded {file_path}")
                print(f"   Shape: {df.shape}")
                print(f"   Columns: {df.columns.tolist()}")
                print(f"   First few rows:")
                print(df.head(3))
                
            except Exception as e:
                print(f"❌ Failed to load {file_path}: {e}")
        else:
            print(f"⚠️ File not found: {file_path}")

if __name__ == "__main__":
    test_csv_loading() 