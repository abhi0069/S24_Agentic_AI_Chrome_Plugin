// Load environment variables
const config = {
    huggingfaceToken: process.env.HUGGINGFACE_TOKEN,
    searchApiKey: process.env.SEARCH_API_KEY,
    searchEngineId: process.env.SEARCH_ENGINE_ID
};

// Load configuration from storage
chrome.storage.sync.get(['huggingfaceToken', 'searchApiKey', 'searchEngineId'], function(result) {
    config = { ...config, ...result };
});

// Store conversation history
let conversationHistory = [];

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'researchText') {
        // Check if configuration is complete
        if (!config.searchApiKey || !config.searchEngineId) {
            sendResponse({ 
                error: 'Please configure Google Search API keys in the extension settings first.' 
            });
            return true;
        }

        processResearch(message.text)
            .then(result => sendResponse({ result }))
            .catch(error => sendResponse({ 
                error: error.message || 'An error occurred during research.' 
            }));
        return true;
    }
});

async function processResearch(text) {
    const steps = [];
    
    try {
        console.log('Starting research process...');
        
        // Step 1: Initial Analysis
        console.log('Step 1: Starting initial analysis...');
        const analysis = await analyzeText(text);
        console.log('Step 1: Analysis complete');
        steps.push({
            title: "Initial Analysis",
            content: analysis,
            sources: []
        });

        // Step 2: Search for Related Information
        console.log('Step 2: Starting search for related information...');
        const searchResults = await searchRelatedInfo(text);
        console.log('Step 2: Search complete', searchResults);
        
        if (searchResults && searchResults.sources && searchResults.sources.length > 0) {
            steps.push({
                title: "Related Information",
                content: searchResults.summary,
                sources: searchResults.sources
            });

            // Step 3: Compare and Contrast
            console.log('Step 3: Starting comparison...');
            const comparison = await compareInformation(text, searchResults);
            console.log('Step 3: Comparison complete');
            steps.push({
                title: "Comparison Analysis",
                content: comparison,
                sources: []
            });
        } else {
            console.log('No search results found');
            steps.push({
                title: "Related Information",
                content: "No related information found.",
                sources: []
            });
        }

        // Step 4: Generate Summary
        console.log('Step 4: Generating summary...');
        const summary = await generateSummary(text, steps);
        console.log('Step 4: Summary complete');

        return {
            steps: steps,
            summary: summary
        };
    } catch (error) {
        console.error('Research process error:', error);
        throw new Error(`Research failed at step: ${error.message}`);
    }
}

async function analyzeText(text) {
    try {
        const prompt = `Research Analysis of "${text}":

Key Terms:
- What is the core definition?
- What are the main components?
- What are the key technical terms?

Features:
- What are the main capabilities?
- What makes it unique?
- What are its technical advantages?

Use Cases:
- Where is it commonly used?
- What problems does it solve?
- What industries benefit from it?

Trends:
- What is its current market position?
- What are recent developments?
- What is its future outlook?

Provide specific technical details and examples.`;
        const response = await callHuggingFace(prompt);
        return response;
    } catch (error) {
        console.error('Text analysis error:', error);
        throw new Error('Failed to analyze text. Please try again.');
    }
}

async function searchRelatedInfo(text) {
    try {
        const searchResults = await callSearchAPI(text);
        
        if (!searchResults || searchResults.length === 0) {
            throw new Error('No search results found.');
        }

        // Process search results to make them more concise
        const processedResults = searchResults.map(result => ({
            title: result.title,
            snippet: result.snippet,
            link: result.link
        })).slice(0, 5); // Only take the top 5 results

        const prompt = `Research Analysis of Search Results for "${text}":

Key Info:
- What are the main findings?
- What technical details are important?
- What are the key features mentioned?

Sources:
- Which sources are most authoritative?
- What are their key contributions?
- What makes them reliable?

Stats:
- What are the important metrics?
- What are the performance numbers?
- What are the usage statistics?

Features:
- What are the technical capabilities?
- What are the unique features?
- What are the implementation details?

Provide specific information from the search results.`;
        const summary = await callHuggingFace(prompt);

        return {
            summary,
            sources: processedResults.map(result => ({
                title: result.title,
                url: result.link
            }))
        };
    } catch (error) {
        console.error('Search error:', error);
        throw new Error('Failed to search for related information. Please try again.');
    }
}

