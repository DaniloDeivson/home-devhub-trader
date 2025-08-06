#!/usr/bin/env python3
"""
Test script to verify server file upload functionality
"""
import requests
import os

def test_server_upload():
    """Test the server's file upload functionality"""
    
    # Test file
    test_file = "../Topo Fundo 2min WIN.csv"
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return
    
    print(f"🔍 Testing server upload with file: {test_file}")
    
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
                if 'Performance Metrics' in result:
                    print(f"📈 Performance Metrics found")
                if 'equity_curve_data' in result:
                    print(f"📊 Equity curve data found")
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"📄 Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error during upload: {e}")

if __name__ == "__main__":
    test_server_upload() 