document.addEventListener('DOMContentLoaded', function() {
    const searchKeyInput = document.getElementById('search-key');
    const searchEngineInput = document.getElementById('search-engine');
    const saveBtn = document.getElementById('save-btn');
    const statusDiv = document.getElementById('status');

    // Load saved configuration
    chrome.storage.sync.get(['searchApiKey', 'searchEngineId'], function(result) {
        if (result.searchApiKey) searchKeyInput.value = result.searchApiKey;
        if (result.searchEngineId) searchEngineInput.value = result.searchEngineId;
    });

    saveBtn.addEventListener('click', function() {
        const config = {
            searchApiKey: searchKeyInput.value.trim(),
            searchEngineId: searchEngineInput.value.trim()
        };

        // Validate inputs
        if (!config.searchApiKey || !config.searchEngineId) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        // Save configuration
        chrome.storage.sync.set(config, function() {
            showStatus('Configuration saved successfully!', 'success');
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 