async function compareInformation(originalText, searchResults) {
    try {
        const prompt = `Technical Comparison of "${originalText}":

Specs:
- What are the technical specifications?
- What are the system requirements?
- What are the performance metrics?

Features:
- What are the key features?
- How do they compare to alternatives?
- What are the unique capabilities?

Compatibility:
- What systems does it work with?
- What are the integration options?
- What are the version requirements?

Performance:
- What are the speed benchmarks?
- What are the scalability features?
- What are the resource requirements?

Provide specific technical comparisons.`;
        const response = await callHuggingFace(prompt);
        return response;
    } catch (error) {
        console.error('Comparison error:', error);
        throw new Error('Failed to compare information. Please try again.');
    }
}

async function generateSummary(text, steps) {
    try {
        const prompt = `Comprehensive Research Summary of "${text}":

Overview:
- What is the main purpose?
- What are the key benefits?
- What is the current status?

Specs:
- What are the technical specifications?
- What are the system requirements?
- What are the performance metrics?

Implementation:
- How is it typically implemented?
- What are the best practices?
- What are common challenges?

Performance:
- What are the performance characteristics?
- What are the scalability features?
- What are the resource requirements?

Future:
- What are upcoming developments?
- What are the roadmap plans?
- What are the industry trends?

Provide a detailed technical summary.`;
        const response = await callHuggingFace(prompt);
        return response;
    } catch (error) {
        console.error('Summary generation error:', error);
        throw new Error('Failed to generate summary. Please try again.');
    }
}

async function callHuggingFace(prompt, retries = 3) {
    try {
        console.log('Calling Hugging Face API...');
        const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-base', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.huggingfaceToken}`
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    top_p: 0.9,
                    do_sample: true,
                    truncation: 'only_first'
                }
            })
        });

        console.log('Hugging Face API response status:', response.status);
        
        if (!response.ok) {
            // If we get a 503 and have retries left, wait and try again
            if (response.status === 503 && retries > 0) {
                console.log(`Retrying... ${retries} attempts left`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                return callHuggingFace(prompt, retries - 1);
            }
            
            let error;
            try {
                error = await response.json();
            } catch (e) {
                error = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('Hugging Face API error:', error);
            throw new Error(error.error || 'Hugging Face API error');
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Failed to parse Hugging Face response:', e);
            throw new Error('Invalid response from Hugging Face API');
        }

        console.log('Hugging Face API response:', data);
        
        // Handle different response formats
        if (Array.isArray(data) && data.length > 0) {
            return data[0].generated_text || 'No response generated';
        } else if (data.generated_text) {
            return data.generated_text;
        } else {
            console.error('Unexpected Hugging Face response format:', data);
            return 'No response generated';
        }
    } catch (error) {
        console.error('Hugging Face API error:', error);
        throw new Error(`Failed to get response from AI: ${error.message}`);
    }
}

async function callSearchAPI(query) {
    try {
        console.log('Calling Google Search API...');
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${config.searchApiKey}&cx=${config.searchEngineId}&q=${encodeURIComponent(query)}&num=10`);
        
        console.log('Google Search API response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Google Search API error:', error);
            throw new Error(error.error?.message || 'Search API error');
        }

        const data = await response.json();
        console.log('Google Search API response:', data);
        return data.items || [];
    } catch (error) {
        console.error('Google Search API error:', error);
        throw new Error(`Search failed: ${error.message}`);
    }
} 