let loadedMap = null;
let parsedMap = null;
let mapKeys = null;

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
            console.log(loadedMap);

            let concept_list = document.getElementById("concept_list");
            let concepts = loadedMap.nodes;

            console.log(concepts);

            concepts.forEach(concept => {
                let el = document.createElement("li");
                el.id = concept.data.id;
                el.innerText = concept.data.label;
                el.addEventListener('click', (event) => {
                    listRelations(concept);
                    document.getElementById("feedback").innerText = "clicked on" + concept.data.id;
                })
                concept_list.appendChild(el);
            });

            document.getElementById("concept_header").style.display = "block";
            concept_list.classList.toggle("show");
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

//save textselection to db
document.getElementById("addBtn").addEventListener('click', () => {

    function getText() {
        return window.getSelection().toString();
    }
    chrome.tabs.executeScript({
        code: '(' + getText + ')();'
    }, (result) => {
        chrome.runtime.sendMessage({
            message: 'insert',
            payload: [{
                "name": "elefanten",
                "text": result.toString()
            }]
        })
    });
});

//parse DOM to text
document.getElementById("parseBtn").addEventListener('click', () => {

    function getDOM() {
        return document.body.innerHTML;
    }
    chrome.tabs.executeScript({
        code: '(' + getDOM + ')();'
    }, (result) => {
        chrome.runtime.sendMessage({
            message: 'parse',
            payload: result.toString()
        })
    })
})

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

function listRelations(concept) {
    let relation_list = document.getElementById("relation_list");
    let edges = loadedMap.edges;
    let concept_relations = [];

    edges.forEach(edge =>{
        if(edge.data.source == concept.data.id){
            concept_relations.push(edge);
        }
    })

    concept_relations.forEach(edge =>{
        let el = document.createElement("li");
        el.innerText = edge.data.label;
        relation_list.appendChild(el);
    })

    console.log(concept_relations);

}
