document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const chatForm = document.getElementById('chatForm');
    const userMessage = document.getElementById('userMessage');
    const chatHistory = document.getElementById('chatHistory');
    const imageUpload = document.getElementById('imageUpload');
    const uploadPreview = document.getElementById('uploadPreview');
    const resetBtn = document.getElementById('resetBtn');
    const chatContainer = document.getElementById('chatHistory');
    
    // Session ID
    let sessionId = uuidv4(); // Generate unique session ID on load

    // Selected image file
    let selectedImage = null;
    
    // Event listeners
    chatForm.addEventListener('submit', handleChatSubmit);
    imageUpload.addEventListener('change', handleImageUpload);
    resetBtn.addEventListener('click', resetConversation);
    
    // Handle file upload and preview
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        selectedImage = file;
        uploadPreview.innerHTML = '';
        
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
            imageUpload.value = '';
            selectedImage = null;
        });
        
        previewContainer.appendChild(removeBtn);
        uploadPreview.appendChild(previewContainer);
    }
    
    // Handle chat form submission
    async function handleChatSubmit(event) {
        event.preventDefault();
        
        const message = userMessage.value.trim();
        if (!message && !selectedImage) return;
        
        // Add user message to chat
        addMessageToChat('user', message, selectedImage ? URL.createObjectURL(selectedImage) : null);
        
        // Clear input
        userMessage.value = '';
        uploadPreview.innerHTML = '';
        
        // Add loading indicator
        const loadingElement = addLoadingIndicator();
        
        // Prepare form data
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('message', message);
        
        if (selectedImage) {
            formData.append('image', selectedImage);
        }
        
        selectedImage = null;
        imageUpload.value = '';
        
        await sendRequest(formData, loadingElement);
    }
    
    // Add message to chat history
    function addMessageToChat(sender, content, imageUrl = null) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        // Process content for code blocks
        if (sender === 'assistant') {
            // Vérifiez que content n'est pas undefined
            if (content) {
                // Check if the content contains code blocks
                if (content.includes('```liquid') || content.includes('```')) {
                    contentElement.innerHTML = processCodeBlocks(content);
                } else {
                    // If it's pure code without markdown backticks (common for this app)
                    if (content.trim().startsWith('{%') || content.trim().startsWith('<div') || content.trim().startsWith('<!--')) {
                        // It's likely Liquid code without markdown formatting
                        contentElement.innerHTML = `<pre><code class="language-liquid">${escapeHtml(content)}</code><button class="copy-btn">Copier</button></pre>`;
                    } else {
                        contentElement.textContent = content;
                    }
                }
            } else {
                // Fallback pour content undefined
                contentElement.textContent = "Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer.";
            }
        } else if (sender === 'questions') {
            // Special handler for the questions form container
             contentElement.innerHTML = content; // Content is pre-formatted HTML form
        } else {
            // Pour user et system messages, juste définir le texte
            contentElement.textContent = content || "";
        }
        
        messageElement.appendChild(contentElement);
        
        // Add image if provided
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'message-img';
            contentElement.appendChild(img);
        }
        
        chatHistory.appendChild(messageElement);
        
        // Scroll to bottom
        scrollToBottom();
        
        // Format if assistant added code
        if (sender === 'assistant') {
            formatCodeBlocks();
        }
    }
    
    // Add loading indicator
    function addLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.innerHTML = `
            <span>Michel réfléchit</span>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatHistory.appendChild(loadingElement);
        scrollToBottom();
        return loadingElement;
    }
    
    // Process code blocks in the response
    function processCodeBlocks(content) {
        // Replace markdown code blocks with HTML
        let processedContent = content.replace(/```liquid([\s\S]*?)```/g, (match, code) => {
            return `<pre><code class="language-liquid">${escapeHtml(code.trim())}</code><button class="copy-btn">Copier</button></pre>`;
        });
        
        // If no language is specified
        processedContent = processedContent.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code class="language-liquid">${escapeHtml(code.trim())}</code><button class="copy-btn">Copier</button></pre>`;
        });
        
        return processedContent;
    }
    
    // Format code blocks with highlight.js
    function formatCodeBlocks() {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
            
            // Add copy button functionality
            const copyBtn = block.parentElement.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const codeText = block.textContent;
                    navigator.clipboard.writeText(codeText).then(() => {
                        copyBtn.textContent = 'Copié!';
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            copyBtn.textContent = 'Copier';
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    });
                });
            }
        });
    }
    
    // Reset conversation
    async function resetConversation() {
        try {
            // We don't strictly need to call the backend if session is client-side only
            // But calling it ensures the agent state is reset if backend maintains state
            // await fetch('/api/reset', { method: 'POST' }); 
            
            // Clear chat history on client
            while (chatHistory.firstChild) { // Clear all messages
                chatHistory.removeChild(chatHistory.lastChild);
            }
            
            // Generate a new session ID
            sessionId = uuidv4();
            console.log("New session ID:", sessionId);

            // Re-enable chat form if it was disabled by questions
            enableChatForm(); 

            // Add initial system message
            addMessageToChat('system', 'Nouvelle conversation. Décrivez la section ou ajoutez une image.');

        } catch (error) {
            console.error('Error resetting conversation:', error);
        }
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper function to scroll chat to bottom
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Display the form for answering questions
    function displayQuestionsForm(questions) {
        const formHtml = `
            <form id="questionsForm" class="questions-form">
                <p>Michel a besoin de quelques précisions :</p>
                ${questions.map((q, index) => `
                    <div class="question-item">
                        <label for="answer-${index}">${index + 1}. ${escapeHtml(q)}</label>
                        <input type="text" id="answer-${index}" name="answer-${index}" required>
                    </div>
                `).join('')}
                <button type="submit">Envoyer les réponses</button>
            </form>
        `;
        addMessageToChat('questions', formHtml);
        document.getElementById('questionsForm').addEventListener('submit', handleAnswersSubmit);
        disableChatForm(); // Disable main chat form while answering questions
    }

    // Handle the submission of the answers form
    async function handleAnswersSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const answers = [];
        const inputs = form.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            answers.push(input.value.trim());
        });

        // Remove the questions form message
        form.closest('.message.questions').remove();
        enableChatForm(); // Re-enable main chat form

        const loadingElement = addLoadingIndicator();

        const formData = new FormData();
        formData.append('session_id', sessionId);
        // We don't send the original message again, just the answers
        formData.append('message', ''); // Or maybe a placeholder like "[User Answers]"
        formData.append('answers', JSON.stringify(answers));

        await sendRequest(formData, loadingElement);
    }

    // Central function to send request and handle response
    async function sendRequest(formData, loadingElement) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });

            loadingElement.remove();

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ content: 'Erreur inconnue du serveur.' }));
                 throw new Error(errorData.content || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.type === 'questions') {
                displayQuestionsForm(data.content);
            } else if (data.type === 'code') {
                addMessageToChat('assistant', data.content);
            } else if (data.type === 'error') {
                addMessageToChat('system', data.content || 'Une erreur est survenue.');
            } else {
                 addMessageToChat('system', 'Réponse inattendue du serveur.');
            }

        } catch (error) {
            console.error('Error sending/processing request:', error);
            if(loadingElement) loadingElement.remove(); // Ensure loading is removed on error
            addMessageToChat('system', `Erreur : ${error.message}`);
            enableChatForm(); // Ensure form is enabled if questions were expected but failed
        }
    }

    // Disable main chat form input and button
    function disableChatForm() {
        userMessage.disabled = true;
        chatForm.querySelector('button[type="submit"]').disabled = true;
        imageUpload.disabled = true; // Also disable image upload
        chatForm.classList.add('disabled');
    }

    // Enable main chat form
    function enableChatForm() {
        userMessage.disabled = false;
        chatForm.querySelector('button[type="submit"]').disabled = false;
        imageUpload.disabled = false;
        chatForm.classList.remove('disabled');
    }

    // Initial system message
    addMessageToChat('system', 'Bonjour! Décrivez la section Shopify que vous souhaitez créer ou téléchargez une capture d\'écran.');

    // --- UUID v4 function --- 
    function uuidv4() {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
      );
    }
});