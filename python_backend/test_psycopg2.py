try:
    import psycopg2
    print("psycopg2 is installed")
except ImportError as e:
    print(f"Error: {e}")
