async function drawGraph(){

    let loadedMap;

    await chrome.storage.local.get('loadedMap', function(result){
        if (result.loadedMap){
            loadedMap = result.loadedMap;

            let cy = cytoscape({
                container: document.getElementById('cy'),
                elements: [],
                layout: {
                    'name': 'grid'
                },
                style: [
                            {
                                selector: 'node',
                                style: {
                                    shape: 'hexagon',
                                    'background-color': 'red',
                                    label: 'data(label)'
                                }
                            },
                            {
                                selector: 'edge',
                                style: {
                                    label: 'data(label)'
                                }
                            }
                        ]

            })

            for (let i = 0; i < loadedMap.nodes.length; i++){
                cy.add({
                    data: {id: loadedMap.nodes[i].id,
                    'label': loadedMap.nodes[i].label}
                })
            }

            for (let i = 0; i < loadedMap.edges.length; i++){
                cy.add({
                    data: {
                        id:'edge' + i,
                        source: loadedMap.edges[i].source,
                        target: loadedMap.edges[i].target,
                        'label': loadedMap.edges[i].label
                    }
                })
            }

            cy.layout({
                name:'cose'
            }).run();
        }
    })
}

drawGraph();




// let cy = cytoscape({
//     container: document.getElementById('cy'),
//     elements: [
//         // nodes
//         { data: { id: 'a' } },
//         { data: { id: 'b' } },
//         { data: { id: 'c' } },
//         { data: { id: 'd' } },
//         { data: { id: 'e' } },
//         { data: { id: 'f' } },
//         // edges
//         {
//             data: {
//                 id: 'ab',
//                 source: 'a',
//                 target: 'b'
//             }
//         },
//         {
//             data: {
//                 id: 'cd',
//                 source: 'c',
//                 target: 'd'
//             }
//         },
//         {
//             data: {
//                 id: 'ef',
//                 source: 'e',
//                 target: 'f'
//             }
//         },
//         {
//             data: {
//                 id: 'ac',
//                 source: 'a',
//                 target: 'c'
//             }
//         },
//         {
//             data: {
//                 id: 'be',
//                 source: 'b',
//                 target: 'e'
//             }
//         }
//     ],
//     layout: {
//         name: 'grid'
//     },
//     style: [
//         {
//             selector: 'node',
//             style: {
//                 shape: 'hexagon',
//                 'background-color': 'red',
//                 label: 'data(id)'
//             }
//         }
//     ]
// });