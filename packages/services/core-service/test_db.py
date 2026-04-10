import psycopg2
import sys

url = "postgresql://postgres:JXaYfLedIWpwfXXOFuRkhSityLMAfole@crossover.proxy.rlwy.net:40549/railway"
try:
    conn = psycopg2.connect(url)
    print("Conexão bem-sucedida!")
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
    sys.exit(1)
