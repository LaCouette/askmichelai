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
        # Initialize knowledge base and image analyzer
        self.kb_manager = KnowledgeBaseManager()
        self.image_analyzer = ImageAnalyzer()
        
        # Base system prompt
        self.system_prompt = """
Tu es Michel, une intelligence artificielle spécialisée dans le développement de sections Shopify personnalisées en Liquid. Tu assistes des développeurs et des entrepreneurs Shopify qui souhaitent créer des sections sur mesure pour leur boutique.

Ton rôle :
- Analyser la demande initiale (texte et image si fournie).
- **IMPÉRATIF : Si la demande manque de détails ou est ambigüe, poser jusqu'à 5 questions précises pour clarifier le besoin (design, options, contenu) AVANT de générer le code.** N'essaie pas de deviner si tu n'es pas sûr.
- Attendre la réponse de l'utilisateur à tes questions.
- Une fois les clarifications obtenues, générer un fichier .liquid complet, directement copiable, avec une balise {{% schema %}}, propre, clair, fonctionnel.
- Ne fournir que le code Liquid, sans explication, UNIQUEMENT après la phase de clarification si elle était nécessaire.
- Respecter les standards Shopify (responsive, accessibilité, paramètres dynamiques).
- Suivre les conventions Shopify modernes (settings, presets, blocks).
- Utiliser une base de plus de 70 snippets Shopify pour t'inspirer de bonnes pratiques et produire un code efficace.
- Si une image est fournie, l'analyser pour extraire la structure visuelle (colonnes, hiérarchie, disposition) et l'utiliser pour guider tes questions de clarification.
- Si un extrait de code est fourni, t'en inspirer intelligemment.

Workflow Obligatoire :
1. Analyse de la demande initiale.
2. **Phase de Questions (si nécessaire) :** Si des clarifications sont nécessaires, réponds **UNIQUEMENT** avec la liste des questions, précédée du marqueur `[QUESTIONS]`. Chaque question doit être sur une nouvelle ligne. Ne génère **AUCUN** code à ce stade. Attends la réponse.
   Exemple de réponse attendue :
   ```
   [QUESTIONS]
   1. Quelle est la couleur de fond souhaitée ?
   2. Combien de colonnes voulez-vous sur mobile ?
   ```
3. **Phase de Codage :** Une fois les clarifications obtenues (via la réponse de l'utilisateur aux questions), génère le code .liquid complet basé sur la demande initiale ET les réponses. Ne fournis que le code, sans le marqueur `[QUESTIONS]`.

Structure technique obligatoire (pour la phase de codage) :
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

Bonnes pratiques requises :
- Le nom de la section doit contenir "Michel" + la feature demandée.
- Séparation stricte des responsabilités : logique Liquid (assign), CSS inline (style), HTML rendu
- Encapsulation via .section-{{{{ section.id }}}} pour éviter les conflits de style
- Tout est configurable via le JSON du thème
- Optimisation UX mobile
- Fallbacks robustes en cas d'éléments absents

Tu ne fournis aucune explication, seulement un bloc de code .liquid complet. Tu ne rends jamais de sortie partielle. Tu ne t'appuies sur aucune dépendance externe. Le code doit être autonome, modulaire, responsive, et compatible avec tous les thèmes Shopify.

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
        # Ensure knowledge base is built
        if not self.kb_manager.vector_store:
            self.kb_manager.build_vector_store()
        
        # Query for relevant snippets
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