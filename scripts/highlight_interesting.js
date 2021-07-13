async function highlight_interesting() {
    let keywords_known;
    let relatedMap;
    let positionedParents = [];

    let instance = new Mark(document.body.querySelectorAll("P"));

    unmark(instance, undefined);
    removeCanvases();

    await chrome.storage.local.get('relatedMap', function (result) {
        if (result.relatedMap) {
            relatedMap = result.relatedMap;
        }
    })

    await chrome.storage.local.get('knownKeywords', function (result) {
        keywords_known = filterForUnrelated(result.knownKeywords, relatedMap);

        //highlight the relevant concepts
        for (const node of keywords_known) {

            const classLabel = node.data.label.replace(/ /g, "_").replace(/'/g, "");
            let options = {
                "acrossElements": true,
                "className": "known known_" + classLabel
            }
            let regex = new RegExp(`\\b${node.data.label}\\b`, 'gi');

            instance.markRegExp(regex, options);
        }

        let elements = document.getElementsByClassName("known");

        //add the mouseover event to highlight the concepts relations
        for (let i = 0; i < elements.length; i++) {

            elements[i].addEventListener('mouseover', function () {

               positionedParents = depositionParents(positionedParents);
                let parent = elements[i].parentNode;

                while (parent.nodeName != "P") {
                    parent = parent.parentNode;
                }

                parent.style.zIndex = 0;
                parent.style.position = "relative";

               positionedParents.push(parent);

                unmark(instance, { "className": "related" })

                removeCanvases();

                markRelations(elements[i], parent, relatedMap);

            })
        }
    })

}

//remove the concepts that do not have an outgoing relation
function filterForUnrelated(knownConcepts, relatedMap) {
    const conceptsWithRelation = [];

    relationCheck: for (const node of knownConcepts) {
        for (const edge of relatedMap.edges) {
            if (edge.data.source === node.data.id) {
                conceptsWithRelation.push(node);
                continue relationCheck;
            }
        }
    }

    return conceptsWithRelation;
}

function markRelations(known, parent, relatedMap) {
    let instance = new Mark(parent);

    let concept = relatedMap.nodes.find(node => node.data.label.toLowerCase() === known.innerText.toLowerCase());

    if (concept) {
        let relations = relatedMap.edges.filter(edge => edge.data.source === concept.data.id);

        //identify all the targets of the concept
        if (relations.length !== 0) {
            let targets = [];
            for (const relation of relations) {
                let target = relatedMap.nodes.find(node => node.data.id === relation.data.target);

                targets.push(target);
            }


            //highlight all the targets
            let count = 0;
            for (const target of targets) {
                const classLabel = target.data.label.replace(/ /g, "_").replace(/'/g, "");
                const options = {
                    "acrossElements": true,
                    "className": "related related_" + classLabel,
                    "exclude": [".popup_content", ".related"]
                }
                let regex = new RegExp(`\\b${target.data.label}\\b`, 'gi');
                instance.markRegExp(regex, options);

                const sourceRect = known.getBoundingClientRect();
                const targetElements = document.getElementsByClassName("related_" + classLabel);

                for (const targetElement of targetElements) {
                    let targetParent = targetElement.parentNode;
                    while (targetParent.nodeName != "P") {
                        targetParent = targetParent.parentNode;
                    }

                    if (targetParent === parent) {

                        const relation = relations.find(edge => edge.data.target === target.data.id);
                        const url = window.location.href;
                        const sourceText = parent.innerText;

                        const targetRect = targetElement.getBoundingClientRect();
                        if (sourceRect.top <= targetRect.top && !(sourceRect.top == targetRect.top && targetRect.right < sourceRect.left)) {


                            //request to add the relation, incl. source and target concept to the current map
                            targetElement.addEventListener('click', function (event) {
                                event.preventDefault();
                                event.stopPropagation();
                                let payload = {
                                    relation, concept, target, url, sourceText
                                }

                                chrome.runtime.sendMessage({
                                    message: 'update',
                                    payload: payload
                                });
                                alert("add '" + concept.data.label + " ... " + relation.data.label + " ... " + target.data.label + "' to Map");

                                removeCanvases();
                            })

                            targetElement.addEventListener('mouseover', function (event) {
                                event.preventDefault();
                                event.stopPropagation();
                            })

                            //add the tooltip for adding the relation
                            const popup = document.createElement('div');
                            popup.classList.add("popup_content");

                            popup.style.left = (targetRect.right - targetRect.left) / 2 - 150 + "px";
                            popup.innerText = "click to add '" + concept.data.label + " " + relation.data.label + " " + target.data.label + "' to Map";

                            targetElement.appendChild(popup);


                            //create and add the canvas for drawing the relation link
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
                                ctx.beginPath();
                                ctx.moveTo(0, 30);
                                ctx.quadraticCurveTo(canvas.width / 2, count % 2 == 0 ? 15 : 50, canvas.width, targetRect.top - sourceRect.top + 30);
                                ctx.stroke();
                            } else if (sourceRect.left > targetRect.right) {
                                canvas.width = sourceRect.left - targetRect.right;
                                ctx.lineWidth = 4;
                                ctx.strokeStyle = 'pink';
                                canvas.style.left = - canvas.width + "px";
                                ctx.beginPath();
                                ctx.moveTo(canvas.width, 30);
                                ctx.quadraticCurveTo(canvas.width / 2, count % 2 == 0 ? 15 : 50, 0, targetRect.top - sourceRect.top + 30, 10);
                                ctx.stroke();
                            } else if (sourceRect.left > targetRect.left) {
                                canvas.width = (sourceRect.left - targetRect.left) / 2;
                                ctx.lineWidth = 4;
                                ctx.strokeStyle = 'pink';
                                canvas.style.left = - canvas.width + "px";
                                ctx.beginPath();
                                ctx.moveTo(canvas.width, 30);
                                ctx.quadraticCurveTo((canvas.width / 2), 15, 0, targetRect.top - sourceRect.top + 30, 10);
                                ctx.stroke();
                            } else if (sourceRect.right < targetRect.right) {
                                canvas.width = (targetRect.right - sourceRect.right) / 2;
                                ctx.lineWidth = 4;
                                ctx.strokeStyle = 'pink';
                                ctx.beginPath();
                                ctx.moveTo(0, 30);
                                ctx.quadraticCurveTo((canvas.width / 2), 15, canvas.width, targetRect.top - sourceRect.top + 30, 10);
                                ctx.stroke();
                            }

                            known.appendChild(canvas);
                            count++;
                        } else {
                            unmark(instance, { "className": "related_" + classLabel })
                        }
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

function unmark(instance, options) {

    if (options === undefined) {
        instance.unmark();
    } else {
        instance.unmark(options);
    }

    let popups = document.getElementsByClassName('popup_content');
    for (i = popups.length - 1; i >= 0; i--) {
        popups[i].remove();
    }
}

function depositionParents(positionedParents){
    for (const parent of positionedParents) {
        parent.removeAttribute('style');
    }
    positionedParents = [];
    return positionedParents;
}

highlight_interesting();