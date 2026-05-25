import google.generativeai as genai
import os
import sys

def list_models(api_key):
    try:
        genai.configure(api_key=api_key)
        print("Successfully configured genai.")
        
        print("Available models supporting generateContent:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name} (Methods: {m.supported_generation_methods})")
                
    except Exception as e:
        print(f"Error listing models: {str(e)}")

if __name__ == "__main__":
    # Get key from .env or first arg
    from dotenv import load_dotenv
    load_dotenv()
    
    key = os.getenv("GEMINI_API_KEY")
    if len(sys.argv) > 1:
        key = sys.argv[1]
        
    if not key:
        print("No API key found. Please provide it as an argument or in .env")
    else:
        list_models(key)
