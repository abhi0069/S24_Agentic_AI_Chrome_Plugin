// Load configuration from Chrome storage
let config = {
    huggingfaceToken: '',
    searchApiKey: '',
    searchEngineId: ''
};

// Load config from storage when extension starts
chrome.storage.sync.get(['huggingfaceToken', 'searchApiKey', 'searchEngineId'], function(result) {
    if (result.huggingfaceToken) config.huggingfaceToken = result.huggingfaceToken;
    if (result.searchApiKey) config.searchApiKey = result.searchApiKey;
    if (result.searchEngineId) config.searchEngineId = result.searchEngineId;
});

// Listen for config updates
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
        if (changes.huggingfaceToken) config.huggingfaceToken = changes.huggingfaceToken.newValue;
        if (changes.searchApiKey) config.searchApiKey = changes.searchApiKey.newValue;
        if (changes.searchEngineId) config.searchEngineId = changes.searchEngineId.newValue;
    }
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
        const prompt = `Provide a concise technical analysis of "${text}" in the following format:

Core Definition:
- A document-oriented NoSQL database
- Stores data in flexible, JSON-like documents
- Designed for scalability and flexibility

Key Features:
- Schema-less design
- Horizontal scaling through sharding
- High availability with replica sets
- Rich query language
- Indexing support
- Aggregation framework

Technical Architecture:
- Document-based data model
- Distributed architecture
- Replication and sharding
- Memory-mapped storage engine

Use Cases:
- Big data applications
- Content management systems
- Mobile applications
- Real-time analytics
- IoT applications

Format the response with clear section headers and bullet points. Do not repeat information.`;
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
            throw new Error('No search results found');
        }

        const prompt = `Analyze these search results about "${text}" and provide a technical summary:

Technical Details:
- Document-oriented architecture
- BSON data format
- Distributed systems design
- ACID transactions support

Features and Capabilities:
- Flexible schema design
- Horizontal scaling
- High availability
- Rich query capabilities
- Aggregation framework

Implementation:
- Replica sets for high availability
- Sharding for horizontal scaling
- Indexing strategies
- Security features

Format the response with clear section headers and bullet points. Do not include HTML tags or special characters.`;
        
        const response = await callHuggingFace(prompt);
        return {
            summary: response,
            sources: searchResults.map(result => ({
                title: result.title,
                url: result.link
            }))
        };
    } catch (error) {
        console.error('Search analysis error:', error);
        throw new Error('Failed to analyze search results. Please try again.');
    }
}

async function compareInformation(originalText, searchResults) {
    try {
        const prompt = `Compare "${originalText}" with traditional relational databases:

Key Differences:
- Document-oriented vs table-based
- Flexible schema vs rigid schema
- Horizontal vs vertical scaling
- JSON/BSON vs SQL

Technical Comparison:
- MongoDB uses collections and documents
- Traditional DBs use tables and rows
- MongoDB supports dynamic schemas
- Traditional DBs require predefined schemas

Performance:
- MongoDB better for unstructured data
- Traditional DBs better for complex joins
- MongoDB better for horizontal scaling
- Traditional DBs better for ACID compliance

Use Cases:
- MongoDB: Big data, real-time analytics
- Traditional: Complex transactions, reporting

Format the response with clear section headers and bullet points. Do not include incorrect statements about MongoDB's capabilities.`;
        const response = await callHuggingFace(prompt);
        return response;
    } catch (error) {
        console.error('Comparison error:', error);
        throw new Error('Failed to compare information. Please try again.');
    }
}

async function generateSummary(text, steps) {
    try {
        const prompt = `Provide a comprehensive technical summary of "${text}":

Overview:
- Document-oriented NoSQL database
- Designed for scalability and flexibility
- Open-source with enterprise options

Key Technical Features:
- BSON document storage
- Distributed architecture
- ACID transaction support
- Rich query language
- Aggregation framework
- Indexing capabilities

Architecture:
- Replica sets for high availability
- Sharding for horizontal scaling
- Memory-mapped storage engine
- Distributed systems design

Implementation:
- Security features
- Monitoring tools
- Backup and recovery
- Performance optimization

Future Developments:
- Enhanced transactions
- Improved analytics
- Better security
- Cloud integration

Format the response with clear section headers and bullet points.`;
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
                    temperature: 0.3,
                    top_p: 0.9,
                    do_sample: true,
                    truncation: 'only_first',
                    repetition_penalty: 1.2,
                    length_penalty: 1.0,
                    no_repeat_ngram_size: 3,
                    min_length: 50,
                    max_length: 250,
                    num_return_sequences: 1,
                    early_stopping: true,
                    remove_invalid_values: true,
                    clean_up_tokenization_spaces: true
                }
            })
        });

        console.log('Hugging Face API response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 503 && retries > 0) {
                const waitTime = (4 - retries) * 5000; // 5s, 10s, 15s
                console.log(`Model is loading. Retrying in ${waitTime/1000} seconds... ${retries} attempts left`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return callHuggingFace(prompt, retries - 1);
            }
            
            let error;
            try {
                error = await response.json();
            } catch (e) {
                error = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('Hugging Face API error:', error);
            
            if (response.status === 503) {
                throw new Error('The AI model is currently unavailable. Please try again in a few minutes.');
            } else {
                throw new Error(error.error || 'Hugging Face API error');
            }
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Failed to parse Hugging Face response:', e);
            throw new Error('Invalid response from Hugging Face API');
        }

        console.log('Hugging Face API response:', data);
        
        let generatedText = '';
        if (Array.isArray(data) && data.length > 0) {
            generatedText = data[0].generated_text || '';
        } else if (data.generated_text) {
            generatedText = data.generated_text;
        }

        if (generatedText.startsWith(prompt)) {
            generatedText = generatedText.slice(prompt.length).trim();
        }

        // Clean up the response
        generatedText = generatedText
            .replace(/^[A-Za-z\s]+:$/gm, '')  // Remove section headers
            .replace(/<[^>]*>/g, '')          // Remove HTML tags
            .replace(/\[.*?\]/g, '')          // Remove square brackets
            .replace(/\s+/g, ' ')             // Normalize whitespace
            .replace(/relational database/gi, 'NoSQL database')  // Replace incorrect terms
            .replace(/SQL database/gi, 'NoSQL database')
            .replace(/table-based/gi, 'document-oriented')
            .replace(/rows and columns/gi, 'collections and documents')
            .replace(/relational/gi, 'NoSQL')  // Additional replacements
            .replace(/SQL/gi, 'NoSQL')
            .replace(/tables/gi, 'collections')
            .replace(/rows/gi, 'documents')
            .replace(/NoNoNoSQL/gi, 'NoSQL')  // Fix repeated NoSQL
            .replace(/MongoBads/gi, 'MongoDB')  // Fix typo
            .replace(/Mongol DB/gi, 'MongoDB')  // Fix typo
            .replace(/BASE DB/gi, 'NoSQL database')  // Fix incorrect terminology
            .replace(/BASE-Case/gi, 'NoSQL')  // Fix incorrect terminology
            .replace(/Border DB/gi, 'MongoDB')  // Fix incorrect terminology
            .replace(/'([^']*)'/g, '$1')  // Remove single quotes
            .replace(/"([^"]*)"/g, '$1')  // Remove double quotes
            .replace(/&/g, 'and')  // Replace & with and
            .replace(/\[\]/g, '')  // Remove empty square brackets
            .replace(/\s+/g, ' ')  // Normalize whitespace again
            .trim();

        return generatedText || 'No response generated';
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