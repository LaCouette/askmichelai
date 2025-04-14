import os
import json
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Définir une classe TextLoader personnalisée avec encodage UTF-8
class UTF8TextLoader(TextLoader):
    """Text loader that uses UTF-8 encoding and has better error handling."""
    
    def __init__(self, file_path: str):
        """Initialize with file path."""
        super().__init__(file_path, encoding="utf-8", autodetect_encoding=True)

class KnowledgeBaseManager:
    def __init__(self, base_dir="knowledge_base"):
        """Initialize the knowledge base manager."""
        self.base_dir = base_dir
        self.vector_store = None
        
        # Utiliser les embeddings Hugging Face (pas besoin de clé API)
        print("Initialisation des embeddings HuggingFace...")
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Create knowledge base directory if it doesn't exist
        if not os.path.exists(base_dir):
            os.makedirs(base_dir)
            
        # Path to store the index
        self.index_path = os.path.join(base_dir, "faiss_index")
    
    def add_snippet(self, content, filename=None):
        """Add a new Liquid snippet to the knowledge base."""
        if not filename:
            # Generate a unique filename if none provided
            existing_files = os.listdir(self.base_dir)
            snippet_files = [f for f in existing_files if f.startswith("snippet_")]
            next_number = len(snippet_files) + 1
            filename = f"snippet_{next_number}.liquid"
        
        file_path = os.path.join(self.base_dir, filename)
        
        # Save the snippet
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return file_path
    
    def build_vector_store(self, rebuild=False):
        """Build or rebuild the vector store from all snippets."""
        # 1. Check if the store is already loaded in memory and we are not forcing a rebuild
        if self.vector_store is not None and not rebuild:
            print("Using cached vector store from memory.")
            return self.vector_store

        # 2. Check if index exists on disk and we're not forcing a rebuild
        if os.path.exists(self.index_path) and not rebuild:
            try:
                # Allow dangerous deserialization if needed, assuming the source is trusted
                self.vector_store = FAISS.load_local(
                    self.index_path, 
                    self.embeddings, 
                    allow_dangerous_deserialization=True
                )
                print("Loaded existing vector store from disk.")
                return self.vector_store
            except Exception as e:
                print(f"Error loading existing index from disk: {e}")
                print("Proceeding to rebuild index...")
                # Ensure vector_store is None if loading failed
                self.vector_store = None 
        
        # 3. If no valid store in memory or on disk (or rebuild is True), rebuild it
        print(f"{'Rebuilding' if rebuild else 'Building'} vector store...")
        
        # Liste de documents accumulés
        all_documents = []
        
        # Parcourir tous les fichiers liquid et les charger individuellement
        for root, _, files in os.walk(self.base_dir):
            for file in files:
                if file.endswith('.liquid'):
                    file_path = os.path.join(root, file)
                    try:
                        # Essayer de charger avec UTF-8
                        loader = UTF8TextLoader(file_path)
                        documents = loader.load()
                        all_documents.extend(documents)
                        print(f"Successfully loaded {file_path}")
                    except Exception as e:
                        print(f"Warning: Could not load {file_path}: {e}")
                        # Essayer de lire avec un encodage de repli
                        try:
                            with open(file_path, 'r', encoding='latin-1') as f:
                                content = f.read()
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(content)
                            print(f"Converted {file_path} to UTF-8, trying to load again")
                            loader = UTF8TextLoader(file_path)
                            documents = loader.load()
                            all_documents.extend(documents)
                        except Exception as e2:
                            print(f"Error: Still could not load {file_path} after conversion: {e2}")
        
        if not all_documents:
            print("No documents found in knowledge base.")
            return None
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=150
        )
        splits = text_splitter.split_documents(all_documents)
        
        # Create vector store
        self.vector_store = FAISS.from_documents(splits, self.embeddings)
        
        # Ensure index path exists before saving
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        self.vector_store.save_local(self.index_path)
        
        print(f"Built vector store with {len(splits)} chunks from {len(all_documents)} documents.")
        return self.vector_store
    
    def query_knowledge_base(self, query, k=5):
        """Query the knowledge base for relevant snippets."""
        if not self.vector_store:
            self.build_vector_store()
            
        if not self.vector_store:
            return []
            
        results = self.vector_store.similarity_search(query, k=k)
        return results