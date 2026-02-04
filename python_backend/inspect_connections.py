import pandas as pd
import os

filepath = r"d:\anti\configurations database\zedbee\connections.xlsx"
if os.path.exists(filepath):
    df = pd.read_excel(filepath, header=None)
    print("Content of connections.xlsx (Vertical):")
    print(df.values)
else:
    print("File not found")
