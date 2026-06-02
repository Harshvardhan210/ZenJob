
import os
import sys

print("Step 1: Check BASE_DIR")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print(f"BASE_DIR: {BASE_DIR}")

print("Step 2: Load .env")
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))
print("GEMINI_API_KEY:", os.getenv("GEMINI_API_KEY"))

print("Step 3: Import app.main")
try:
    from app import main
    print("app.main imported successfully")
except Exception as e:
    print(f"Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()

print("Step 4: Done")
