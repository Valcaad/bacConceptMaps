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
                        'label': loadedMap.edges[i].label
                    }
                })
            }

            cy.layout({
                name: 'cola', nodeSpacing: function (node) { return 75; }
            }).run();

            cy.on('tap', function (evt) {
                evtTarget = evt.target;
                if(evtTarget === cy ){
                    let deleteContainer = document.getElementById("deleteContainer");
                    console.log("hidden");
                    deleteContainer.style.visibility = 'hidden';
                } else if (evtTarget.isNode()) {
                    let deleteContainer = document.getElementById("deleteContainer");
                    console.log("visible");
                    deleteContainer.style.visibility = 'visible';
                    let deleteText = document.getElementById("deleteText");
                    deleteText.innerText = "Do you want to delete " + evtTarget.data('label');
                } else if(evtTarget.isEdge()){
                    console.log("edge");
                    let deleteContainer = document.getElementById("deleteContainer");
                    deleteContainer.style.visibility = 'visible';
                    let deleteText = document.getElementById("deleteText");
                    deleteText.innerText = "Do you want to delete " + evtTarget.source().data('label') + " " + evtTarget.data('label') + " " + evtTarget.target().data('label');
                }

            })

        }
    })

    document.getElementById("deleteBtn").addEventListener('click', () => {

        if(evtTarget.isNode()){
            console.log("delete node: " + evtTarget.data('label'));
            chrome.runtime.sendMessage({
                message: 'delete',
                payload: {
                    'type': 'node',
                    'data': loadedMap.nodes.find(node => node.id === evtTarget.data('id'))
                }
            });
            cy.remove(evtTarget);
        } else if (evtTarget.isEdge()){
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

    })
}

drawGraph();
