const CONCEPT_MAP_SERVER = 'http://127.0.0.1:5000'
let loadedMap = null;
let parsedMap = null;
let mapKeys = null;
let relatedMap = null;

checkStorage();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    //response from service worker when a map was retreived from indexedDB correctly
    if (request.message === 'get_success') {
        if (request.payload) {
            loadedMap = request.payload;
            relatedMap = null;

            chrome.storage.local.set({ "loadedMap": loadedMap });
            document.getElementById("loadedMap").innerText = loadedMap.name + ".json";
            document.getElementById("feedback").innerText = "successfully loaded Map: " + loadedMap.name;
        }
    }
    //response form service worker when indexedDB keys were retreived correctly
    else if (request.message === 'get_keys_success') {
        if (request.payload) {
            mapKeys = request.payload;

            let dropdownMenu = document.getElementById("dropdownCont");

            dropdownMenu.innerHTML = '';

            for (let i = 0; i < mapKeys.length; i++) {
                let link = document.createElement("a");
                link.textContent = mapKeys[i];
                link.id = "map" + mapKeys[i];
                link.classList.toggle("menuItem");
                dropdownMenu.appendChild(link);
            }
        }
    }

    else if(request.message === 'update_success'){
        if(request.payload){
            console.log("i shouldhave updated");
            loadMap(loadedMap.name);
        }
    }
})


//handle concept map loading dropdown
document.getElementById("dropbtn").addEventListener('click', event => {
    console.log("getting keys");
    event.preventDefault();

    //get all keys from indexedDb
    chrome.runtime.sendMessage({
        message: 'get_keys'
    });

    //show available maps to load
    document.getElementById("dropdownCont").classList.toggle("show");

})

//load a map from indexedDB when its name is clicked
document.getElementById("dropdownCont").addEventListener('click', function (event) {
    let option = event.target.innerText;
    loadMap(option);
})

//request service worker to load a map
function loadMap(name) {
    console.log("loading concept Map '" + name + "'");
    chrome.runtime.sendMessage({
        message: 'get',
        payload: name
    });
}

//hide dropdown options when anything elese is clicked
window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

//display only concepts that relate to concepts in the loaded Map
//highlight interesting
document.getElementById("showInteresting").addEventListener('click', () => {
    console.log("showing potentially interesting concepts");
    if(relatedMap){
        highlightRelevant();
        listConcepts(relatedMap);
        document.getElementById("concept_header").innerText ="Concepts related to loaded Map:";
    } else if (loadedMap && parsedMap) {
        listConcepts(relatedMap = findRelatedConcepts());
        document.getElementById("concept_header").innerText ="Concepts related to loaded Map:";
    } else {
        document.getElementById("feedback").innerText = "cannot perform this action";
    }
})

//display all concepts from the parsed text
document.getElementById("showAll").addEventListener('click', () => {
    console.log("showing all concepts from text");
    if(parsedMap){
        listConcepts(parsedMap);
        document.getElementById("concept_header").innerText = "All Concepts from Text:";
    } else {
        document.getElementById("feedback").innerText = "something went wrong";
    }
})



//get the contents of all p elements form a website and let the backend analyse
//if a map is loaded, immediately highlight and display all related concepts
//if not, display all concepts extracted from the text
document.getElementById("parseBtn").addEventListener('click', async () => {

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["scripts/parseText.js"]
    }, (result) => {
        chrome.storage.local.get("pelements", function(result) {
            if(result.pelements){

                let siteHTML = result.pelements.join(" ");

                document.getElementById("feedback").innerText = "waiting for server";

                let parse_request = parse_dom(siteHTML);

                parse_request.then(res => {
                    document.getElementById("feedback").innerText = "done";
                    parsedMap = res;

                    sortMapByOccurrence(parsedMap);

                    chrome.storage.local.set({ 'parsedMap': parsedMap });

/*                     chrome.scripting.executeScript({
                        target:{tabId: tab.id },
                        files: ["scripts/concept_aggregation.js"]
                    }); */

                    if(loadedMap){
                        relatedMap = findRelatedConcepts();
                        listConcepts(relatedMap);
                        document.getElementById("concept_header").style.display = "block";
                        document.getElementById("concept_header").innerText = "Concepts related to loaded Map:";
                        concept_list.classList.add("show");
                    } else {
                        listConcepts(parsedMap);
                        document.getElementById("concept_header").style.display = "block";
                        document.getElementById("concept_header").innerText = "All Concepts from Text:";
                        concept_list.classList.add("show");
                    }
                    chrome.storage.local.remove("pelements");
                })

            }else{
                console.log("something went wrong");
            }
        });
    })
})

