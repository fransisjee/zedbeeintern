import pandas as pd
import os

EXCEL_PATH = r"d:\anti\configurations database\zedbee_data.xlsx"

if os.path.exists(EXCEL_PATH):
    size = os.path.getsize(EXCEL_PATH)
    print(f"File exists. Size: {size} bytes")
    
    if size > 0:
        try:
            df = pd.read_excel(EXCEL_PATH)
            print("\n--- Excel Content Preview ---")
            print(df.to_string())
            print("\n-----------------------------")
        except Exception as e:
            print(f"Error reading Excel file: {e}")
    else:
        print("File is empty.")
else:
    print(f"File not found at: {EXCEL_PATH}")
