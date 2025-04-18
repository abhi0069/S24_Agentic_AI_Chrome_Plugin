document.addEventListener('DOMContentLoaded', function() {
    const researchText = document.getElementById('researchText');
    const researchButton = document.getElementById('researchButton');
    const resultsContainer = document.getElementById('results');
    const errorMessage = document.getElementById('error');

    researchButton.addEventListener('click', async function() {
        const text = researchText.value.trim();
        if (!text) {
            showError('Please enter some text to research.');
            return;
        }

        // Show loading state
        researchButton.classList.add('loading');
        errorMessage.style.display = 'none';
        resultsContainer.innerHTML = '';

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'researchText',
                text: text
            });

            if (response.error) {
                showError(response.error);
                return;
            }

            displayResults(response.result);
        } catch (error) {
            showError('An error occurred while processing your request.');
            console.error('Error:', error);
        } finally {
            // Hide loading state
            researchButton.classList.remove('loading');
        }
    });

    function displayResults(result) {
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'research-steps';

        // Display each step
        result.steps.forEach(step => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step';

            const titleElement = document.createElement('h3');
            titleElement.className = 'step-title';
            titleElement.textContent = step.title;

            const contentElement = document.createElement('div');
            contentElement.className = 'step-content';
            contentElement.textContent = step.content;

            stepElement.appendChild(titleElement);
            stepElement.appendChild(contentElement);

            // Add sources if available
            if (step.sources && step.sources.length > 0) {
                const sourcesElement = document.createElement('div');
                sourcesElement.className = 'sources';

                step.sources.forEach(source => {
                    const sourceElement = document.createElement('div');
                    sourceElement.className = 'source';
                    
                    const link = document.createElement('a');
                    link.href = source.url;
                    link.textContent = source.title;
                    link.target = '_blank';
                    
                    sourceElement.appendChild(link);
                    sourcesElement.appendChild(sourceElement);
                });

                stepElement.appendChild(sourcesElement);
            }

            stepsContainer.appendChild(stepElement);
        });

        // Add summary if available
        if (result.summary) {
            const summaryElement = document.createElement('div');
            summaryElement.className = 'step';
            
            const titleElement = document.createElement('h3');
            titleElement.className = 'step-title';
            titleElement.textContent = 'Research Summary';
            
            const contentElement = document.createElement('div');
            contentElement.className = 'step-content';
            contentElement.textContent = result.summary;
            
            summaryElement.appendChild(titleElement);
            summaryElement.appendChild(contentElement);
            stepsContainer.appendChild(summaryElement);
        }

        resultsContainer.appendChild(stepsContainer);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}); 