//request the backend server to analyse a piece of HTML
async function parse_dom(dom) {
    console.log("waiting for server response")

    const response = await fetch(`${CONCEPT_MAP_SERVER}/api/text`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: dom })
    });
    const responseObject = await response.json();
    console.log(responseObject);


    return responseObject;
}




//identify all the concepts in the parsed Map that are already present in the loaded Map
//put them, and all other concepts they relate to (source or target) in a new Map of relevant concepts
function findRelatedConcepts() {
    let loadedConcepts = [];

    loadedMap.nodes.forEach(node => {
        loadedConcepts.push(node.label);
    })

    let edges = [];
    let nodes = [];
    let tempMap = { edges, nodes };


    let knownNodes = [];
    let knownLabels = [];

    for (const node of parsedMap.nodes) {
        for (const concept of loadedConcepts) {
            if (concept.toLowerCase() === node.data.label.toLowerCase()) {
                knownNodes.push(node.data.id);
                knownLabels.push(node.data.label);
                break;
            }
        }
    }

    chrome.storage.local.set({"knownKeywords": knownLabels})

    let relatedNodes = [];
    let relatedLabels = [];

    for (const nodeId of knownNodes) {
        for (const edge of parsedMap.edges) {
            if(edge.data.source === nodeId){
                relatedNodes.push(edge.data.target);
            }
            if(edge.data.target === nodeId){
                relatedNodes.push(edge.data.source);
            }
        }
    }
    

    for (const nodeId of knownNodes) {
        relatedNodes.unshift(nodeId);
    }

    let uniq = [...new Set(relatedNodes)];

    for (const nodeId of uniq) {
        for (const node of parsedMap.nodes) {
            if(nodeId === node.data.id){

                tempMap.nodes.push(node)
                relatedLabels.push(node.data.label);
                for (const edge of parsedMap.edges) {
                    if(edge.data.source === nodeId){
                        tempMap.edges.push(edge);
                    }
                }
                break;
            }
        }
    }

    const LabelsUniq = [...new Set(relatedLabels)];
    chrome.storage.local.set({"relatedKeywords": LabelsUniq});

    highlightRelevant();

    sortMapByOccurrence(tempMap);

    chrome.storage.local.set({'relatedMap': tempMap});
    return tempMap;

}

async function highlightRelevant(){
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["scripts/highlight_known.js"]
    }, (result) => {

    });
}


//list concepts on the popup screen
async function listConcepts(map) {
    let concept_list = document.getElementById("concept_list");
    let concepts = map.nodes;

    concept_list.innerHTML = "";

    if(map.nodes.length == 0){
        const el = document.createElement("li");
        el.innerText = "No known concepts";
        concept_list.appendChild(el);
    } else {
        console.log("i list concepts for ");
        console.log(map);
    
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
        let counter = 0;
        for(const concept of concepts){
            if(concept.data.is_pronoun){
                counter++;
                console.log(concept.data.label);
                continue;
            }
            let el = document.createElement("li");
            el.id = concept.data.id;
            el.innerText = concept.data.label;
            el.addEventListener('click', () => {
                listRelations(concept, map);
                chrome.storage.local.set({ 'highlight_keywords': [concept.data.label] });
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['scripts/highlight.js'],
                }, (result) => {

                })

                document.getElementById("feedback").innerText = "clicked on " + concept.data.id;
            })
            concept_list.appendChild(el);

        }
        console.log("i removed " + counter + " concepts from the output");
    }
    
}

