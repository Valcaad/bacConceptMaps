const CONCEPT_MAP_SERVER = 'http://127.0.0.1:5000'

function highlight(keywords){
    let content = document.body.innerHTML;
    console.log("i try to transform content")
    document.body.innerHTML = transformContent(content, keywords)
    return "ok";                
}

function transformContent(content, keywords){
    let temp = content;

    keywords.forEach(keyword => {
        console.log("transforming keyword" + keyword)
        temp = temp.replace(new RegExp(keyword, 'ig'), wrapKeywordWithHTML(keyword))
    })

    return temp;
}

function wrapKeywordWithHTML(keyword){
    console.log("i did a wrapperino")
    return `<span style="background-color: yellow"> ${keyword} </span>`
}

function injectedFunction() {
    document.body.style.backgroundColor = 'orange';
  }


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //save something to Storage
    if (request.message === 'insert') {
        let insert_request = insert_records(request.payload);

        insert_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'insert_success',
                payload: res
            });
        });

        //retreive a certain Map from Storage
    } else if (request.message === 'get') {
        let get_request = get_record(request.payload);

        get_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'get_success',
                payload: res
            });
        });
    }
    //retreive all keys from Storage
    else if (request.message === 'get_keys') {
        let get_keys_request = get_keys();

        get_keys_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'get_keys_success',
                payload: res
            });
        });
    }
      //parse Website DOM
    else if (request.message === 'parse') {
        console.log("received parse request");
        let parse_request = parse_dom(request.payload);

        parse_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'parse_success',
                payload: res
            });
        });

    }
    //highlight the concepts from parsed DOM
    else if (request.message === 'highlight') {
        console.log("received highlight request");
        
        keywords = ['crat']
        let code = 'let temp = document.body.innerHTML; temp = temp.replace(new RegExp(crater, "ig"), `<span style="background-color: yellow"> crater </span>`); document.body.innerHTML =  temp'

        chrome.tabs.executeScript({
            code: code
        });



/*         let highlight_request = highlight_concepts(request.payload);

        highlight_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'highlight_success',
                payload: res
            });
        }); */
        //update an item in Storage
    } else if (request.message === 'update') {
        let update_request = update_record(request.payload);

        update_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'update_success',
                payload: res
            });
        });
        //delete an item from Storage
    } else if (request.message === 'delete') {
        let delete_request = delete_record(request.payload);

        delete_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'delete_success',
                payload: res
            });
        });
    }
});

