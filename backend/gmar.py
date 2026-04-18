import google.generativeai as genai

# Configure API key
genai.configure(api_key="AIzaSyAvKocW8QrAQeGMqBKP29XD01wln5GCnj0")

# List all models
models = genai.list_models()

for model in models:
    print(model.name)
    print("  Supported methods:", model.supported_generation_methods)
    print()