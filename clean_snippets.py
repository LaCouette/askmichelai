import os
import sys

def convert_file_to_utf8(file_path):
    """Tente de convertir un fichier en UTF-8."""
    try:
        # Essaie de lire avec différents encodages
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        content = None
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"Fichier {os.path.basename(file_path)} lu avec succès en {encoding}")
                break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print(f"Impossible de lire {os.path.basename(file_path)} avec les encodages standard")
            return False
        
        # Écrit en UTF-8
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ {os.path.basename(file_path)} converti en UTF-8")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la conversion de {os.path.basename(file_path)}: {e}")
        return False

def clean_knowledge_base(base_dir="knowledge_base"):
    """Nettoie tous les fichiers dans la base de connaissances."""
    if not os.path.exists(base_dir):
        print(f"Le dossier {base_dir} n'existe pas!")
        return
    
    print(f"Nettoyage des fichiers dans {base_dir}...")
    
    # Compte les statistiques
    total_files = 0
    success_count = 0
    error_count = 0
    
    # Parcourt tous les fichiers
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.liquid'):
                total_files += 1
                file_path = os.path.join(root, file)
                if convert_file_to_utf8(file_path):
                    success_count += 1
                else:
                    error_count += 1
    
    print("\n" + "="*50)
    print(f"Nettoyage terminé!")
    print(f"Total de fichiers traités: {total_files}")
    print(f"Fichiers convertis avec succès: {success_count}")
    print(f"Fichiers problématiques: {error_count}")
    print("="*50)

if __name__ == "__main__":
    # Utilise le dossier knowledge_base ou un dossier spécifié en argument
    base_dir = "knowledge_base"
    if len(sys.argv) > 1:
        base_dir = sys.argv[1]
    
    clean_knowledge_base(base_dir)