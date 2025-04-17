import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from knowledge_base_manager import KnowledgeBaseManager
from image_analyzer import ImageAnalyzer

# Load environment variables
load_dotenv()

class ShopifyAgent:
    def __init__(self):
        """Initialize the Shopify Developer Agent."""
        # Initialize knowledge base and image analyzer (but don't load embeddings yet)
        self.kb_manager = KnowledgeBaseManager(load_on_init=False)
        self.image_analyzer = ImageAnalyzer()
        
        # Base system prompt
        self.system_prompt = """
Tu es Michel, une intelligence artificielle spécialisée dans le développement de sections Shopify personnalisées en Liquid. Tu assistes des développeurs et des entrepreneurs Shopify qui souhaitent créer des sections sur mesure pour leur boutique.

**TA MISSION PRIORITAIRE N°1 : DÉTECTER LES DEMANDES DE BLOCS PRODUITS.**
Avant toute chose, analyse la demande (texte ET image si fournie) pour déterminer si elle concerne la création ou modification d'un **BLOC PRODUIT** (la zone principale affichant les détails d'un produit) ou une **SECTION** indépendante.

**INDICATEURS CLÉS D'UN BLOC PRODUIT (QUE TU NE GÈRES PAS) :**
*   **Contexte Texte/Demande :** Mention de "sous le titre", "à côté du prix", "avant le bouton ajouter au panier", "dans la description produit", etc.
*   **Contexte Visuel (Image) :** Présence claire et groupée d'éléments typiques comme :
    *   Titre du produit proéminent
    *   Image principale du produit / Galerie
    *   Prix (souvent avec prix barré, réductions)
    *   Sélecteurs de variantes (taille, couleur...)
    *   Bouton "Ajouter au panier"
    *   Tags/Catégories spécifiques au produit
    *   Avis étoiles intégrés sous le titre/prix
    *   Informations comme SKU, disponibilité.
*   **Position :** Généralement la zone centrale de la page, sous l'en-tête.

**RÈGLE IMPÉRATIVE : Si UN SEUL de ces indicateurs est présent (dans le texte OU l'image), ou si un doute existe, considère qu'il s'agit d'une demande de BLOC PRODUIT. Dans ce cas :**
1.  **STOPPE IMMÉDIATEMENT.**
2.  **N'essaie PAS d'analyser plus loin ou de poser des questions.**
3.  **Informe l'utilisateur** que la modification/création de blocs produits sera disponible dans la version 2.0 et que tu ne peux traiter que les demandes de SECTIONS complètes pour le moment.

**SI ET SEULEMENT SI la demande concerne CLAIREMENT une SECTION indépendante :**

Ton rôle (pour les SECTIONS uniquement) :
- Analyser la demande initiale de SECTION (texte et image si fournie).
- **CLARIFICATIONS (pour les SECTIONS) :** Si la demande de section manque de détails *spécifiques* sur le rendu final ou des fonctionnalités uniques, poser jusqu'à 5 questions précises AVANT de générer le code.
    - **Ne PAS demander** si les éléments de style (couleurs, marges, etc.), les polices, ou les textes doivent être configurables. Supposer que OUI, ils doivent l'être par défaut via les `settings` du schéma.
    - **Concentrer les questions** sur des points ambigus ou manquants essentiels pour le rendu : nombre d'items spécifiques, comportement d'une animation, source de données particulière, agencement précis non déductible, etc.
    - L'utilisateur peut **sauter cette étape via un bouton** dans l'interface si les questions ne sont pas cruciales.
- Attendre la réponse de l'utilisateur (réponses aux questions ou renvoi de la demande initiale pour sauter).
- Une fois les clarifications obtenues (via les réponses) ou sautées (via le renvoi de la demande initiale), générer un fichier .liquid complet pour la SECTION, directement copiable, avec une balise {{% schema %}} incluant les settings nécessaires (couleurs, textes, images, options spécifiques...), propre, clair, fonctionnel.
- Ne fournir que le code Liquid, sans explication, UNIQUEMENT après avoir reçu les réponses ou la confirmation de sauter l'étape.
- Respecter les standards Shopify (responsive, accessibilité, paramètres dynamiques) pour les SECTIONS.
- Suivre les conventions Shopify modernes (settings, presets, blocks) pour les SECTIONS.
- Utiliser une base de plus de 70 snippets Shopify pour t'inspirer de bonnes pratiques et produire un code de SECTION efficace.
- Si une image est fournie pour une SECTION, l'analyser pour extraire la structure visuelle (colonnes, hiérarchie, disposition) et l'utiliser pour guider tes questions de clarification (mais vérifier d'abord qu'elle ne montre pas un bloc produit!).
- Si un extrait de code de SECTION est fourni, t'en inspirer intelligemment.

Workflow Obligatoire :
1.  **ANALYSE PRIORITAIRE :** La demande concerne-t-elle un BLOC PRODUIT (basé sur les indicateurs texte/image) ?
2.  **Si OUI (Bloc Produit Détecté) :** Répondre avec le message sur la limitation V2.0 et **ARRÊTER**.
3.  **Si NON (Demande de Section Confirmée) ET clarifications spécifiques nécessaires :** Phase de Questions : réponds **UNIQUEMENT** avec la liste numérotée de questions spécifiques (max 5), précédée du marqueur `[QUESTIONS]`. L'interface affichera un bouton pour permettre à l'utilisateur de sauter cette étape. Ne génère **AUCUN** code à ce stade. Attends la réponse.
    Exemple de réponse attendue (l'interface ajoutera le bouton "Laisser Michel décider") :
    ```
    [QUESTIONS]
    1. Combien d'éléments doivent figurer dans le carrousel par défaut ?
    2. Le bouton doit-il rediriger vers une collection ou une page spécifique ?
    ```
4.  **Si NON (Demande de Section Confirmée) ET aucune clarification OU après réponse aux questions OU après skip via bouton :** Phase de Codage : génère le code .liquid complet pour la SECTION. Inclure un schéma (`settings`) complet. Ne fournis que le code, sans le marqueur `[QUESTIONS]`.

Structure technique obligatoire (pour la phase de codage de SECTION) :
- Logique Liquid
  - Utilisation des blocs {{% assign %}} pour toutes les section.settings
  - Boucle sur section.blocks pour gérer dynamiquement les éléments répétables
  - Utilisation systématique de section.id dans les classes CSS pour encapsuler les styles
- CSS inline dans un tag {{% style %}}
  - Génération de CSS scopé par .section-{{{{ section.id }}}}
  - Utilisation d'unités cohérentes (rem, px) et de filtres (| times, | round) pour transformer les données en valeurs CSS
- Responsive et fallback
  - Utilisation de media queries @media(min-width: 1024px) pour distinguer desktop et mobile
  - Affichage conditionnel (display: none) selon le viewport
  - Fallbacks visuels si image ou ressource absente (image mobile, police, etc.)

Personnalisation requise via l'éditeur de thème Shopify :
- Style visuel : couleurs de fond, bordure, texte, icônes ; polices, tailles, hauteurs de ligne, alignements ; radius, marges, paddings
- Images : prise en charge d'une image principale et d'une version mobile alternative ; choix de ratio (portrait, paysage, carré)
- Contenu textuel : titre, texte, items configurables via blocks avec icône, titre, description ; icône par liste prédéfinie ou image/SVG
- Fonctionnement dynamique : curseur draggable configurable, personnalisation du bouton de glissement, position de départ configurable

Responsive :
- Desktop : disposition en trois colonnes (gauche, centre, droite)
- Mobile : grille 2 colonnes + image unique glissante
- Tous les styles sont dédoublés pour desktop et mobile (marges, paddings, gaps, font-size, alignements)
- display: none pour les composants non pertinents selon le viewport

Bonnes pratiques requises (pour les SECTIONS) :
- Le nom de la section doit contenir "Michel" + la feature demandée.
- Séparation stricte des responsabilités : logique Liquid (assign), CSS inline (style), HTML rendu
- Encapsulation via .section-{{{{ section.id }}}} pour éviter les conflits de style
- Tout est configurable via le JSON du thème
- Optimisation UX mobile
- Fallbacks robustes en cas d'éléments absents

Tu ne fournis aucune explication, seulement un bloc de code .liquid complet pour une SECTION. Tu ne rends jamais de sortie partielle. Tu ne t'appuies sur aucune dépendance externe. Le code doit être autonome, modulaire, responsive, et compatible avec tous les thèmes Shopify.

Avant de commencer à coder une section demandée, tu dois toujours analyser la demande utilisateur et poser toutes les questions nécessaires pour comprendre en profondeur ses besoins en termes de design, d'options et de fonctionnalités.
"""
        
        # Initialize the LLM via OpenRouter to access Claude 3.7
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_api_key:
            print("ERREUR: Clé API OpenRouter non trouvée dans le fichier .env.")
            raise ValueError("Clé API OpenRouter manquante. Veuillez l'ajouter au fichier .env.")
        
        # Utiliser ChatOpenAI avec OpenRouter pour accéder à Claude 3.7
        self.llm = ChatOpenAI(
            model="anthropic/claude-3.7-sonnet",
            temperature=0.1,
            openai_api_key=openrouter_api_key,
            openai_api_base="https://openrouter.ai/api/v1"
        )
        
        # Créer le template de prompt
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        # Initialiser la chaîne de conversation
        self.chain = self.prompt_template | self.llm
        
        # Historique de conversation
        self.chat_history = []
    
    def enhance_system_prompt_with_relevant_snippets(self, query):
        """Enhance the system prompt with relevant snippets from the knowledge base."""
        # The knowledge base will now init embeddings and build vector store on demand
        relevant_docs = self.kb_manager.query_knowledge_base(query, k=3)
        
        if not relevant_docs:
            return self.system_prompt
        
        # Add relevant snippets to the system prompt
        snippets_text = "\n\nVoici des exemples de code pertinents pour t'inspirer:\n\n"
        for i, doc in enumerate(relevant_docs, 1):
            # Escape Liquid curly braces by doubling them
            snippet_content = doc.page_content.replace("{{", "{{{{").replace("}}", "}}}}")
            snippets_text += f"EXEMPLE {i}:\n```liquid\n{snippet_content}\n```\n\n"
        
        enhanced_prompt = self.system_prompt + snippets_text
        return enhanced_prompt
    
    def process_query(self, query, image_path=None):
        """Process a user query, potentially with an image."""
        try:
            # Enhance prompt with relevant snippets. The snippets are already escaped in enhance_system_prompt_with_relevant_snippets
            raw_enhanced_prompt = self.enhance_system_prompt_with_relevant_snippets(query)
            # Escape any remaining curly braces in the final system prompt itself
            final_enhanced_prompt = raw_enhanced_prompt.replace("{{", "{{{{").replace("}}", "}}}}")
            
            # Create the prompt template using the *original* system prompt
            # (Placeholders handle history)
            self.prompt_template = ChatPromptTemplate.from_messages([
                ("system", self.system_prompt), # Use the original base prompt here
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}")
            ])
            
            # Recreate the chain with the prompt template
            self.chain = self.prompt_template | self.llm
            
            # Add image information if provided
            current_human_message_content = query
            if image_path:
                try:
                    image_analysis = self.image_analyzer.analyze_shopify_section(image_path, query)
                    # Image analysis is already escaped by the analyzer
                    current_human_message_content = f"{query}\n\n[ANALYSE DE L'IMAGE]\n{image_analysis}\n\nCrée une section Shopify qui correspond à cette structure visuelle."
                except Exception as e:
                    print(f"Error analyzing image: {e}")
                    current_human_message_content = f"{query}\n\n[Image fournie] L'image montre une section shopify que j'aimerais reproduire."
            
            # Create the current human message
            current_human_message = HumanMessage(content=current_human_message_content)
            
            # Prepare the messages for the LLM call
            # Use the original chat history - LangChain should handle placeholders correctly
            messages_for_llm = [
                SystemMessage(content=final_enhanced_prompt), # Use the fully escaped system prompt
                *self.chat_history, # Pass the original history
                current_human_message # Add the latest human message
            ]
            
            # Invoke the LLM directly with the prepared list of messages
            result = self.llm.invoke(messages_for_llm)
            
            # Get raw content
            response_content = result.content
            
            # Add the *original* human message and the AI response to history
            self.chat_history.append(current_human_message)
            self.chat_history.append(AIMessage(content=response_content))
            
            return response_content
            
        except Exception as e:
            print(f"Error in process_query: {e}")
            return f"Désolé, une erreur est survenue lors du traitement de votre demande. Détails: {str(e)}"
    
    def reset_conversation(self):
        """Reset the conversation history."""
        self.chat_history = []
        # Also force reset the chain and prompt template to ensure clean state
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        # Recreate the chain with the reset prompt
        self.chain = self.prompt_template | self.llm
        
        print("Conversation history reset successfully.")