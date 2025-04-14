document.addEventListener('DOMContentLoaded', function() {
    // Référence au bouton de retour
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // Animation des étapes
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.classList.add('visible');
        }, 300 * index); // Déclenchement séquentiel des animations
    });

    // Gestion du formulaire
    const form = document.querySelector('.questions-form');
    if (form) {
        // Mettre en surbrillance lors de la sélection des inputs
        const inputs = form.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });

        // Gestion de la soumission du formulaire
        const submitButton = form.querySelector('.submit-btn');
        if (submitButton) {
            submitButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Collecter les données du formulaire
                const formData = {};
                inputs.forEach(input => {
                    const questionLabel = input.closest('.question-item').querySelector('p').textContent;
                    formData[questionLabel] = input.value;
                });
                
                // On peut soit envoyer les données à un endpoint
                // console.log('Données à envoyer:', formData);
                
                // Simulation d'envoi réussi
                showSuccessMessage();
            });
        }
    }

    // Fonction pour afficher un message de succès
    function showSuccessMessage() {
        // Créer un élément de message
        const messageContainer = document.createElement('div');
        messageContainer.className = 'success-message';
        messageContainer.innerHTML = `
            <div class="message-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>Merci pour ces précisions ! Je vais maintenant générer votre section Shopify en code Liquid.</p>
            </div>
            <button class="close-message">Fermer</button>
        `;
        
        // Ajouter à la page
        document.body.appendChild(messageContainer);
        
        // Animer l'entrée
        setTimeout(() => {
            messageContainer.classList.add('visible');
        }, 100);
        
        // Gérer la fermeture
        const closeButton = messageContainer.querySelector('.close-message');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                messageContainer.classList.remove('visible');
                setTimeout(() => {
                    messageContainer.remove();
                }, 300);
            });
        }
    }
}); 