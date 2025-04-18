document.addEventListener('DOMContentLoaded', function() {
    const huggingfaceToken = document.getElementById('huggingfaceToken');
    const searchApiKey = document.getElementById('searchApiKey');
    const searchEngineId = document.getElementById('searchEngineId');
    const saveButton = document.getElementById('saveButton');
    const status = document.getElementById('status');

    // Load existing settings
    chrome.storage.sync.get(['huggingfaceToken', 'searchApiKey', 'searchEngineId'], function(result) {
        if (result.huggingfaceToken) huggingfaceToken.value = result.huggingfaceToken;
        if (result.searchApiKey) searchApiKey.value = result.searchApiKey;
        if (result.searchEngineId) searchEngineId.value = result.searchEngineId;
    });

    saveButton.addEventListener('click', function() {
        const settings = {
            huggingfaceToken: huggingfaceToken.value.trim(),
            searchApiKey: searchApiKey.value.trim(),
            searchEngineId: searchEngineId.value.trim()
        };

        // Validate settings
        if (!settings.huggingfaceToken || !settings.searchApiKey || !settings.searchEngineId) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        // Save settings
        chrome.storage.sync.set(settings, function() {
            showStatus('Settings saved successfully!', 'success');
        });
    });

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status-message ${type}`;
        status.style.display = 'block';

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}); 