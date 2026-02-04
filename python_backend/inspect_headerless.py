import pandas as pd
import os

filepath = r"d:\anti\configurations database\zedbee\auth.xlsx"
if os.path.exists(filepath):
    df = pd.read_excel(filepath, header=None)
    print("Content of auth.xlsx (should be headerless):")
    print(df.values)
else:
    print("File not found")
