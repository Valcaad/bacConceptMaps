const CONCEPT_MAP_SERVER = 'http://127.0.0.1:5000'
let loadedMap = null;
let parsedMap = null;
let mapKeys = null;
let displayMap = null;
let show_loaded = true;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'insert_success') {
        document.getElementById("feedback").innerText = "text added";
    }

    else if (request.message === 'parse_success') {
        if (request.payload) {
            document.getElementById("feedback").innerText = request.payload
            parsedMap = request.payload;
            console.log(parsedMap)

        }
    }

    else if (request.message === 'get_success') {
        if (request.payload) {
            document.getElementById("feedback").innerText = request.payload.name + ': ' + request.payload.text
            loadedMap = request.payload;
            displayMap = loadedMap;


            show_loaded = true;
            listConcepts(displayMap);


            document.getElementById("concept_header").style.display = "block";
            document.getElementById("concept_header").innerText = "Loaded Map Concepts:"
            concept_list.classList.add("show");
            document.getElementById("loadedMap").innerText = loadedMap.name + ".json";
        }
    }

    else if (request.message === 'highlight_success') {
        if (request.payload) {
            document.getElementById("feedback").innerText = request.payload
        }
    }

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

            console.log(request.payload);
        }
    }
})

document.getElementById("showToggle").addEventListener('click', () => {
    show_loaded = !show_loaded;

    console.log("i tried to toggle");
    if (show_loaded){
        displayMap = loadedMap;
        document.getElementById("concept_header").innerText = "Loaded Map Concepts:"
    } else {
        displayMap = parsedMap;
        document.getElementById("concept_header").innerText = "Analysed Text Concepts:"
    }

    listConcepts(displayMap);
})

//save textselection to db
document.getElementById("addBtn").addEventListener('click', async() => {

    let [tab] = await chrome.tabs.query({active: true, currentWindow: true });

    function getText() {
        return window.getSelection().toString();
    }

    chrome.scripting.executeScript({
        target: {tabId: tab.id },
        function: getText
    }, (result) => {
        console.log("this -->>")
        console.log(result[0].result)
        let parse_request = analyse_selection(result[0].result);

        parse_request.then(res => {
            parsedMap = res;
            displayMap = parsedMap;
            console.log(res);
            listConcepts(displayMap);
        })
    })


    show_loaded = false;
    document.getElementById("concept_header").style.display = "block";
    document.getElementById("concept_header").innerText ="Analysed Text Concepts:"
    concept_list.classList.add("show");
});

async function analyse_selection(text) {
    console.log(text);
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

//parse DOM to text
document.getElementById("parseBtn").addEventListener('click', async() => {

    let [tab] = await chrome.tabs.query({active: true, currentWindow: true });

    function getDOM() {
       return document.body.innerHTML;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id},
        function: getDOM
    }, (result) => {
        let parse_request = parse_dom(result[0].result);

        parse_request.then(res => {
            parsedMap = res;
            displayMap = parsedMap;
            console.log(res);
            listConcepts(displayMap);
        })
    })
})


async function parse_dom(dom) {
    console.log("i am in the parse function");
    console.log(dom);
    const response = await fetch(`${CONCEPT_MAP_SERVER}/api/text`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: dom })
    });
    console.log("i did a backend request");
    const responseObject = await response.json();
    console.log(responseObject);

    return responseObject;
}



//highlight all concepts
document.getElementById("highlightBtn").addEventListener('click', event => {
    event.preventDefault();

    if (parsedMap) {
        chrome.runtime.sendMessage({
            message: 'highlight',
            payload: parsedMap.nodes
        });
    }

});



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

document.getElementById("dropdownCont").addEventListener('click', function (event) {
    let option = event.target.innerText;
    loadMap(option);
})


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

function listConcepts(map) {
    let concept_list = document.getElementById("concept_list");
    let concepts = map.nodes;
    console.log("i list concepts for ");
    console.log(map);

    concept_list.innerHTML = "";

    concepts.forEach(concept => {
        let el = document.createElement("li");
        el.id = concept.data.id;
        el.innerText = concept.data.label;
        el.addEventListener('click', (event) => {
            listRelations(concept);
            document.getElementById("feedback").innerText = "clicked on " + concept.data.id;
        })
        concept_list.appendChild(el);
    });
}

function listRelations(concept) {
    let relation_list = document.getElementById("relation_list");
    relation_list.innerHTML = "";
    let edges = displayMap.edges;
    let concept_relations = [];

    edges.forEach(edge => {
        if (edge.data.source == concept.data.id) {
            concept_relations.push(edge);
        }
    })

    if (concept_relations.length == 0) {
        let el = document.createElement("p");
        el.innerText = "No relations";
        relation_list.appendChild(el);
    }
    else {
        concept_relations.forEach(edge => {
            let el = document.createElement("li");
            let targetConcept = displayMap.nodes.find(element => element.data.id == edge.data.target);
            el.innerText = edge.data.label + " ... " + targetConcept.data.label;
            relation_list.appendChild(el);
        })
    }

    let relation_header = document.getElementById("relation_header").style.display = "block";
    document.getElementById("relation_header").innerText = concept.data.label + " relations: ";
    relation_list.classList.add("show");
    console.log(concept_relations);

}
