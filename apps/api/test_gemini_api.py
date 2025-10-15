"""Quick test script to verify Gemini API connectivity."""
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Test configuration
API_KEY = os.getenv("OPENAI_API_KEY", "AIzaSyBneNuvOrOJFjasUKMwEWhqCbso2AXFiG8")
MODEL_NAMES_TO_TEST = [
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest"
]

def test_model(model_name):
    """Test if a model name works with the API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"

    payload = {
        "contents": [{
            "parts": [{"text": "Say hello"}]
        }]
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print(f"SUCCESS: {model_name}")
            return True
        else:
            print(f"FAILED: {model_name}: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print(f"ERROR: {model_name}: {str(e)}")
        return False

def list_available_models():
    """List all available models."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            models = response.json().get("models", [])
            print("\nAvailable Models:")
            for model in models:
                print(f"  - {model.get('name', 'Unknown')}")
        else:
            print(f"Failed to list models: {response.status_code}")
    except Exception as e:
        print(f"Error listing models: {str(e)}")

if __name__ == "__main__":
    print("Testing Gemini API Connection\n")
    print(f"API Key (first 20 chars): {API_KEY[:20]}...\n")

    # List available models first
    list_available_models()

    # Test each model name
    print("\nTesting Model Names:\n")
    working_models = []
    for model_name in MODEL_NAMES_TO_TEST:
        if test_model(model_name):
            working_models.append(model_name)

    print(f"\nWorking models: {working_models if working_models else 'None found'}")

