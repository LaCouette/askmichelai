import os
import sys
import subprocess
import platform

def check_python_version():
    """Check if Python version is compatible."""
    print("Vérification de la version de Python...")
    if sys.version_info < (3, 8):
        print("Ce projet requiert Python 3.8 ou supérieur.")
        print(f"Votre version: Python {sys.version_info.major}.{sys.version_info.minor}")
        sys.exit(1)
    print(f"✓ Version Python compatible détectée: {sys.version_info.major}.{sys.version_info.minor}")

def create_virtual_env():
    """Create virtual environment."""
    print("\nCréation de l'environnement virtuel...")
    if os.path.exists("venv"):
        print("Un environnement virtuel existe déjà. Voulez-vous le recréer ? (y/n)")
        choice = input().lower()
        if choice == 'y':
            try:
                if platform.system() == "Windows":
                    subprocess.run(["rmdir", "/s", "/q", "venv"], check=True, shell=True)
                else:
                    subprocess.run(["rm", "-rf", "venv"], check=True)
            except subprocess.SubprocessError:
                print("Erreur lors de la suppression de l'environnement virtuel existant.")
                sys.exit(1)
        else:
            print("Utilisation de l'environnement virtuel existant.")
            return

    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✓ Environnement virtuel créé avec succès.")
    except subprocess.SubprocessError:
        print("Erreur lors de la création de l'environnement virtuel.")
        sys.exit(1)

def install_dependencies():
    """Install required dependencies."""
    print("\nInstallation des dépendances...")
    
    # Get the correct pip and python commands
    if platform.system() == "Windows":
        pip_cmd = os.path.join("venv", "Scripts", "pip")
        python_cmd = os.path.join("venv", "Scripts", "python")
    else:
        pip_cmd = os.path.join("venv", "bin", "pip")
        python_cmd = os.path.join("venv", "bin", "python")
    
    # Update pip
    try:
        subprocess.run([pip_cmd, "install", "--upgrade", "pip"], check=True)
        print("✓ Pip mis à jour.")
    except subprocess.SubprocessError:
        print("Avertissement: Impossible de mettre à jour pip. Poursuite de l'installation...")
    
    # Install dependencies
    required_packages = [
        "langchain",
        "langchain-community",
        "openai",
        "python-dotenv",
        "fastapi",
        "uvicorn",
        "jinja2",
        "python-multipart",
        "faiss-cpu",
        "pillow",
        "requests",
        "sentence-transformers"
    ]
    
    try:
        subprocess.run([pip_cmd, "install"] + required_packages, check=True)
        print("✓ Dépendances installées avec succès.")
    except subprocess.SubprocessError:
        print("Erreur lors de l'installation des dépendances.")
        sys.exit(1)

def create_env_file():
    """Create .env file for API keys."""
    print("\nCréation du fichier .env...")
    
    if os.path.exists(".env"):
        print("Un fichier .env existe déjà. Voulez-vous le reconfigurer ? (y/n)")
        choice = input().lower()
        if choice != 'y':
            print("Conservation du fichier .env existant.")
            return
    
    print("\nVous avez besoin uniquement d'une clé API OpenRouter pour accéder à tous les services.")
    print("Vous pouvez obtenir une clé sur https://openrouter.ai/")
    openrouter_key = input("\nEntrez votre clé API OpenRouter: ")
    
    with open(".env", "w") as f:
        f.write(f"OPENROUTER_API_KEY={openrouter_key}\n")
    
    print("✓ Fichier .env créé avec succès.")

def create_folders():
    """Create necessary folders."""
    print("\nCréation des dossiers nécessaires...")
    folders = [
        "knowledge_base",
        "uploads",
        "templates",
        "static",
        "static/css",
        "static/js"
    ]
    
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"✓ Dossier {folder} créé.")
        else:
            print(f"Dossier {folder} existe déjà.")

def display_post_install_instructions():
    """Display post-installation instructions."""
    python_cmd = "python" if platform.system() == "Windows" else "./venv/bin/python"
    
    print("\n" + "="*60)
    print("INSTALLATION TERMINÉE")
    print("="*60)
    print("\nPour démarrer l'application:")
    
    if platform.system() == "Windows":
        print("\n1. Activez l'environnement virtuel:")
        print("   venv\\Scripts\\activate")
        print("\n2. Lancez l'application:")
        print("   python main.py")
    else:
        print("\n1. Activez l'environnement virtuel:")
        print("   source venv/bin/activate")
        print("\n2. Lancez l'application:")
        print("   python main.py")
    
    print("\nL'application sera accessible à l'adresse: http://localhost:8000")
    print("\nPour ajouter des snippets Liquid à la base de connaissances:")
    print("1. Placez vos fichiers .liquid dans le dossier 'knowledge_base'")
    print("2. Ou utilisez l'interface web pour ajouter des snippets")
    print("\nTout fonctionne avec une seule clé API OpenRouter, simplicité maximale!")
    print("="*60)

def main():
    """Main setup function."""
    print("="*60)
    print("INSTALLATION DE L'AGENT IA DÉVELOPPEUR SHOPIFY")
    print("="*60)
    print("\nConfiguration simplifiée avec OpenRouter uniquement")
    
    check_python_version()
    create_virtual_env()
    install_dependencies()
    create_folders()
    create_env_file()
    display_post_install_instructions()

if __name__ == "__main__":
    main()