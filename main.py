import os
import sys
import uvicorn
from app import app
from knowledge_base_manager import KnowledgeBaseManager

def main():
    """Main entry point for the application."""
    # Ensure the knowledge base directory exists
    os.makedirs("knowledge_base", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    
    # Initialize the knowledge base
    kb_manager = KnowledgeBaseManager()
    
    # Check if we need to build the knowledge base
    if not os.path.exists(os.path.join("knowledge_base", "faiss_index")):
        print("Initializing knowledge base... This might take a moment if you have many snippets.")
        kb_manager.build_vector_store()
    
    # Start the server
    print("Starting Shopify Section Creator...")
    print("Access the application at http://localhost:8080 once the server is running.")
    uvicorn.run("app:app", host="127.0.0.1", port=8080, reload=True)

if __name__ == "__main__":
    main()