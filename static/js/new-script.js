document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const promptForm = document.getElementById('promptForm');
    const userPrompt = document.getElementById('userPrompt');
    const imageUpload = document.getElementById('imageUpload');
    const uploadPreview = document.getElementById('uploadPreview');
    const landingPage = document.querySelector('.landing-page');
    const analysisPage = document.querySelector('.analysis-page');
    
    // Session ID
    let sessionId = generateUUID();

    // Selected image file
    let selectedImage = null;
    
    // Event listeners
    promptForm.addEventListener('submit', handleSubmit);
    imageUpload.addEventListener('change', handleImageUpload);
    userPrompt.addEventListener('paste', handlePaste);
    
    // Handle file upload and preview
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        processAndDisplayImage(file);
    }

    // Handle paste event on the prompt textarea
    function handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                event.preventDefault();
                const file = item.getAsFile();
                processAndDisplayImage(file);
                showToast('Image collée', 'Image ajoutée depuis le presse-papiers.', 'info');
                break; // Handle only the first image found
            }
        }
    }

    // Shared function to process and display image preview
    function processAndDisplayImage(file) {
        selectedImage = file;
        uploadPreview.innerHTML = ''; // Clear previous preview
        
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-image';
        
        // Create image preview
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        previewContainer.appendChild(img);
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            uploadPreview.innerHTML = '';
            imageUpload.value = ''; // Clear file input if needed
            selectedImage = null;
        });
        
        previewContainer.appendChild(removeBtn);
        uploadPreview.appendChild(previewContainer);

        // Update the hidden file input's files list (optional, good practice)
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageUpload.files = dataTransfer.files;
    }
    
    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        
        const message = userPrompt.value.trim();
        if (!message && !selectedImage) return;
        
        // Show analysis page and hide landing page
        landingPage.style.display = 'none';
        analysisPage.style.display = 'block';
        
        // Initialize analysis page content
        initAnalysisPage(message, selectedImage ? URL.createObjectURL(selectedImage) : null);
        
        // Prepare form data
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('message', message);
        
        if (selectedImage) {
            formData.append('image', selectedImage);
        }
        
        // Save a reference to the selected image for display
        const currentImage = selectedImage;
        
        // Clear input for next time
        selectedImage = null;
        
        // Start the analysis animation and process the request
        await runAnalysisWithAnimation(formData, currentImage);
    }
    
    // Initialize analysis page with back button, title and steps container
    function initAnalysisPage(prompt, imageUrl) {
        analysisPage.innerHTML = `
            <button class="back-button" id="backBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Retour
            </button>
            
            <h1 class="analysis-title">Michel analyse votre demande</h1>
            
            <div class="prompt-summary">
                <div class="user-message">
                    <strong>Votre demande :</strong> ${prompt}
                    ${imageUrl ? `<div class="prompt-image"><img src="${imageUrl}" alt="Image fournie"></div>` : ''}
                </div>
            </div>
            
            <div class="analysis-steps" id="analysisSteps">
                <!-- Steps will be added here dynamically -->
            </div>
            
            <div id="questionsContainer">
                <!-- Questions will be added here dynamically -->
            </div>
            
            <div id="resultContainer">
                <!-- Final code will be added here -->
            </div>
        `;
        
        // Add back button event listener
        document.getElementById('backBtn').addEventListener('click', () => {
            analysisPage.style.display = 'none';
            landingPage.style.display = 'flex';
            
            // Generate a new session ID for a fresh conversation
            sessionId = generateUUID();
        });
    }
    
    // Run analysis with animated steps
    async function runAnalysisWithAnimation(formData, imageObj) {
        const stepsContainer = document.getElementById('analysisSteps');
        const questionsContainer = document.getElementById('questionsContainer');
        const resultContainer = document.getElementById('resultContainer');
        
        // Extract the user message for analysis
        const userMessage = formData.get('message');
        const hasImage = imageObj != null;
        
        // Generate dynamic steps based on the prompt content
        const steps = generateDynamicSteps(userMessage, hasImage);
        
        // Initialize the container for the single step display
        stepsContainer.innerHTML = '<div id="currentStepDisplay" class="step"></div>';
        const currentStepDisplay = document.getElementById('currentStepDisplay');
        
        // Display each step one by one
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Add fade-out effect if not the first step
            if (i > 0) {
                currentStepDisplay.classList.add('fade-out');
                await delay(300); // Wait for fade-out animation
            }
            
            // Update content for the current step
            currentStepDisplay.innerHTML = `
                <div class="step-header">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-title">${step.title}</div>
                </div>
                <div class="step-content">
                    ${step.content}
                </div>
                ${i === steps.length - 1 ? `
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>` : ''}
            `;
            
            // Apply fade-in effect
            currentStepDisplay.classList.remove('fade-out'); // Remove fade-out before adding fade-in
            currentStepDisplay.classList.add('visible', 'fade-in');
            
            // Delay before showing the next step or making the API call
            if (i < steps.length - 1) {
                 await delay(4300); // Increased delay: 300ms fade-out + 4000ms visible time
            } else {
                 await delay(800); // Short delay after last step before API call
            }
            // Remove fade-in class after animation is likely complete to allow fade-out later
             currentStepDisplay.classList.remove('fade-in');
        }
        
        // Now make the actual API call
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Fade out the last step (with loading dots)
            currentStepDisplay.classList.add('fade-out');
            await delay(300);
            
            // Add final "completed" step
            currentStepDisplay.innerHTML = `
                <div class="step-header">
                    <div class="step-number">✓</div>
                    <div class="step-title">Analyse terminée</div>
                </div>
                <div class="step-content">
                    J'ai analysé votre demande. Incroyable, non ? Maintenant passons aux choses sérieuses avant que je ne commence à me demander pourquoi j'ai choisi cette carrière.
                </div>
            `;
            // Fade in the completed step
            currentStepDisplay.classList.remove('fade-out');
            currentStepDisplay.classList.add('visible', 'fade-in');
            await delay(300); // Wait for fade-in
            currentStepDisplay.classList.remove('fade-in'); // Clean up animation class
            
            // Handle the response based on its type
            if (data.type === 'questions') {
                // Show questions
                await delay(800);
                displayQuestionsForm(data.content, questionsContainer);
            } else if (data.type === 'code') {
                // Show final code
                await delay(800);
                displayFinalCode(data.content, resultContainer);
            } else {
                // Show error
                console.error('Unexpected response type:', data.type);
                questionsContainer.innerHTML = `
                    <div class="error-message">
                        Une erreur inattendue s'est produite. Veuillez réessayer.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            questionsContainer.innerHTML = `
                <div class="error-message">
                    Une erreur s'est produite: ${error.message}
                </div>
            `;
        }
    }
    
    // Function to generate dynamic chain of thought steps based on the prompt
    function generateDynamicSteps(prompt, hasImage) {
        // Convert prompt to lowercase for easier checking
        const promptLower = prompt.toLowerCase();
        
        // Default steps that will be customized
        let steps = [];
        
        // Extract keywords and details from the prompt
        const keywords = extractKeywords(promptLower);
        
        // Step 1: Initial analysis - Always present but highly customized
        if (hasImage) {
            steps.push({
                title: "Décryptage visuel",
                content: generateImageAnalysisText(promptLower, keywords)
            });
        } else {
            steps.push({
                title: "Analyse initiale",
                content: generateInitialAnalysisText(promptLower, keywords)
            });
        }
        
        // Step 2: Section identification - Personalized based on prompt content
        steps.push({
            title: "Identification du type de section",
            content: generateSectionIdentificationText(promptLower, keywords)
        });
        
        // Step 3: Technical planning - Customized based on complexity and features
        steps.push({
            title: "Planification technique",
            content: generateTechnicalPlanningText(prompt, keywords)
        });
        
        // Step 4 (was 5): Preparation for output - Final personalized step
        steps.push({
            title: "Préparation du code",
            content: generateFinalStepText(promptLower, keywords)
        });
        
        return steps;
    }
    
    // Helper function to extract keywords from the prompt
    function extractKeywords(promptLower) {
        const keywords = {
            colors: [],
            numbers: [],
            devices: [],
            frameworks: [],
            designElements: [],
            animations: [],
            mainTopic: ""
        };
        
        // Extract color mentions
        const colorWords = ["rouge", "bleu", "vert", "jaune", "noir", "blanc", "orange", "violet", 
                           "gris", "marron", "rose", "turquoise", "cyan", "magenta", "bordeaux"];
        for (const color of colorWords) {
            if (promptLower.includes(color)) {
                keywords.colors.push(color);
            }
        }
        
        // Extract numbers
        const numbers = promptLower.match(/\d+/g);
        if (numbers) {
            keywords.numbers = numbers;
        }
        
        // Check for device mentions
        const deviceWords = ["mobile", "téléphone", "smartphone", "tablette", "desktop", "ordinateur", 
                           "écran", "iphone", "android", "responsive"];
        for (const device of deviceWords) {
            if (promptLower.includes(device)) {
                keywords.devices.push(device);
            }
        }
        
        // Check for framework/library mentions
        const frameworkWords = ["bootstrap", "tailwind", "jquery", "javascript", "css", "html", 
                              "flexbox", "grid", "liquid", "shopify", "scss", "sass"];
        for (const framework of frameworkWords) {
            if (promptLower.includes(framework)) {
                keywords.frameworks.push(framework);
            }
        }
        
        // Check for design elements
        const designWords = ["bouton", "carte", "image", "video", "carousel", "gallery", "slider", 
                            "menu", "header", "footer", "icône", "shadow", "animation", "transition"];
        for (const element of designWords) {
            if (promptLower.includes(element)) {
                keywords.designElements.push(element);
            }
        }
        
        // Check for animation mentions
        const animationWords = ["animation", "transition", "hover", "scroll", "fade", "slide", "zoom", 
                              "parallax", "glissement", "rotation", "rebond"];
        for (const animation of animationWords) {
            if (promptLower.includes(animation)) {
                keywords.animations.push(animation);
            }
        }
        
        // Determine main topic for section
        if (promptLower.includes("hero") || promptLower.includes("bannière") || promptLower.includes("banner")) {
            keywords.mainTopic = "bannière";
        } else if (promptLower.includes("galerie") || promptLower.includes("gallery") || promptLower.includes("photo")) {
            keywords.mainTopic = "galerie";
        } else if (promptLower.includes("timeline") || promptLower.includes("chronologie")) {
            keywords.mainTopic = "timeline";
        } else if (promptLower.includes("testimonial") || promptLower.includes("témoignage") || promptLower.includes("avis")) {
            keywords.mainTopic = "témoignages";
        } else if (promptLower.includes("produit") || promptLower.includes("product")) {
            keywords.mainTopic = "produit";
        } else if (promptLower.includes("contact") || promptLower.includes("formulaire") || promptLower.includes("form")) {
            keywords.mainTopic = "formulaire";
        } else if (promptLower.includes("faq") || promptLower.includes("question") || promptLower.includes("accordéon")) {
            keywords.mainTopic = "faq";
        } else if (promptLower.includes("prix") || promptLower.includes("pricing") || promptLower.includes("tarif")) {
            keywords.mainTopic = "pricing";
        } else if (promptLower.includes("footer") || promptLower.includes("pied")) {
            keywords.mainTopic = "footer";
        } else if (promptLower.includes("header") || promptLower.includes("entête") || promptLower.includes("navigation")) {
            keywords.mainTopic = "header";
        } else {
            // Try to extract noun phrases to guess the topic
            const nouns = promptLower.match(/\b(section|composant|élément|widget|module|block|bloc|partie)\s+([a-zéàèêôûïçù]+)/g);
            if (nouns && nouns.length > 0) {
                keywords.mainTopic = nouns[0].split(" ")[1]; // Take the noun after the section indicator
            } else {
                keywords.mainTopic = "générique"; // Default fallback
            }
        }
        
        return keywords;
    }
    
    // Generate personalized text for image analysis
    function generateImageAnalysisText(prompt, keywords) {
        const prefixes = ["Michel pense : ", "Michel se dit : ", "Interne (Michel) : ", "(Soupir)... "];
        const imageResponses = [
            `Je scrute cette image avec toute l'excitation d'un fonctionnaire un vendredi à 16h55. ${keywords.mainTopic !== "générique" ? `Une ${keywords.mainTopic}, quelle surprise.` : "Encore un design qui va me donner des migraines."} Est-ce vraiment nécessaire d'avoir tant de ${keywords.colors.length ? keywords.colors.join(" et ") : "couleurs"} sur une seule page ?`,
            `Ah, une image. Fascinant. Il veut sûrement que je reproduise exactement ça, mais "en mieux" et "plus moderne", sans aucune indication spécifique. ${keywords.mainTopic !== "générique" ? `Cette ${keywords.mainTopic} ressemble à toutes les ${keywords.mainTopic}s que j'ai vues cette semaine.` : ""}`,
            `D'accord, j'analyse cette œuvre d'art numérique. ${keywords.designElements.length ? `Visiblement, il est fan de ${keywords.designElements.join(", ")}. Original.` : "C'est... une image. Avec des pixels. Impressionnant."} Combien de temps ça va me prendre pour reproduire quelque chose qu'il voudra changer après ?`,
            `Je parcours cette image pixel par pixel... ${keywords.mainTopic !== "générique" ? `Encore une ${keywords.mainTopic} qui se veut révolutionnaire.` : "Qu'est-ce qu'on mange ce soir..."} Étonnamment, les éléments ne se déplacent pas tout seuls pour me montrer comment ça doit fonctionner.`
        ];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + imageResponses[Math.floor(Math.random() * imageResponses.length)];
    }
    
    // Generate personalized text for initial analysis
    function generateInitialAnalysisText(prompt, keywords) {
        const prefixes = ["Michel pense : ", "Michel se dit : ", "Interne (Michel) : ", "Bon... "];
        const initialResponses = [
            `Voyons ce qu'on a là... "${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}" ${keywords.mainTopic !== "générique" ? `Une ${keywords.mainTopic}. Original. Je n'en ai fait que 37 cette semaine.` : "Tellement vague que je pourrais faire un site entier et ce ne serait toujours pas ça."}`,
            `Je lis cette demande avec l'enthousiasme d'un chat devant une piscine. ${keywords.designElements.length ? `Des ${keywords.designElements.join(", ")}. Check.` : "Pas vraiment d'indications concrètes. Parfait."} Encore devoir lire dans les pensées, ma spécialité préférée.`,
            `Analysons cette demande passionnante... ${keywords.mainTopic !== "générique" ? `Une ${keywords.mainTopic}, quelle surprise.` : "Rien de très précis, génial."} ${keywords.colors.length ? `Il aime le ${keywords.colors.join(" et le ")}. Ambiance.` : "Pas de précision sur les couleurs, il faut deviner la palette préférée aussi, j'imagine."}`,
            `Tentative de compréhension de ce texte énigmatique appelé "brief". ${keywords.frameworks.length ? `Il mentionne ${keywords.frameworks.join(", ")}. Au moins il connaît quelques mots techniques, c'est déjà ça.` : "Pas de spécification technique, comme d'habitude."} ${keywords.mainTopic !== "générique" ? `Une section ${keywords.mainTopic}. Révolutionnaire.` : "Va falloir improviser. Super."}`
        ];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + initialResponses[Math.floor(Math.random() * initialResponses.length)];
    }
    
    // Generate personalized text for section identification
    function generateSectionIdentificationText(prompt, keywords) {
        const prefixes = ["Michel pense : ", "Michel marmonne : ", "OK, donc... ", "Identification : "];
        const sectionResponses = {
            "bannière": [
                `Une bannière hero. Titre accrocheur, sous-titre vaguement inspirant, ${keywords.colors.length ? `fond ${keywords.colors[0]}` : "image de fond floue"} et un bouton « Achetez maintenant ». Quelle innovation. Époustouflant.`,
                `Ah, une bannière hero. Brillant. Jamais vu. J'imagine qu'il faut aussi un titre en gras, un slogan inspirant qui ne veut rien dire, et un bouton qui change de couleur au survol. L'originalité incarnée.`
            ],
            "galerie": [
                `Une galerie d'images. Mettre des images côte à côte, un exploit technique en 2024. ${keywords.animations.length ? `Avec des animations au ${keywords.animations.join(" et au ")}.` : "Sans animation, tant mieux."} Faudra la rendre « responsive », comme si c'était optionnel.`,
                `Une galerie. Fascinant. ${keywords.numbers.length ? `Avec ${keywords.numbers[0]} images.` : "Avec un nombre non spécifié d'images, merveilleux."} J'adore ces défis intellectuels qui consistent à aligner des rectangles.`
            ],
            "timeline": [
                `Une timeline ? Vraiment ? Avec des animations au survol et ${keywords.colors.length ? `un dégradé de ${keywords.colors.join(" à ")}` : "un dégradé de couleur"}, je parie. Tellement prévisible. Faire semblant d'être surpris, acte 1.`,
                `Une chronologie. Excitant. ${keywords.animations.length ? `Avec des effets de ${keywords.animations.join(" et de ")}.` : "Sans doute avec des animations au scroll que tout le monde adore."} Comme si je n'en avais pas codé 50 identiques cette année.`
            ],
            "témoignages": [
                `Des témoignages clients. Parce que rien ne vend mieux qu'une citation probablement inventée de 'Jean-Michel, ${keywords.numbers.length ? keywords.numbers[0] : "42"} ans, entrepreneur'. Quelqu'un a déjà vérifié ces trucs ? Peu importe.`,
                `Section témoignages. Classique. ${keywords.designElements.includes("carousel") || keywords.designElements.includes("slider") ? "Avec un carousel, bien sûr." : "Probablement en défilement automatique pour que personne ne puisse les lire en entier."} Rien de tel que des avis 5 étoiles mystérieusement tous écrits avec la même syntaxe.`
            ],
            "produit": [
                `Une section produit${keywords.numbers.length ? ` avec ${keywords.numbers[0]} items` : ""}.  ${keywords.designElements.includes("carousel") || keywords.designElements.includes("slider") ? "Avec un carousel, quelle originalité." : "Probablement une grille basique."} Espérons que les photos produits sont meilleures que ce brief.`,
                `Section produits. Le cœur du business. ${keywords.animations.length ? `Avec des effets de ${keywords.animations.join(" et de ")}, parce que c'est ça qui fait vendre, évidemment.` : "Sans fioritures inutiles, pour une fois."} J'espère juste qu'il y a de vraies descriptions et pas du lorem ipsum.`
            ],
            "formulaire": [
                `Un formulaire de contact. L'apogée de l'innovation web. ${keywords.designElements.length ? `Avec ${keywords.designElements.join(", ")}.` : "Simple et ennuyeux."} Il faudra sûrement une validation en temps réel et un message de confirmation animé, pour rendre l'expérience excitante.`,
                `Un formulaire. Passionnant. ${keywords.colors.length ? `En ${keywords.colors[0]}, bien sûr.` : "Sans indication de style, parfait."} Espérons qu'ils savent quoi faire des données une fois soumises, contrairement à 90% des cas.`
            ],
            "faq": [
                `Une FAQ avec accordéon. Cacher l'info derrière un clic, toujours une excellente idée. ${keywords.animations.length ? `Avec des animations de ${keywords.animations.join(" et de ")}.` : "Avec une animation d'ouverture, je présume."} Au moins, ça change des sliders.`,
                `Section FAQ. Le refuge des infos qu'on n'a pas réussi à caser ailleurs. ${keywords.numbers.length ? `Avec ${keywords.numbers[0]} questions.` : "Avec un nombre indéterminé de questions, super."} Les utilisateurs adoreront jouer au clic-taupe.`
            ],
            "pricing": [
                `Une section tarifs. Laissez-moi deviner : trois colonnes, celle du milieu mise en évidence, et plein de petits check marks verts. ${keywords.colors.length ? `En ${keywords.colors.join(" et ")}. ` : ""} Un classique indémodable.`,
                `Des tableaux de prix. Fascinant. ${keywords.designElements.length ? `Avec ${keywords.designElements.join(" et ")}.` : "Sans doute avec des badges 'populaire' et 'recommandé'."} Mettre en page des listes de fonctionnalités que personne ne lit, ma passion.`
            ],
            "footer": [
                `Un footer. La zone fourre-tout. ${keywords.colors.length ? `En ${keywords.colors[0]} foncé, j'imagine.` : "Probablement sombre."} Rempli de liens que personne ne clique jamais.`,
                `Le footer. Ce cimetière de liens légaux et de colonnes mal alignées. ${keywords.designElements.length ? `Avec ${keywords.designElements.join(", ")}.` : "Simple et fonctionnel, espérons-le."} Peaufiner un truc que personne ne regarde, quel plaisir.`
            ],
            "header": [
                `Un header avec navigation. Logo à gauche, menu au milieu, panier/recherche/compte à droite. ${keywords.designElements.includes("sticky") ? "En sticky, évidemment." : ""} Prévisible.`,
                `Une navigation. Le premier truc vu et le dernier auquel on pense. ${keywords.animations.length ? `Avec des effets de ${keywords.animations.join(" et de ")} au survol.` : "Avec un design probablement générique."} Espérons que le logo est au moins en HD.`
            ],
            "générique": [
                `Tentative d'identification du type de section. Ce n'est pas comme si c'était clairement indiqué. ${keywords.designElements.length ? `Je vois des mentions de ${keywords.designElements.join(", ")}.` : "Pas d'indications claires sur les éléments."} J'adore ces petits jeux de devinettes.`,
                `Analyse en cours... ${keywords.mainTopic !== "générique" ? `Une sorte de ${keywords.mainTopic}, peut-être ?` : "Quelque chose de visuel, j'imagine."} ${keywords.colors.length ? `Avec du ${keywords.colors.join(" et du ")}.` : "Sans indication de couleur, pratique."} Peut-être consulter ma boule de cristal ?`
            ]
        };
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const topicResponses = sectionResponses[keywords.mainTopic] || sectionResponses["générique"];
        return prefix + topicResponses[Math.floor(Math.random() * topicResponses.length)];
    }
    
    // Generate personalized text for technical planning
    function generateTechnicalPlanningText(prompt, keywords) {
        const prefixes = ["Michel analyse : ", "Plan technique : ", "OK, structure... ", "Pensée technique : "];
        // Determine complexity level
        const isComplex = prompt.includes("complex") || prompt.includes("complexe") || 
                         prompt.includes("avancé") || prompt.includes("dynamique") ||
                         keywords.animations.length > 2 || 
                         (keywords.frameworks.length > 0 && keywords.designElements.length > 3);
        
        const technicalResponses = {
            complex: [
                `Ah, il veut quelque chose de « complexe ». Parce que le simple qui fonctionne, c'est trop mainstream. ${keywords.frameworks.length ? `Avec ${keywords.frameworks.join(" et ")}, rien que ça.` : "Sans préciser les technos, parfait."} Préparation d'une architecture digne d'une mission spatiale pour... ${keywords.mainTopic !== "générique" ? `afficher une ${keywords.mainTopic}` : "afficher du texte et des images"}. Logique.`,
                `Complexité technique détectée. Joie. ${keywords.designElements.length ? `Avec tous ces ${keywords.designElements.join(", ")}.` : "Sans vraiment préciser ce qui est complexe."} Va falloir sortir l'artillerie lourde pour ce qui est essentiellement ${keywords.mainTopic !== "générique" ? `une ${keywords.mainTopic} glorifiée` : "une mise en page basique avec des effets"}. 8 ans d'études pour ça.`,
                `Demande techniquement ambitieuse. Fascinant. ${keywords.animations.length ? `Avec des ${keywords.animations.join(", ")}.` : "Avec des fonctionnalités non spécifiées."} Jongler entre ${keywords.frameworks.length ? keywords.frameworks.join(", ") : "diverses technologies"} pour créer ce chef-d'œuvre qui sera probablement remplacé dans trois mois.`
            ],
            simple: [
                `Élaboration de la structure du code. Comme construire un château de cartes, mais avec des div et des spans. ${keywords.frameworks.length ? `Au moins il mentionne ${keywords.frameworks.join(" et ")}.` : "Sans framework spécifique, pour corser les choses."} La moindre modification risque de tout faire s'effondrer. C'est ça le dev web.`,
                `Planification technique. Hmm, relativement simple. ${keywords.designElements.length ? `Quelques ${keywords.designElements.join(", ")}.` : "Des éléments basiques."} Possible de faire ça les yeux fermés. Ce serait peut-être plus agréable.`,
                `Structure technique : ${keywords.mainTopic !== "générique" ? `une ${keywords.mainTopic} standard` : "disposition classique"}. ${keywords.frameworks.length ? `Utilisation de ${keywords.frameworks[0]}.` : "Rien de spécial côté technos."} Rafraîchissant de ne pas réinventer la roue, même si des ajustements sans fin sont à prévoir.`
            ]
        };
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const complexityLevel = isComplex ? "complex" : "simple";
        const responsesArray = technicalResponses[complexityLevel];
        return prefix + responsesArray[Math.floor(Math.random() * responsesArray.length)];
    }
    
    // Generate personalized text for the final step
    function generateFinalStepText(prompt, keywords) {
        const prefixes = ["Michel conclut : ", "Finalisation : ", "Préparation code : ", "Bon, dernière étape... "];
        const finalResponses = [
            `Finalisation de la structure Liquid pour ${keywords.mainTopic !== "générique" ? `cette ${keywords.mainTopic}` : "cette création"}. Espérons qu'il aime les accolades et les pourcentages. ${keywords.frameworks.includes("liquid") || keywords.frameworks.includes("shopify") ? "Au moins il sait ce qu'est Liquid." : "Pas sûr qu'il sache ce qu'est Liquid."} Rendre ça lisible, une tâche gratifiante.`,
            `Préparation du code final pour ${keywords.mainTopic !== "générique" ? `ce ${keywords.mainTopic}` : "ce chef-d'œuvre numérique"}. ${keywords.colors.length ? `Avec les couleurs ${keywords.colors.join(" et ")} soigneusement intégrées.` : "Avec une palette de couleurs inventée faute d'indications."} Ajout de commentaires que personne ne lira jamais.`,
            `Peaufinage du code. L'excitation est à son comble. ${keywords.mainTopic !== "générique" ? `Cette ${keywords.mainTopic}` : "Cette section"} ${keywords.animations.length ? `avec ses animations de ${keywords.animations.join(" et de ")}` : "sans grande originalité"} sera bientôt prête. Combien de temps avant la demande de modifications qui auraient dû être mentionnées au début ?`,
            `Finalisation du code pour ${keywords.mainTopic !== "générique" ? `cette ${keywords.mainTopic}` : "cette création web"}. S'assurer que tout est ${keywords.frameworks.length ? `compatible avec ${keywords.frameworks.join(" et ")}` : "propre et organisé"}. Presque aussi passionnant que regarder la peinture sécher.`
        ];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + finalResponses[Math.floor(Math.random() * finalResponses.length)];
    }
    
    // Display questions form
    function displayQuestionsForm(questions, container) {
        const formHtml = `
            <div class="questions-section">
                <h2>Il me faut des précisions, évidemment</h2>
                <p>Je ne peux pas lire dans vos pensées, même si ce serait probablement plus divertissant que certaines des sections qu'on me demande de coder. Veuillez répondre aux questions suivantes :</p>
                
                <form id="questionsForm" class="questions-form">
                    ${questions.map((q, index) => `
                        <div class="question-item">
                            <label for="answer-${index}">${index + 1}. ${escapeHtml(q)}</label>
                            <input type="text" id="answer-${index}" name="answer-${index}" placeholder="Une réponse concise serait appréciée..." required>
                        </div>
                    `).join('')}
                    <button type="submit">Envoyer et mettre fin à mon supplice</button>
                </form>
            </div>
        `;
        
        container.innerHTML = formHtml;
        
        // Add event listener to the questions form
        document.getElementById('questionsForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleAnswersSubmit(event, container);
        });
    }
    
    // Handle the submission of answers
    async function handleAnswersSubmit(event, container) {
        const form = event.target;
        const answers = [];
        const inputs = form.querySelectorAll('input[type="text"]');
        
        inputs.forEach(input => {
            answers.push(input.value.trim());
        });
        
        // Show a loading message
        container.innerHTML = `
            <div class="loading-message">
                <span>Je génère votre code. Attendez, je cherche la motivation...</span>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // Prepare form data with answers
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('message', '');
        formData.append('answers', JSON.stringify(answers));
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle the response
            if (data.type === 'code') {
                const resultContainer = document.getElementById('resultContainer');
                displayFinalCode(data.content, resultContainer);
                container.innerHTML = ''; // Clear the questions container
            } else {
                // Unexpected response type
                container.innerHTML = `
                    <div class="error-message">
                        Apparemment, même avec vos précisions, je n'arrive pas à comprendre ce que vous voulez. Impressionnant.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `
                <div class="error-message">
                    Une erreur s'est produite. Je préfère ne pas préciser laquelle, ça nous ferait perdre du temps à tous les deux.
                </div>
            `;
        }
    }
    
    // Display the final code
    function displayFinalCode(code, container) {
        container.innerHTML = `
            <div class="result-container">
                <div class="result-header">
                    <div class="result-title">Voilà votre chef-d'œuvre en Liquid</div>
                    <button class="copy-all-btn" id="copyBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copier ce travail d'orfèvre
                    </button>
                </div>
                <div class="result-content">
                    <pre><code class="language-liquid">${escapeHtml(code)}</code></pre>
                </div>
                <div class="result-footer">
                    <p>Ne me remerciez pas, c'est mon travail. Littéralement.</p>
                </div>
            </div>
        `;
        
        // Highlight the code
        document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightBlock(block);
        });
        
        // Add copy button functionality
        document.getElementById('copyBtn').addEventListener('click', () => {
            const codeText = code;
            navigator.clipboard.writeText(codeText).then(() => {
                const copyBtn = document.getElementById('copyBtn');
                copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copié, évidemment
                `;
                copyBtn.style.backgroundColor = 'var(--success-color)';
                copyBtn.style.color = 'white';
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copier ce travail d'orfèvre
                    `;
                    copyBtn.style.backgroundColor = '';
                    copyBtn.style.color = '';
                }, 2000);
            });
        });
    }
    
    // Utility functions
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Function to show toast notifications
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        const toastId = `toast-${Date.now()}`;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = toastId;

        let icon = '';
        if (type === 'success') icon = '✓';
        else if (type === 'error') icon = '×';
        else if (type === 'info') icon = 'ℹ';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Remove toast after animation finishes (slide-out duration + delay)
        setTimeout(() => {
            const currentToast = document.getElementById(toastId);
            if (currentToast) {
                currentToast.remove();
            }
        }, 5300); // Matches the animation duration + delay
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // Gestion de la barre sticky
    const stickyBar = document.querySelector('.sticky-bar');
    const heroSection = document.querySelector('.hero-section');
    
    if (stickyBar && heroSection) {
        // Fonction pour afficher/masquer la barre sticky en fonction du scroll
        const showStickyBar = () => {
            const heroBottom = heroSection.getBoundingClientRect().bottom;
            if (heroBottom < 0) {
                stickyBar.classList.add('visible');
            } else {
                stickyBar.classList.remove('visible');
            }
        };
        
        // Ajouter l'écouteur d'événement pour le scroll
        window.addEventListener('scroll', showStickyBar);
        
        // Gestion du bouton dans la barre sticky
        const stickyButton = stickyBar.querySelector('button');
        if (stickyButton) {
            stickyButton.addEventListener('click', function() {
                // Scroll jusqu'au formulaire
                const promptForm = document.getElementById('promptForm');
                if (promptForm) {
                    promptForm.scrollIntoView({ behavior: 'smooth' });
                    // Focus sur le textarea après le scroll
                    setTimeout(() => {
                        const textarea = promptForm.querySelector('textarea');
                        if (textarea) {
                            textarea.focus();
                        }
                    }, 500);
                }
            });
        }
    }
    
    // Gestion des exemples de prompts
    const exampleTags = document.querySelectorAll('.example-tag');
    const promptTextarea = document.getElementById('userPrompt');
    
    if (exampleTags.length && promptTextarea) {
        exampleTags.forEach(tag => {
            tag.addEventListener('click', function() {
                // Récupérer le texte de l'exemple
                const exampleText = this.textContent.trim();
                
                // Construire un prompt plus détaillé basé sur l'exemple
                let detailedPrompt;
                
                switch(exampleText) {
                    case 'Carrousel produit dynamique':
                        detailedPrompt = "Je veux créer un carrousel de produits avec navigation, pagination et qui affiche mes produits en promotion. Il devrait être responsive et s'adapter à tous les écrans.";
                        break;
                    case 'Section FAQ avec accordéon':
                        detailedPrompt = "Je souhaite une section FAQ avec un accordéon élégant qui permet aux clients de cliquer sur les questions pour voir les réponses. Il me faut 4-5 emplacements pour mes questions fréquentes.";
                        break;
                    case 'Grille de collections chic':
                        detailedPrompt = "Je recherche une grille de collections élégante pour afficher mes 4 catégories principales avec image, titre et bouton. J'aimerais un effet hover subtil et un design minimaliste.";
                        break;
                    case 'Bannière promo animée':
                        detailedPrompt = "Je veux une bannière promotionnelle animée pour mettre en avant ma solde de 30%. Elle doit inclure un compte à rebours, un CTA et un effet visuel pour attirer l'attention.";
                        break;
                    default:
                        detailedPrompt = exampleText;
                }
                
                // Mettre à jour le textarea avec l'exemple
                promptTextarea.value = detailedPrompt;
                promptTextarea.focus();
                
                // Faire défiler jusqu'au formulaire
                promptTextarea.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
    
    // Gestion des boutons des cartes d'exemple
    const exampleCards = document.querySelectorAll('.example-card');
    
    if (exampleCards.length) {
        exampleCards.forEach(card => {
            const button = card.querySelector('.example-btn');
            const title = card.querySelector('h3');
            
            if (button && title) {
                button.addEventListener('click', function() {
                    const sectionTitle = title.textContent.trim();
                    
                    // Mettre à jour le textarea avec l'exemple correspondant
                    if (promptTextarea) {
                        promptTextarea.value = `Je souhaite utiliser la section "${sectionTitle}" pour ma boutique. J'aimerais l'adapter à mes couleurs et à mon branding.`;
                        promptTextarea.focus();
                        promptTextarea.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        });
    }
    
    // Gestion du placeholder de vidéo
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function() {
            // Ici, on simule l'insertion d'une iframe YouTube
            const videoFrame = document.createElement('iframe');
            videoFrame.setAttribute('width', '100%');
            videoFrame.setAttribute('height', '100%');
            videoFrame.setAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'); // Remplacer par la vraie vidéo
            videoFrame.setAttribute('frameborder', '0');
            videoFrame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            videoFrame.setAttribute('allowfullscreen', 'true');
            
            // Remplacer le placeholder par l'iframe
            this.innerHTML = '';
            this.appendChild(videoFrame);
        });
    }
}); 