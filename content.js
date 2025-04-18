// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedText") {
        const selectedText = window.getSelection().toString().trim();
        sendResponse({ text: selectedText });
    }
    return true;
});

// Create context menu for selected text
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "researchSelectedText",
        title: "Research selected text",
        contexts: ["selection"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "researchSelectedText") {
        chrome.tabs.sendMessage(tab.id, {
            action: "researchText",
            text: info.selectionText
        });
    }
}); 