let stock = [{"name": "elephant", "edges": [{"data": {"label": "are", "occurrence": {"end": 13, "start": 10}, "source": "a422faf5-3f6e-43ad-941f-50a9ae206913", "target": "4066b554-625f-499e-9c54-4016cb5187bb"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "271586a7-92cd-4e73-98d4-f423531c2d31", "target": "c9cfa13e-1a15-4137-91d4-a391ee47f94b"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "271586a7-92cd-4e73-98d4-f423531c2d31", "target": "1d894d30-0427-45cf-9f2b-a9dfe7656182"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "271586a7-92cd-4e73-98d4-f423531c2d31", "target": "87e3c110-2b56-40db-a605-32425d18fb68"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "271586a7-92cd-4e73-98d4-f423531c2d31", "target": "84aee94f-b3fc-4e0a-98c8-8b9de439ff85"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "7efaf1ff-6bba-4398-af41-28d45e592b6c", "target": "c9cfa13e-1a15-4137-91d4-a391ee47f94b"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "7efaf1ff-6bba-4398-af41-28d45e592b6c", "target": "1d894d30-0427-45cf-9f2b-a9dfe7656182"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "7efaf1ff-6bba-4398-af41-28d45e592b6c", "target": "87e3c110-2b56-40db-a605-32425d18fb68"}}, {"data": {"label": "are currently recognised", "occurrence": {"end": 87, "start": 63}, "source": "7efaf1ff-6bba-4398-af41-28d45e592b6c", "target": "84aee94f-b3fc-4e0a-98c8-8b9de439ff85"}}, {"data": {"label": "is", "occurrence": {"end": 184, "start": 182}, "source": "156ff1c6-e04d-4b9f-a61b-3776067ba870", "target": "910e4b1b-4f08-4265-96de-9eb52a2c3a53"}}, {"data": {"label": "surviving", "occurrence": {"end": 203, "start": 194}, "source": "910e4b1b-4f08-4265-96de-9eb52a2c3a53", "target": "8087f72d-ce7e-49a5-8a51-5b6a62a231a0"}}, {"data": {"label": "surviving", "occurrence": {"end": 203, "start": 194}, "source": "910e4b1b-4f08-4265-96de-9eb52a2c3a53", "target": "232168fe-355a-4406-a02f-e64269a53334"}}, {"data": {"label": "include", "occurrence": {"end": 260, "start": 253}, "source": "8087f72d-ce7e-49a5-8a51-5b6a62a231a0", "target": "5820d9f2-58aa-478a-89a4-211972c54bb7"}}, {"data": {"label": "include", "occurrence": {"end": 260, "start": 253}, "source": "0ed10b00-ddeb-49a2-92f1-6c09c67843cf", "target": "5820d9f2-58aa-478a-89a4-211972c54bb7"}}], "nodes": [{"data": {"cluster_id": "33c035ef-cbf9-4673-98c0-17e101650983", "id": "a422faf5-3f6e-43ad-941f-50a9ae206913", "is_named_entity": false, "is_pronoun": false, "label": "Elephants", "occurrences": [{"end": 9, "start": 0}]}}, {"data": {"cluster_id": "567aab88-94bc-4825-9e20-cae56b569951", "id": "4066b554-625f-499e-9c54-4016cb5187bb", "is_named_entity": false, "is_pronoun": false, "label": "the largest existing land animals", "occurrences": [{"end": 47, "start": 14}]}}, {"data": {"cluster_id": "ceff5c0e-23b5-4bf6-ba39-35ca292e7ecb", "id": "271586a7-92cd-4e73-98d4-f423531c2d31", "is_named_entity": false, "is_pronoun": false, "label": "Three species", "occurrences": [{"end": 62, "start": 49}]}}, {"data": {"cluster_id": "2c1958fb-1448-440e-b95b-1376af479119", "id": "87e3c110-2b56-40db-a605-32425d18fb68", "is_named_entity": false, "is_pronoun": false, "label": "the African bush elephant", "occurrences": [{"end": 114, "start": 89}]}}, {"data": {"cluster_id": "b548e97f-f004-401f-99d1-00540da1f6cd", "id": "630b3a01-baeb-4c2c-86fc-95083a894bcc", "is_named_entity": false, "is_pronoun": false, "label": "the African forest elephant", "occurrences": [{"end": 143, "start": 116}]}}, {"data": {"cluster_id": "73a576dd-ba92-48b8-9b67-3b1d30050beb", "id": "da4af695-f894-4a1e-afa8-ceb8df12da28", "is_named_entity": false, "is_pronoun": false, "label": "the Asian elephant", "occurrences": [{"end": 167, "start": 149}]}}, {"data": {"cluster_id": "138d1f6a-84b1-4e80-98c3-7888cc15fe54", "id": "156ff1c6-e04d-4b9f-a61b-3776067ba870", "is_named_entity": false, "is_pronoun": false, "label": "Elephantidae", "occurrences": [{"end": 181, "start": 169}]}}, {"data": {"cluster_id": "543679fc-4647-4599-a8a9-3165a0876ca3", "id": "910e4b1b-4f08-4265-96de-9eb52a2c3a53", "is_named_entity": false, "is_pronoun": false, "label": "the only surviving family", "occurrences": [{"end": 210, "start": 185}]}}, {"data": {"cluster_id": "5ad23fa9-4727-4b6d-b108-3de009fd3a52", "id": "232168fe-355a-4406-a02f-e64269a53334", "is_named_entity": false, "is_pronoun": false, "label": "the order", "occurrences": [{"end": 223, "start": 214}]}}, {"data": {"cluster_id": "c28951ac-0c75-428d-b532-6b92c530aa3c", "id": "8087f72d-ce7e-49a5-8a51-5b6a62a231a0", "is_named_entity": true, "is_pronoun": false, "label": "Proboscidea", "occurrences": [{"end": 235, "start": 224}]}}, {"data": {"cluster_id": "033c9799-c64a-4b05-b75a-91076375b6d4", "id": "0ed10b00-ddeb-49a2-92f1-6c09c67843cf", "is_named_entity": false, "is_pronoun": false, "label": "extinct members", "occurrences": [{"end": 252, "start": 237}]}}, {"data": {"cluster_id": "6b3c4e61-b085-4b9f-a9bb-ed68e8136df2", "id": "5820d9f2-58aa-478a-89a4-211972c54bb7", "is_named_entity": false, "is_pronoun": false, "label": "the mastodons", "occurrences": [{"end": 274, "start": 261}]}}, {"data": {"cluster_id": "3c8d6512-af49-41b4-b0ed-e61f12024776", "id": "7efaf1ff-6bba-4398-af41-28d45e592b6c", "is_named_entity": true, "is_pronoun": false, "label": "Three", "occurrences": [{"end": 54, "start": 49}]}}, {"data": {"cluster_id": "2344168c-65ea-4624-aec1-3da976d0b441", "id": "1d894d30-0427-45cf-9f2b-a9dfe7656182", "is_named_entity": true, "is_pronoun": false, "label": "African", "occurrences": [{"end": 100, "start": 93}]}}, {"data": {"cluster_id": "39732350-46cf-4a96-9392-75ea8d39a62b", "id": "c9cfa13e-1a15-4137-91d4-a391ee47f94b", "is_named_entity": true, "is_pronoun": false, "label": "African", "occurrences": [{"end": 127, "start": 120}]}}, {"data": {"cluster_id": "55a080c5-4dc1-4616-a102-453703f8c6d3", "id": "84aee94f-b3fc-4e0a-98c8-8b9de439ff85", "is_named_entity": true, "is_pronoun": false, "label": "Asian", "occurrences": [{"end": 158, "start": 153}]}}]}]

