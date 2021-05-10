function clearMapsStorage(){
    chrome.storage.local.remove(["parsedMap", "highlightKeyword", "pelements"]);
}

clearMapsStorage();