let db = null;
let stock = [{ "name": "games", "edges": [{ "label": "received", "source": "0", "target": "1" }], "nodes": [{ "id": "0", "label": "Candleman" }, { "id": "1", "label": "positive reviews" }] }]
chrome.runtime.onInstalled.addListener(() => {
    create_database();

    chrome.storage.local.set({ "CONCEPT_MAP_SERVER": 'http://127.0.0.1:5000' })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    //retreive a certain Map from the Database
    if (request.message === 'get') {
        let get_request = get_record(request.payload);

        get_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'get_success',
                payload: res
            });
        });
    }

    //retreive all keys from the Database
    else if (request.message === 'get_keys') {
        console.log("trying to get keys");
        let get_keys_request = get_keys();

        get_keys_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'get_keys_success',
                payload: res
            });
        });


    }
    //insert a new Map into the Database
    else if (request.message === 'create') {

        let name = request.payload;
        let newMap = [{
            "name": name,
            "edges": [],
            "nodes": []
        }]
        let insert_request = insert_records(newMap);

        insert_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'create_success',
                payload: res
            });
        });


    }
    //update an item in the Database
    else if (request.message === 'update') {
        let update_request = update_record(request.payload);

        update_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'update_success',
                payload: res
            });
        });

    }
    //delete an item from the Database
    else if (request.message === 'delete') {
        let delete_request = delete_record(request.payload);

        delete_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'delete_success',
                payload: res
            });
        });
    }
});

function create_database() {
    const request = indexedDB.open('ConceptMapDB');
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
        insert_records(stock);
        db.onerror = function (event) {
            console.log("FAILED TO OPEN DB.")
        }
    }
}

//insert an array of new records into the indexedDB
function insert_records(records) {

    return new Promise(function (resolve) {
        const request = indexedDB.open('ConceptMapDB');
        request.onerror = function (event) {
            console.log("Problem opening DB.");
        }
        request.onupgradeneeded = function (event) {
            db = event.target.result;
        }
        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("DB opened");

            const insert_transaction = db.transaction("conceptMaps",
                "readwrite");
            const objectStore = insert_transaction.objectStore("conceptMaps");

            insert_transaction.oncomplete = function () {
                console.log("ALL INSERT TRANSACTIONS COMPLETE.");
                return resolve(true);
            }
            insert_transaction.onerror = function () {
                console.log("PROBLEM INSERTING RECORDS.")
                return resolve(false);
            }
            records.forEach(conceptMap => {
                let request = objectStore.add(conceptMap);
                request.onsuccess = function () {
                    console.log("Added: ", conceptMap);
                }
            });

            db.onerror = function (event) {
                console.log("FAILED TO OPEN DB.")
            }
        }
    })
}

//retreive a specific item from indexedDB
function get_record(name) {

    return new Promise(function (resolve) {
        const request = indexedDB.open('ConceptMapDB');
        request.onerror = function (event) {
            console.log("Problem opening DB.");
        }
        request.onupgradeneeded = function (event) {
            db = event.target.result;
        }
        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("DB opened");

            const get_transaction = db.transaction("conceptMaps", "readonly");
            const objectStore = get_transaction.objectStore("conceptMaps");

            get_transaction.oncomplete = function () {
                console.log("ALL GET TRANSACTIONS COMPLETE.");
            }
            get_transaction.onerror = function () {
                console.log("PROBLEM GETTING RECORDS.")
            }
            let request = objectStore.get(name);
            request.onsuccess = function (event) {
                return resolve(event.target.result);
            }

            db.onerror = function (event) {
                console.log("FAILED TO OPEN DB.")
            }
        }
    })
}

//return all available keys in the concept Map indexedDB
function get_keys() {

    return new Promise(function (resolve) {
        const request = indexedDB.open('ConceptMapDB');
        request.onerror = function (event) {
            console.log("Problem opening DB.");
        }
        request.onupgradeneeded = function (event) {
            db = event.target.result;
        }
        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("DB opened");

            const get_keys_transaction = db.transaction("conceptMaps", "readonly");
            const objectStore = get_keys_transaction.objectStore("conceptMaps");

            get_keys_transaction.oncomplete = function () {
                console.log("GET KEYS TRANSACTIONS COMPLETE.");
            }
            get_keys_transaction.onerror = function () {
                console.log("PROBLEM GETTING KEYS.")
            }

            let request = objectStore.getAllKeys();
            request.onsuccess = function (event) {
                return resolve(event.target.result);
            }

            db.onerror = function (event) {
                console.log("FAILED TO OPEN DB.")
            }
        }
    })
}

//update the given item in the concept map database
function update_record(item) {
    let loadedMap;

    return new Promise(function (resolve) {
        chrome.storage.local.get('loadedMap', function (result) {
            if (result.loadedMap) {
                loadedMap = result.loadedMap;

                loadedMap = putItem(loadedMap, item);

                const request = indexedDB.open('ConceptMapDB');
                request.onerror = function (event) {
                    console.log("Problem opening DB.");
                }
                request.onupgradeneeded = function (event) {
                    db = event.target.result;
                }
                request.onsuccess = function (event) {
                    db = event.target.result;
                    console.log("DB opened");

                    const update_transaction = db.transaction("conceptMaps",
                        "readwrite");
                    const objectStore = update_transaction.objectStore("conceptMaps");

                    update_transaction.oncomplete = function () {
                        console.log("ALL UPDATE TRANSACTIONS COMPLETE.");
                        chrome.storage.local.set({ "loadedMap": loadedMap });
                        return resolve(true);
                    }
                    update_transaction.onerror = function () {
                        console.log("PROBLEM UPDATING RECORDS.")
                        return resolve(false);
                    }
                    objectStore.put(loadedMap);
                    db.onerror = function (event) {
                        console.log("FAILED TO OPEN DB.")
                    }
                }
            }
        })

    })

}

function putItem(loadedMap, item) {
    let node;

    if (item.relation !== undefined && item.target !== undefined) {
        let edge = { "label": item.relation.data.label, "source": item.relation.data.source, "target": item.relation.data.target };

        if (node = loadedMap.nodes.find(node => node.label === item.concept.data.label)) {
            edge.source = node.id;
        } else {
            loadedMap.nodes.push({ "id": item.concept.data.id, "label": item.concept.data.label });
        }
        if (node = loadedMap.nodes.find(node => node.label === item.target.data.label)) {
            edge.target = node.id;
        } else {
            loadedMap.nodes.push({ "id": item.target.data.id, "label": item.target.data.label });
        }


        loadedMap.edges.push(edge);
    } else {
        if (loadedMap.nodes.find(node => node.label === item.concept.data.label)) {
            
        } else {
            loadedMap.nodes.push({ "id": item.concept.data.id, "label": item.concept.data.label });
        }
    }

    return loadedMap;
}