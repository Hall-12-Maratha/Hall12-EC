import pandas as pd
import secrets
import string

INPUT_CSV = "users.csv"   # your CSV file name
EMAIL_COL = "email"        # column name containing emails

def generate_password(length=9):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Read the CSV
df = pd.read_csv(INPUT_CSV)

# Validate that the column exists
if EMAIL_COL not in df.columns:
    raise ValueError(f"Column '{EMAIL_COL}' not found in CSV. Found columns: {list(df.columns)}")

# Generate passwords
df["password"] = [generate_password(9) for _ in range(len(df))]

# Save back to the same CSV (overwrite)
df.to_csv(INPUT_CSV, index=False)

print(f"Passwords successfully added to '{INPUT_CSV}'!")
