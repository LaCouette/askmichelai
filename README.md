# AskMichel.ai - Créateur de sections Shopify

AskMichel.ai est une application web innovante qui permet aux marchands Shopify de créer des sections personnalisées pour leurs boutiques sans écrire une seule ligne de code. En utilisant l'intelligence artificielle, l'application traduit les demandes en langage naturel en code Liquid optimisé et prêt à l'emploi.

## 🎯 Objectifs du Projet

- Permettre aux marchands Shopify de créer des sections personnalisées sans compétences techniques
- Réduire les coûts de développement pour les petites et moyennes entreprises
- Accélérer le processus de personnalisation des boutiques Shopify
- Fournir des sections optimisées pour la conversion et le SEO

## 🛠 Stack Technique Complète

### Frontend
- **HTML5 sémantique** avec balisage accessible et SEO-friendly
- **CSS3** avec système complet de variables personnalisées et design system
  - Support natif des thèmes sombres via `prefers-color-scheme`
  - Animations et transitions fluides avec `requestAnimationFrame` et CSS transitions
  - Architecture BEM (Block-Element-Modifier) pour l'organisation des classes CSS
- **JavaScript ES6+** (Vanilla)
  - Gestion d'état sans framework via patterns Observer/PubSub
  - Fetch API pour les requêtes AJAX
  - Web Storage API pour la persistance locale
  - Modules ES natifs
- **Polices Web**
  - Satoshi et General Sans via Fontshare
  - Inter via Google Fonts
  - Optimisation avec `font-display: swap` et préchargement
- **Coloration syntaxique**
  - Highlight.js pour la mise en forme du code Liquid généré
  - Thèmes personnalisés pour le mode clair et sombre

### Backend (Python)
- **FastAPI** - Framework web moderne et performant
  - Routing asynchrone
  - Validation automatique des données via Pydantic
  - Documentation OpenAPI automatisée
  - Middleware CORS configuré
- **Uvicorn** - Serveur ASGI haute performance
- **LangChain** - Framework pour applications IA
  - Gestion des chaînes de prompts
  - Interface avec les modèles de langage
  - Gestion des sessions de chat
- **FAISS** - Système d'indexation vectorielle pour la recherche sémantique
- **HuggingFace Embeddings** - Embeddings de texte via le modèle all-MiniLM-L6-v2
- **Jinja2** - Moteur de templates pour générer les vues HTML

### IA et Machine Learning
- **Anthropic Claude 3.7 Sonnet** - Modèle de langage avancé via OpenRouter
  - Génération de code Liquid optimisé
  - Analyse des besoins utilisateur
  - Questions de clarification intelligentes
- **Système de RAG (Retrieval-Augmented Generation)**
  - Base de connaissances vectorisée de plus de 70 snippets Liquid
  - Recherche sémantique pour enrichir les prompts avec des exemples pertinents
- **Vision par ordinateur**
  - Analyse d'images pour comprendre la structure visuelle des sections
  - Extraction des éléments UI/UX pour guider la génération

### Design System
- Système complet de couleurs avec variables CSS
  - Palette primaire, secondaire et d'accentuation
  - Nuances sémantiques (succès, erreur, avertissement, info)
  - Adaptation automatique au thème clair/sombre
- Typographie hiérarchisée
  - Échelle typographique cohérente (1.25 ratio)
  - Variables pour les tailles, poids et hauteurs de ligne
- Espacements standardisés via système de tokens
- Composants UI réutilisables et accessibles
- Design responsive avec breakpoints définis
- Animations et transitions cohérentes

### Intégration
- **API REST** pour la communication client-serveur
  - Endpoints `/api/chat` et `/api/reset`
  - Format JSON pour les échanges de données 
  - Validation des entrées et gestion des erreurs
- **Gestion des sessions**
  - Identification via UUID côté client
  - Maintien d'état de conversation par session
  - Persistance entre les navigations
- **Upload et analyse d'images**
  - Support multi-format (JPEG, PNG, WebP)
  - Redimensionnement et optimisation automatiques
  - Analyse par IA pour l'extraction de structure visuelle
- **Système de cache**
  - Mise en cache des résultats de recherche vectorielle
  - Chargement différé des ressources non-critiques

## 🏗 Architecture du Projet

### Architecture Logicielle
- **Architecture MVC modifiée**
  - Modèle : Agent IA, gestionnaire de base de connaissances
  - Vue : Templates Jinja2, HTML/CSS/JS
  - Contrôleur : Routes FastAPI, logique métier
- **Architecture orientée services**
  - Service d'IA (ShopifyAgent)
  - Service de gestion des connaissances (KnowledgeBaseManager)
  - Service d'analyse d'images (ImageAnalyzer)
- **Pipeline de traitement**
  1. Réception des requêtes utilisateur (texte + image optionnelle)
  2. Analyse et enrichissement des prompts
  3. Génération de questions ou code selon le contexte
  4. Livraison des résultats formatés

