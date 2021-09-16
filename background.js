let db = null;
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
    //add an item to an existing Database
    else if (request.message === 'add') {
        let add_request = add_record(request.payload);

        add_request.then(res => {
            chrome.runtime.sendMessage({
                message: 'add_success',
                payload: res
            });
        });

    }
    //add an item to an existing Database
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
    else {
        console.log("unknown request: " + request.message);
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
        db.onerror = function (event) {
            console.log("FAILED TO OPEN DB.")
        }
    }
}

//insert an array of new records into the indexedDB
function insert_records(records) {

    let res = { "value": true, "text": "" }

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
                return resolve(res);
            }
            insert_transaction.onerror = function () {
                console.log("PROBLEM INSERTING RECORDS.")
                return resolve(false);
            }
            records.forEach(conceptMap => {
                let request = objectStore.add(conceptMap);
                request.onsuccess = function () {
                    console.log("Added: ", conceptMap);
                    res.text = conceptMap.name;
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
function add_record(item) {
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

                    const add_transaction = db.transaction("conceptMaps",
                        "readwrite");
                    const objectStore = add_transaction.objectStore("conceptMaps");

                    add_transaction.oncomplete = function () {
                        console.log("ALL ADD TRANSACTIONS COMPLETE.");
                        chrome.storage.local.set({ "loadedMap": loadedMap });
                        return resolve(true);
                    }
                    add_transaction.onerror = function () {
                        console.log("PROBLEM ADDING RECORDS.")
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

//put a new item in the selected map.
function putItem(loadedMap, item) {
    let node;

    if (item.relation !== undefined && item.target !== undefined) {
        let edge = { "label": item.relation.data.label, "source": item.relation.data.source, "target": item.relation.data.target, "url": item.url, "sourceText": item.sourceText };

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

        if (loadedMap.edges.find(relation => relation.label === edge.label && relation.source === edge.source && relation.target === edge.target)) {

        } else {
            loadedMap.edges.push(edge);
        }

    } else {
        if (loadedMap.nodes.find(node => node.label === item.concept.data.label)) {

        } else {
            loadedMap.nodes.push({ "id": item.concept.data.id, "label": item.concept.data.label });
        }
    }

    return loadedMap;
}

//update the given item in the concept map database
function update_record(item) {
    let loadedMap;

    return new Promise(function (resolve) {
        chrome.storage.local.get('loadedMap', function (result) {
            if (result.loadedMap) {
                loadedMap = result.loadedMap;

                loadedMap = updateItem(loadedMap, item);

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
                        console.log("ALL ADD TRANSACTIONS COMPLETE.");
                        chrome.storage.local.set({ "loadedMap": loadedMap });
                        return resolve(true);
                    }
                    update_transaction.onerror = function () {
                        console.log("PROBLEM ADDING RECORDS.")
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

function updateItem(loadedMap,item){
    if(item.type === 'node'){
        let candidate = loadedMap.nodes.find(node => node.id === item.data.id);
        if(candidate){
            candidate.label = item.data.newLabel;
        }
    } else if (item.type === 'edge') {
        let candidate = loadedMap.edges.find(edge => edge.source === item.data.source && edge.target === item.data.target);
        if(candidate){
            candidate.label = item.data.newLabel;
        }
    }
    return loadedMap;
}

function delete_record(item) {

    let loadedMap;

    return new Promise(function (resolve) {
        chrome.storage.local.get('loadedMap', function (result) {
            if (result.loadedMap) {
                loadedMap = result.loadedMap;

                loadedMap = removeItem(loadedMap, item);

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

                    const delete_transaction = db.transaction("conceptMaps",
                        "readwrite");
                    const objectStore = delete_transaction.objectStore("conceptMaps");

                    delete_transaction.oncomplete = function () {
                        console.log("ALL DELETE TRANSACTIONS COMPLETE.");
                        chrome.storage.local.set({ "loadedMap": loadedMap });
                        return resolve(true);
                    }
                    delete_transaction.onerror = function () {
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

function removeItem(loadedMap, item) {
    let type = item.type;
    let removeObject = item.data;

    if (type === 'edge') {

        for (let i = 0; i < loadedMap.edges.length; i++) {
            let edge = loadedMap.edges[i];
            if (edge.source === removeObject.source && edge.target === removeObject.target && edge.label === removeObject.label) {
                loadedMap.edges.splice(i, 1);
            }
        }

    } else if (type === 'node') {

        for (let i = 0; i < loadedMap.nodes.length; i++) {
            let node = loadedMap.nodes[i];
            if (node.id === removeObject.id && node.label === removeObject.label) {
                loadedMap.nodes.splice(i, 1);
            }
        }

        let j = 0;
        while (j < loadedMap.edges.length) {
            let edge = loadedMap.edges[j];
            if (edge.source === removeObject.id || edge.target === removeObject.id) {
                loadedMap.edges.splice(j, 1);
            } else {
                ++j;
            }
        }
    }

    return loadedMap;
}