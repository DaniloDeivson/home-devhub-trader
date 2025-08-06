import pandas as pd
import io

# CSV simples para teste
csv_content = """entry_date,exit_date,pnl
2024-01-01T10:00:00,2024-01-01T10:30:00,100
2024-01-01T11:00:00,2024-01-01T11:15:00,-50
2024-01-01T12:00:00,2024-01-01T12:45:00,200
2024-01-01T13:00:00,2024-01-01T13:20:00,-100
2024-01-01T14:00:00,2024-01-01T14:30:00,150"""

print("=== TESTE DEBUG CSV ===")

# Testar leitura direta
print("=== TESTE 1: Leitura direta ===")
csv_buffer = io.StringIO(csv_content)
df_direct = pd.read_csv(csv_buffer)
print(f"DataFrame direto: {len(df_direct)} linhas")
print(df_direct.head())

# Testar com skiprows=5
print("\n=== TESTE 2: Com skiprows=5 ===")
csv_buffer = io.StringIO(csv_content)
try:
    df_skip = pd.read_csv(csv_buffer, skiprows=5)
    print(f"DataFrame com skiprows: {len(df_skip)} linhas")
    print(df_skip.head())
except Exception as e:
    print(f"Erro com skiprows: {e}")

# Testar com sep=';'
print("\n=== TESTE 3: Com sep=';' ===")
csv_buffer = io.StringIO(csv_content)
try:
    df_sep = pd.read_csv(csv_buffer, sep=';')
    print(f"DataFrame com sep=';': {len(df_sep)} linhas")
    print(df_sep.head())
except Exception as e:
    print(f"Erro com sep=';': {e}")

# Testar com encoding='latin1'
print("\n=== TESTE 4: Com encoding='latin1' ===")
csv_buffer = io.StringIO(csv_content)
try:
    df_enc = pd.read_csv(csv_buffer, encoding='latin1')
    print(f"DataFrame com encoding: {len(df_enc)} linhas")
    print(df_enc.head())
except Exception as e:
    print(f"Erro com encoding: {e}")

# Testar com decimal=','
print("\n=== TESTE 5: Com decimal=',' ===")
csv_buffer = io.StringIO(csv_content)
try:
    df_dec = pd.read_csv(csv_buffer, decimal=',')
    print(f"DataFrame com decimal: {len(df_dec)} linhas")
    print(df_dec.head())
except Exception as e:
    print(f"Erro com decimal: {e}")

# Testar combinação
print("\n=== TESTE 6: Combinação de parâmetros ===")
csv_buffer = io.StringIO(csv_content)
try:
    df_comb = pd.read_csv(csv_buffer, skiprows=5, sep=';', encoding='latin1', decimal=',')
    print(f"DataFrame com combinação: {len(df_comb)} linhas")
    print(df_comb.head())
except Exception as e:
    print(f"Erro com combinação: {e}") 