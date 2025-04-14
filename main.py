import os
import sys
import uvicorn
from app import app

def main():
    """Main entry point for the application."""
    # Ensure the knowledge base directory exists
    os.makedirs("knowledge_base", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    
    # Start the server without initializing the knowledge base
    print("Starting Shopify Section Creator...")
    print("Access the application at http://localhost:8080 once the server is running.")
    uvicorn.run("app:app", host="127.0.0.1", port=8080, reload=True)

if __name__ == "__main__":
    main()