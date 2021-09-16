function clearMapsStorage(){
    chrome.storage.local.remove(["parsedMap", "highlight_keyword", "pelements", "knownKeywords","relatedMap","loadedMap","unknownConcepts"]);
}

clearMapsStorage();