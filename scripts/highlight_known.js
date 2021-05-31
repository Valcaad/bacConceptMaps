async function highlight_known() {

    let keywords_known;
    let keywords_related;
    let relatedMap;

    let instance = new Mark(document.body.querySelectorAll("P"));

    unmark(instance);

    await chrome.storage.local.get('relatedMap', function (result) {
        if (result.relatedMap) {
            relatedMap = result.relatedMap;
        }
    })

    /*     await chrome.storage.local.get('relatedKeywords', function (result){
            keywords_related = result.relatedKeywords;
    
            console.log(keywords_related);
    
            let options = {
                "acrossElements": true,
                "className": "related"
            }
    
            for (const keyword of keywords_related) {
                let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                instance.markRegExp(regex, options);
            }
        }) */

    await chrome.storage.local.get('knownKeywords', function (result) {
        keywords_known = result.knownKeywords;

        let options = {
            "acrossElements": true,
            "className": "known"
        }

        for (const keyword of keywords_known) {
            let regex = new RegExp(`\\b${keyword}\\b`, 'gi');

            instance.markRegExp(regex, options);
        }

        let elements = document.getElementsByClassName("known");

        for (let i = 0; i < elements.length; i++) {

            elements[i].addEventListener('mouseover', function () {
                let parent = elements[i].parentNode;

                while (parent.nodeName != "P") {
                    parent = parent.parentNode;
                }

                instance.unmark({ "className": "related" })

                removeCanvases();

                markRelations(elements[i], parent, relatedMap);
            })

            /*  let popup = document.createElement('div');
             popup.classList.add("popup_content");
 
             let concept = relatedMap.nodes.find(node => node.data.label.toLowerCase() === elements[i].innerText.toLowerCase());
 
             if (concept) {
                 let relations = relatedMap.edges.filter(edge => edge.data.source === concept.data.id);
 
                 let list = document.createElement('ul');
                 list.classList.add("relation_list");
                 list.style.marginLeft = "0px";
                 if (relations.length == 0) {
                     const li = document.createElement('li');
                     li.innerText = "No further relations";
                     list.appendChild(li);
                 } else {
                     for (const relation of relations) {
                         let li = document.createElement('li');
                         let target = relatedMap.nodes.find(node => node.data.id === relation.data.target)
                         let text = relation.data.label + " ... " + target.data.label;
                         li.innerText = text;
 
                         li.addEventListener('click', function () {
                             let payload = {
                                 relation, concept, target
                             }
 
                             chrome.runtime.sendMessage({
                                 message: 'update',
                                 payload: payload
                             });
                             alert("add '" + concept.data.label + " ... " + li.innerText + "' to Map");
                         })
                         list.appendChild(li);
 
 
                     }
                 }
 
 
                 popup.appendChild(list);
                 elements[i].appendChild(popup);
 
             } else {
                 continue;
             } */

        }
    })

}

function markRelations(known, parent, relatedMap) {
    let instance = new Mark(parent);

    let concept = relatedMap.nodes.find(node => node.data.label.toLowerCase() === known.innerText.toLowerCase());

    if (concept) {
        let relations = relatedMap.edges.filter(edge => edge.data.source === concept.data.id);

        if (relations.length !== 0) {
            let targets = [];
            for (const relation of relations) {
                let target = relatedMap.nodes.find(node => node.data.id === relation.data.target);

                targets.push(target);
            }


            let count = 0;
            for (const target of targets) {
                const options = {
                    "acrossElements": true,
                    "className": "related related_" + target.data.label
                }
                let regex = new RegExp(`\\b${target.data.label}\\b`, 'gi');
                instance.markRegExp(regex, options);

                const sourceRect = known.getBoundingClientRect();
                const targetElement = document.getElementsByClassName("related_" + target.data.label)[0];

                const relation = relations.find(edge => edge.data.target === target.data.id);



                if (targetElement) {

                    targetElement.addEventListener('click', function (event) {
                        event.preventDefault();
                        let payload = {
                            relation, concept, target
                        }

                        chrome.runtime.sendMessage({
                            message: 'update',
                            payload: payload
                        });
                        alert("add '" + concept.data.label + " ... " + relation.data.label + " ... " + target.data.label + "' to Map");

                        removeCanvases();
                    })

                    const targetRect = targetElement.getBoundingClientRect();
                    if (sourceRect.top <= targetRect.top) {
                        
                        const canvas = document.createElement("canvas");
                        canvas.style.zIndex = -1;
                        canvas.style.position = "absolute";
                        canvas.style.top = -20 + "px";
                        canvas.classList.add("canvas_line");

                        const ctx = canvas.getContext('2d');



                        if (sourceRect.right < targetRect.left) {
                            canvas.width = targetRect.left - sourceRect.right;
                            ctx.lineWidth = 4;
                            ctx.strokeStyle = 'pink';
                            //ctx.globalAlpha = 0.9;
                            ctx.beginPath();
                            ctx.moveTo(0, 30);
                            ctx.quadraticCurveTo(((targetRect.left + sourceRect.right) / 2) - sourceRect.right, count % 2 == 0 ? 15 : 45, targetRect.left - sourceRect.right, targetRect.top - sourceRect.top + 30)
                            //ctx.arcTo(((targetRect.left + sourceRect.right) / 2) - sourceRect.right, count % 2 == 0 ? 15 : 45, canvas.width, targetRect.top - sourceRect.top + 30, 10);
                            //ctx.lineTo(targetRect.left - sourceRect.right, targetRect.top - sourceRect.top + 30);
                            ctx.stroke();
                        } else {
                            canvas.width = sourceRect.left - targetRect.right;
                            ctx.lineWidth = 4;
                            ctx.strokeStyle = 'pink';
                            ctx.globalAlpha = 0.9;
                            canvas.style.left = - canvas.width + "px";
                            ctx.beginPath();
                            ctx.moveTo(canvas.width, 30);
                            ctx.quadraticCurveTo(((targetRect.right + sourceRect.left) / 2) - targetRect.right, count % 2 == 0 ? 15 : 45, 0, targetRect.top - sourceRect.top + 30, 10)
                            //ctx.arcTo(((targetRect.right + sourceRect.left) / 2) - targetRect.right, count % 2 == 0 ? 15 : 45, 0, targetRect.top - sourceRect.top + 30, 10);
                            //ctx.lineTo(0, targetRect.top - sourceRect.top + 30);
                            ctx.stroke();
                        }

                        known.appendChild(canvas);
                        //known.parentNode.insertBefore(canvas, known.nextSibling);
                        count++;
                    }
                }

            }
        }
    }

}

function removeCanvases() {
    let canvases = document.getElementsByClassName("canvas_line");

    if (canvases.length !== 0) {
        for (j = canvases.length - 1; j >= 0; j--) {
            canvases[j].parentNode.removeChild(canvases[j]);
        }
    }
}

function unmark(instance) {

    instance.unmark();

    let popups = document.getElementsByClassName('popup_content');
    for (i = popups.length - 1; i >= 0; i--) {
        popups[i].remove();
    }
}

highlight_known();