### Structure des Fichiers
```
├── static/                  # Ressources statiques
│   ├── css/                 # Styles CSS
│   │   ├── main.css         # Styles principaux
│   │   └── dark-theme.css   # Styles du thème sombre
│   ├── js/                  # Scripts JavaScript
│   │   ├── main.js          # Logique principale
│   │   ├── chat.js          # Gestion du chat
│   │   └── ui.js            # Composants UI
│   └── img/                 # Images et icônes
│       ├── s1.jpeg          # Exemples de sections
│       ├── s2.png
│       ├── s3.png
│       └── s4.png
├── templates/               # Templates HTML
│   ├── index.html           # Page d'accueil
│   └── analysis.html        # Page d'analyse
├── app.py                   # Point d'entrée FastAPI
├── agent.py                 # Agent IA Shopify
├── knowledge_base_manager.py # Gestionnaire de la base de connaissances
├── image_analyzer.py        # Analyseur d'images
├── setup.py                 # Script d'installation
├── main.py                  # Lanceur d'application
├── clean_snippets.py        # Utilitaire de nettoyage des snippets
├── knowledge_base/          # Base de snippets Liquid
│   ├── snippet_1.liquid     # Exemples de sections
│   ├── snippet_2.liquid
│   └── ...
├── uploads/                 # Dossier pour les images téléchargées
├── venv/                    # Environnement virtuel Python
└── README.md                # Documentation
```

### Flux de Données
1. **Soumission de la requête**
   - L'utilisateur soumet une description et/ou une image
   - Génération d'un UUID pour la session si nouveau
   - Frontend valide et prépare les données

2. **Traitement par le backend**
   - Route `/api/chat` reçoit la requête
   - L'image est analysée si présente (ImageAnalyzer)
   - La base de connaissances est interrogée (KnowledgeBaseManager)
   - Le prompt est enrichi avec les snippets pertinents et l'analyse d'image

3. **Génération IA**
   - L'agent (ShopifyAgent) traite la requête enrichie
   - Selon le contexte, l'IA génère:
     - Des questions de clarification (marquées `[QUESTIONS]`)
     - Ou du code Liquid complet

4. **Réponse au client**
   - Le résultat est formaté en JSON avec type ("questions" ou "code")
   - Frontend affiche les questions ou le code avec coloration syntaxique
   - En cas de questions, les réponses sont collectées pour la prochaine itération

### Composants Principaux

#### 1. ShopifyAgent (agent.py)
- Gère l'interaction avec le modèle Claude 3.7
- Maintient l'historique de conversation par session
- Enrichit les prompts avec les snippets et analyses d'images
- Applique des techniques d'échappement pour le code Liquid

#### 2. KnowledgeBaseManager (knowledge_base_manager.py)
- Construit et maintient un index vectoriel FAISS
- Indexe plus de 70 snippets Liquid pour référence
- Fournit une recherche sémantique pour trouver les exemples pertinents
- Gère le chargement et la conversion des fichiers

#### 3. ImageAnalyzer (image_analyzer.py)
- Analyse les images uploadées via Claude Vision
- Extrait la structure visuelle, la mise en page et les composants UI
- Redimensionne et optimise les images pour l'API
- Format les résultats pour enrichir les prompts

#### 4. Interface FastAPI (app.py)
- Définit les routes et endpoints API
- Gère le routage des templates HTML
- Coordonne les différents services
- Gère les sessions via un dictionnaire en mémoire

## 🎨 Interface Utilisateur

### Page d'Accueil
- Hero section avec proposition de valeur claire
- Formulaire de prompt avec support d'upload d'images
- Section de preuve sociale
- Démonstration vidéo
- Grille de fonctionnalités
- Exemples de sections prêtes à l'emploi
- Tarification transparente

### Système d'Analyse
- Interface de chat IA moderne
- Analyse en temps réel avec animations
- Système de questions/réponses interactif
- Génération de code avec coloration syntaxique Highlight.js
- Prévisualisation des sections générées

### Fonctionnalités UI/UX Avancées
- Persistence de session via localStorage
- Animations d'état de chargement
- Transitions fluides entre les étapes
- Gestion des erreurs avec feedback visuel
- Mode sombre/clair automatique et manuel
- Design responsive pour tous les appareils

## 💡 Processus de Génération de Code

### Génération de Code Liquid
1. **Analyse du prompt**
   - Compréhension sémantique de la demande
   - Extraction des besoins fonctionnels et esthétiques

2. **Clarification (si nécessaire)**
   - Génération de questions précises (max 5)
   - Collecte des réponses pour affiner la compréhension

3. **Recherche de snippets pertinents**
   - Requête vectorielle sur la base de connaissances
   - Sélection des 3 meilleurs exemples correspondants