//list the relations of a specific concept from a specific map
function listRelations(concept, map) {
    let relation_list = document.getElementById("relation_list");
    relation_list.innerHTML = "";
    let concept_relations = [];

    for (const edge of map.edges) {
        if (edge.data.source == concept.data.id) {
            concept_relations.push(edge);
        }
    }

    concept_relations.sort((a,b) => ((a.data.occurrence.start < b.data.occurrence.start) ? -1 : (b.data.occurrence.start < a.data.occurrence.start) ? 1 : 0))

    if (concept_relations.length == 0) {
        let el = document.createElement("li");
        el.innerText = "No relations";
        relation_list.appendChild(el);
    }
    else {
        for (const edge of concept_relations) {
            let el = document.createElement("li");
            let targetConcept = parsedMap.nodes.find(element => element.data.id == edge.data.target);
            el.innerText = edge.data.label + " ... " + targetConcept.data.label;
            relation_list.appendChild(el);
        }
    }

    document.getElementById("relation_header").style.display = "block";
    document.getElementById("relation_header").innerText = concept.data.label + " relations: ";
    relation_list.classList.add("show");
}

//check if there are maps already in storage
function checkStorage() {
    chrome.storage.local.get('loadedMap', function (result) {
        if (result.loadedMap) {
            loadedMap = result.loadedMap;
            document.getElementById("loadedMap").innerText = loadedMap.name + ".json";
            document.getElementById("feedback").innerText = ("Map '" + loadedMap.name + "' is still loaded");
            console.log(loadedMap);
        } else {
            console.log("no laoded map in storage");
        }
    })

    chrome.storage.local.get('parsedMap', function (result) {
        if (result.parsedMap) {
            parsedMap = result.parsedMap;
            console.log("retreived parsed map from storage");
            if(loadedMap){
                listConcepts(findRelatedConcepts());
                document.getElementById("concept_header").style.display = "block";
                document.getElementById("concept_header").innerText = "Concepts related to loaded Map:";
            } else {
                listConcepts(parsedMap);
                document.getElementById("concept_header").style.display = "block";
                document.getElementById("concept_header").innerText = "All Concepts from Text:";
            }
            concept_list.classList.add("show");
        } else {
            console.log("no parsed Map in storage");
        }
    })
}

//sort the concepts in an map based on number of occurrences
function sortMapByOccurrence(map){

    map.nodes.sort((a, b) => (a.data.occurrences.length > b.data.occurrences.length) ? -1 : ((b.data.occurrences.length > a.data.occurrences.length) ? 1 : 0))

}


//analyze text selection
document.getElementById("selectionBtn").addEventListener('click', async () => {

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    function getText() {
        return window.getSelection().toString();
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getText
    }, (result) => {
        let parse_request = analyse_selection(result[0].result);

        parse_request.then(res => {

            document.getElementById("feedback").innerText = "done";
            parsedMap = res;

            sortMapByOccurrence(parsedMap);

            chrome.storage.local.set({ 'parsedMap': parsedMap });

            if(loadedMap){
                relatedMap = findRelatedConcepts();
                listConcepts(relatedMap);
                document.getElementById("concept_header").style.display = "block";
                document.getElementById("concept_header").innerText = "Concepts related to loaded Map:";
                concept_list.classList.add("show");
            } else {
                listConcepts(parsedMap);
                document.getElementById("concept_header").style.display = "block";
                document.getElementById("concept_header").innerText = "All Concepts from selected Text:";
                concept_list.classList.add("show");
            }
        })
    })
});



//request the backend server to analyse the text for concepts and relations
async function analyse_selection(text) {
    const response = await fetch(`${CONCEPT_MAP_SERVER}/api/concepts`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    });
    console.log("i did a backend request");
    const responseObject = await response.json();
    console.log(responseObject);
    return responseObject;
}