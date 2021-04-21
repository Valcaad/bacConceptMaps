function clearMapsStorage(){
    chrome.storage.local.remove(["loadedMap", "parsedMap", "highlightKeyword", "pelements"]);
}

clearMapsStorage();