4. **Génération adaptative**
   - Production de code Liquid complet avec:
     - Logique conditionnelle
     - Boucles et assignations
     - CSS scopé au section.id
     - Schema JSON pour l'éditeur de thème
     - Support responsive mobile/desktop

5. **Validation du code**
   - Vérification structurelle
   - Échappement des caractères spéciaux
   - Format optimal pour copier-coller direct

### Structure du Code Généré
- Balise `{% section %}` principale
- CSS intégré via balise `{% style %}`
- Schéma JSON complet dans `{% schema %}`
- Support de blocs dynamiques
- Paramètres personnalisables (couleurs, textes, images)
- Design responsive avec media queries

## 🔄 Workflow Utilisateur Détaillé

1. **Saisie de la Demande**
   - Description en langage naturel (ex: "Une section hero avec image et texte superposé")
   - Upload optionnel d'images de référence
   - Possibilité de sélectionner des templates existants comme point de départ

2. **Phase de Questions (si nécessaire)**
   - L'IA analyse la demande et identifie les zones d'ambiguïté
   - Génération de questions ciblées (max 5) 
   - Interface pour répondre aux questions
   - Les réponses enrichissent le contexte pour la génération

3. **Génération et Prévisualisation**
   - Production du code Liquid complet
   - Affichage avec coloration syntaxique
   - Bouton de copie en un clic
   - Instructions d'intégration dans Shopify

4. **Itération et Raffinement**
   - Possibilité de modifier la demande
   - Historique de conversation maintenu
   - Option de réinitialisation complète

## 🔒 Sécurité

- Génération de UUID pour chaque session utilisateur
- Validation et sanitization des inputs utilisateur
- Vérification des uploads d'images (taille, type, contenu)
- Protection contre les injections XSS
- Permissions restrictives sur les dossiers d'uploads
- Échappement du code Liquid généré
- Gestion sécurisée des tokens d'API via variables d'environnement

## 📈 Monitoring et Analytics

- Suivi des conversions et engagement utilisateur
- Analyse des prompts populaires pour amélioration continue
- Mesure des temps de génération et performance
- Tracking des erreurs et exceptions
- Collecte de feedback utilisateur pour amélioration
- Métriques de satisfaction et NPS

## 🚀 Roadmap

### Phase 1 (Actuelle)
- ✅ Interface utilisateur complète
- ✅ Système de génération de code Liquid
- ✅ Support des images de référence
- ✅ Base de connaissances vectorisée
- ✅ Tarification et modèle d'abonnement

### Phase 2 (Prochainement)
- 📝 Bibliothèque de templates étendue (50+ sections)
- 📝 API publique pour intégration tierce
- 📝 Intégration directe avec Shopify App Store
- 📝 Support multilingue étendu (EN, ES, DE)
- 📝 Mode collaboration pour équipes

### Phase 3 (Futur)
- 🎯 Éditeur visuel WYSIWYG pour affiner les sections
- 🎯 Marketplace communautaire de sections
- 🎯 Analytics avancés d'utilisation des sections
- 🎯 Intégration avec d'autres plateformes e-commerce
- 🎯 Génération de thèmes complets

## 💰 Tarification

### Plan Freemium (gratuit à vie)
- 5 générations de sections par mois
- 1 image de référence par génération
- Base de connaissances standard

### Plan Starter (9€/mois)
- 20 générations de sections par mois
- 3 images de référence par génération
- Base de connaissances étendue
- Prévisualisation des sections
- Support par email

### Plan Pro (19€/mois)
- Générations illimitées
- Images illimitées par génération
- Base de connaissances premium
- Prévisualisation avancée
- Support prioritaire
- API access

### Offre Lifetime Deal limitée (59€)
- Toutes les fonctionnalités Pro à vie
- Mises à jour incluses
- Quantité limitée à 100 unités

## 📄 Technologie d'IA

### Modèle de Langage
- Anthropic Claude 3.7 Sonnet via OpenRouter
- Spécialisation via prompts système détaillés
- Fine-tuning avec exemples de code Shopify
- Optimisation pour la génération de code Liquid

### Retrieval-Augmented Generation (RAG)
- Vectorisation de snippets Liquid avec FAISS
- Embeddings via HuggingFace all-MiniLM-L6-v2
- Chunking intelligent avec chevauchement de 150 caractères
- Top-3 des snippets pertinents injectés dans les prompts

### Vision par Ordinateur
- Analyse d'images via Claude Vision
- Extraction des structures UI (colonnes, hiérarchie, composants)
- Identification des éléments visuels clés
- Transformation en instructions textuelles

## 📄 Licence

Propriétaire - Tous droits réservés

## 🤝 Contact

Pour toute question ou support :
- Site : [askmichel.ai](https://askmichel.ai)
- Email : support@askmichel.ai
- Démo : [demo.askmichel.ai](https://demo.askmichel.ai)

---

Développé avec ❤️ pour la communauté Shopify