let db = null;
function create_database() {
    const request = window.indexedDB.open('ConceptMapDB');
    request.onerror = function (event) {
        console.log("Problem opening DB.");
    }
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        let objectStore = db.createObjectStore('conceptMaps', {
            keyPath: 'name'
        });
        objectStore.transaction.oncomplete = function (event) {
            console.log("ObjectStore Created.");
        }
    }
    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("DB OPENED.");
        //insert_records(stock);
        db.onerror = function (event) {
            console.log("FAILED TO OPEN DB.")
        }
    }
}

function insert_records(records) {
    if (db) {
        const insert_transaction = db.transaction("conceptMaps",
            "readwrite");
        const objectStore = insert_transaction.objectStore("conceptMaps");
        return new Promise((resolve, reject) => {
            insert_transaction.oncomplete = function () {
                console.log("ALL INSERT TRANSACTIONS COMPLETE.");
                resolve(true);
            }
            insert_transaction.onerror = function () {
                console.log("PROBLEM INSERTING RECORDS.")
                resolve(false);
            }
            records.forEach(conceptMap => {
                let request = objectStore.add(conceptMap);
                request.onsuccess = function () {
                    console.log("Added: ", conceptMap);
                }
            });
        });
    }
}

function get_record(name) {
    if (db) {
        const get_transaction = db.transaction("conceptMaps", "readonly");
        const objectStore = get_transaction.objectStore("conceptMaps");
        return new Promise((resolve, reject) => {
            get_transaction.oncomplete = function () {
                console.log("ALL GET TRANSACTIONS COMPLETE.");
            }
            get_transaction.onerror = function () {
                console.log("PROBLEM GETTING RECORDS.")
            }
            let request = objectStore.get(name);
            request.onsuccess = function (event) {
                resolve(event.target.result);
            }
        });
    }
}

function get_keys() {
    if (db) {
        const get_keys_transaction = db.transaction("conceptMaps", "readonly");
        const objectStore = get_keys_transaction.objectStore("conceptMaps");
        return new Promise((resolve, reject) => {
            get_keys_transaction.oncomplete = function () {
                console.log("GET KEYS TRANSACTIONS COMPLETE.");
            }
            get_keys_transaction.onerror = function () {
                console.log("PROBLEM GETTING KEYS.")
            }

            let request = objectStore.getAllKeys();
            request.onsuccess = function (event) {
                resolve(event.target.result);
            }
        });
    }
}

async function parse_dom(dom) {
    if (db) {
        console.log("i am in the parse function");
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
}

function highlight_concepts(nodes) {
    if (db) {

        return new Promise((resolve, reject) => {

            let code = ''

            function highlight(keywords){
                let content = document.body.innerHTML;
                console.log("i try to transform content")
                document.body.innerHTML = transformContent(content, keywords)
                return "ok";                
            }

            function transformContent(content, keywords){
                let temp = content;

                keywords.forEach(keyword => {
                    console.log("transforming keyword" + keyword)
                    temp = temp.replace(new RegExp(keyword, 'ig'), wrapKeywordWithHTML(keyword))
                })

                return temp;
            }

            function wrapKeywordWithHTML(keyword){
                console.log("i did a wrapperino")
                return `<span style="background-color: yellow"> ${keyword} </span>`
            }

            chrome.scripting.executeScript({
                function: highlight,
                arguments:['crater']
            }, (result) => {
                console.log(result);
                console.log("i tried to mark something");
                resolve(result);
            })

            
        })

    }
}

create_database();
