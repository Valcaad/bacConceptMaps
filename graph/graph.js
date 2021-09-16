chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    //response from service worker when a map was retreived from indexedDB correctly
    if (request.message === 'delete_success') {
        if (request.payload) {
            console.log("item removed");
        }
    }
})


async function drawGraph() {

    let loadedMap;
    let evtTarget;
    let cy;
    let layoutOptions = {
        name: 'cola', 
        nodeSpacing: function(node) {return 20;},
        edgeLength: 155,
        handleDisconnected: true
    }

    await chrome.storage.local.get('loadedMap', function (result) {
        if (result.loadedMap) {
            loadedMap = result.loadedMap;

            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: [],
                layout: {
                    'name': 'grid'
                },
                style: [
                    {
                        selector: 'node',
                        style: {
                            shape: 'ellipse',
                            'background-color': '#9869c2',
                            label: 'data(label)',
                            'text-valign': 'center',
                            width: 'label',
                            height: 'label',
                            color: 'white',
                            'text-wrap': 'wrap',
                            'text-max-width': '150 px',
                            'padding': '15px',
                            'border-width': '1px',
                            'border-color': 'black'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'label': edge => edge.data('label') ? `\u2060\n${edge.data('label')}\n\u2060` : '',
                            'curve-style': 'bezier',
                            'target-arrow-shape': 'triangle',
                            'target-endpoint': 'outside-to-node-or-label',
                            'text-rotation': 'autorotate',

                        }
                    }
                ]

            })

            for (let i = 0; i < loadedMap.nodes.length; i++) {
                cy.add({
                    data: {
                        id: loadedMap.nodes[i].id,
                        'label': loadedMap.nodes[i].label
                    }
                })
            }

            for (let i = 0; i < loadedMap.edges.length; i++) {
                cy.add({
                    data: {
                        id: 'edge' + i,
                        source: loadedMap.edges[i].source,
                        target: loadedMap.edges[i].target,
                        'label': loadedMap.edges[i].label,
                        'url': loadedMap.edges[i].url,
                        'sourceText': loadedMap.edges[i].sourceText
                    }
                })
            }

            cy.layout(layoutOptions).run();

            cy.on('tap', function (evt) {
                evtTarget = evt.target;
                if (evtTarget === cy) {
                    let deleteContainer = document.getElementById("deleteContainer");
                    deleteContainer.style.visibility = 'hidden';
                } else if (evtTarget.isNode()) {
                    let deleteContainer = document.getElementById("deleteContainer");
                    deleteContainer.style.visibility = 'visible';
                    let descriptorText = document.getElementById("descriptor");
                    descriptorText.innerText = "Concept: ";
                    let deleteText = document.getElementById("deleteText");
                    deleteText.innerText = evtTarget.data('label');
                } else if (evtTarget.isEdge()) {
                    console.log("edge");
                    let deleteContainer = document.getElementById("deleteContainer");
                    deleteContainer.style.visibility = 'visible';
                    let descriptorText = document.getElementById("descriptor");
                    descriptorText.innerText = "Relation: ";
                    let deleteText = document.getElementById("deleteText");
                    deleteText.innerHTML = "<p class='text'>" + evtTarget.source().data('label') +"</p> <p id='relationLabel' class='text'>" + evtTarget.data('label') + "</p> <p class='text'>" + evtTarget.target().data('label') + "</p>";
                }

            })

            cy.on('mouseover', 'edge', function (event) {
                let edge = event.target;
                const tooltip = document.getElementById('tooltip');
                tooltip.style.visibility = 'visible';
                tooltip.style.left = (event.renderedPosition.x - 150) + "px";
                tooltip.style.top = (event.renderedPosition.y) + "px";
                if (edge.data('url')) {
                    tooltip.innerText = edge.data('sourceText') + '\n\n' + 'Source: ' + edge.data('url');
                } else {
                    tooltip.innerText = "No source available";
                }

            })

            cy.on('mouseout', 'edge', function (event) {
                document.getElementById('tooltip').style.visibility = 'hidden';
            })

            const menu = document.getElementById('mapName');
            menu.innerText = "Map: " + loadedMap.name;

        }
    })

    document.getElementById("conceptCreator").addEventListener('click', () => {
        document.getElementById("createRelationContainer").style.visibility = "hidden";
        document.getElementById("createConceptContainer").style.visibility = "visible";
    })

    document.getElementById("relationCreator").addEventListener('click', () => {
        document.getElementById("createConceptContainer").style.visibility = "hidden";
        document.getElementById("createRelationContainer").style.visibility = "visible";
    })

    window.onclick = function (event) {
        if (!event.target.matches('.newContents') && !event.target.matches('.newContentBtn') && !event.target.matches('.newContentText')) {
            document.getElementById("createConceptContainer").style.visibility = "hidden";
            document.getElementById("createRelationContainer").style.visibility = "hidden";
        }
    }

    document.getElementById("submitConceptCreation").addEventListener('click', () => {

        let text = document.getElementById("newConceptName").value;
        if (!text) {
            alert("You need to enter a name");
        } else {
            let concept = {
                'data': {
                    'id': generateID(),
                    'label': text
                }
            }
            let payload = { undefined, concept, undefined, undefined, undefined };
            chrome.runtime.sendMessage({
                message: 'add',
                payload: payload
            });

            cy.add({
                data: {
                    id: concept.data.id,
                    'label': concept.data.label,
                },
                renderedPosition: {
                    x: window.innerWidth/2,
                    y: window.innerHeight/2
                }
            })

           
            document.getElementById("newConceptName").value = "";
        }

        //submit new concept
        document.getElementById("createConceptContainer").style.visibility = "hidden";
    })

    document.getElementById("submitRelationCreation").addEventListener('click', () => {

        let sourceName = document.getElementById("newRelationSource").value;
        let label = document.getElementById("newRelationLabel").value;
        let targetName = document.getElementById("newRelationTarget").value;

        if (!sourceName || !label || !targetName) {
            alert("All fields need to be filled");
        } else {
            const concept = {
                'data': {
                    'id': generateID(),
                    'label': sourceName
                }
            }

            const target = {
                'data': {
                    'id': generateID(),
                    'label': targetName
                }
            }

            const relation = {
                'data': {
                    'source': concept.data.id,
                    'label': label,
                    'target': target.data.id
                }
            }

            const url = 'unknown'
            const sourceText = 'This Relation has been manually added.'
            let payload = { relation, concept, target, url, sourceText };
            chrome.runtime.sendMessage({
                message: 'add',
                payload: payload
            });

            let sourceExist = isInGraph(concept.data.label);
            if (!sourceExist) {
                cy.add({
                    data: {
                        id: concept.data.id,
                        'label': concept.data.label
                    },
                    renderedPosition: {
                        x: window.innerWidth*0.45,
                        y: window.innerHeight/2
                    }
                })
            } else {
                concept.data.id = sourceExist._private.data.id;
            }

            let targetExist = isInGraph(target.data.label);
            if (!targetExist) {
                cy.add({
                    data: {
                        id: target.data.id,
                        'label': target.data.label
                    },
                    renderedPosition: {
                        x: window.innerWidth*0.65,
                        y: window.innerHeight/2
                    }
                })
            } else {
                target.data.id = targetExist._private.data.id;
            }
            cy.add({
                data: {
                    id: 'edge' + (cy.elements().edges().length + 1),
                    source: concept.data.id,
                    target: target.data.id,
                    'label': relation.data.label,
                    'url': url,
                    'sourceText': sourceText
                }
            })

            document.getElementById("newRelationSource").value = "";
            document.getElementById("newRelationLabel").value = "";
            document.getElementById("newRelationTarget").value = "";
        }
        //submit new Relation
        document.getElementById("createRelationContainer").style.visibility = "hidden";
    })

    function isInGraph(name) {
        for (const node of cy.elements().nodes()) {
            if (node._private.data.label == name) {
                return node;
            }
        }
        return false;
    }

    document.getElementById("deleteBtn").addEventListener('click', () => {

        if (evtTarget.isNode()) {
            console.log("delete node: " + evtTarget.data('label'));
            chrome.runtime.sendMessage({
                message: 'delete',
                payload: {
                    'type': 'node',
                    'data': loadedMap.nodes.find(node => node.id === evtTarget.data('id'))
                }
            });
            cy.remove(evtTarget);
        } else if (evtTarget.isEdge()) {
            console.log("delete edge: " + loadedMap.nodes.find(node => node.id === evtTarget.data('source')).label + " " + evtTarget.data('label') + " " + loadedMap.nodes.find(node => node.id === evtTarget.data('target')).label);
            chrome.runtime.sendMessage({
                message: 'delete',
                payload: {
                    'type': 'edge',
                    'data': loadedMap.edges.find(edge => edge.label === evtTarget.data('label') && edge.source === evtTarget.data('source') && edge.target === evtTarget.data('target'))
                }
            })
            cy.remove(evtTarget);
        }

        evtTarget = undefined;
        let deleteContainer = document.getElementById("deleteContainer");
        deleteContainer.style.visibility = 'hidden';

    })

    document.getElementById("editBtn").addEventListener('click', () => {
        let labelBox = document.getElementById("deleteText");

        if (evtTarget.isNode()) {
            let oldLabel = labelBox.innerText;
            labelBox.innerHTML = "<textarea id='editLabel' placeholder = '" + oldLabel + "'>"+ oldLabel + "</textarea><button id='saveEditBtn'>save</button>";
            document.getElementById("saveEditBtn").addEventListener('click', () => {
                const newLabel = document.getElementById("editLabel").value;
                chrome.runtime.sendMessage({
                    message: 'update',
                    payload: {
                        'type': 'node',
                        'data': {
                            'id': evtTarget.data('id'),
                            'newLabel': newLabel
                        }
                    }
                })

                evtTarget.data('label', newLabel);

                labelBox.innerHTML = "<p class='text'>" + evtTarget.data('label') + "</p>";
            })
        } else if (evtTarget.isEdge()){
            const oldLabel = document.getElementById("relationLabel").innerText;
            labelBox.innerHTML = "<p>" + evtTarget.source().data('label') + "</p> <textarea id='editLabel' placeholder ='" + oldLabel + "'>"+ oldLabel +"</textarea><button id='saveEditBtn'>save</button><p>"+ evtTarget.target().data('label') + "</p>";

            document.getElementById("saveEditBtn").addEventListener('click', () => {
                const newLabel = document.getElementById("editLabel").value;
                chrome.runtime.sendMessage({
                    message: 'update',
                    payload: {
                        'type': 'edge',
                        'data': {
                            'source': evtTarget.source().data('id'),
                            'target': evtTarget.target().data('id'),
                            'newLabel' : newLabel
                        }
                    }
                })
                evtTarget.data('label', newLabel);

                labelBox.innerHTML = "<p class='text'>" + evtTarget.source().data('label') +"</p> <p id='relationLabel' class='text'>" + evtTarget.data('label') + "</p> <p class='text'>" + evtTarget.target().data('label') + "</p>";
            })
        }


    })
    
    document.getElementById("fitMap").addEventListener('click', () => {
        cy.fit();
    })
}




function generateID(a) { return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, generateID) }

drawGraph();
