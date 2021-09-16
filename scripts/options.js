
document.getElementById("clearBtn").addEventListener('click', () => {
    clearStorage();
})

function clearStorage(){
    console.log("i got called");
    chrome.storage.local.remove(["parsedMap", "highlight_keywords", "pelements", "knownKeywords","relatedMap","loadedMap","unknownConcepts"]);
}