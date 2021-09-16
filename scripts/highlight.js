async function highlight() {

    let keywords;
    let parsedMap;

    await chrome.storage.local.get('parsedMap', function (result) {
        if (result.parsedMap) {
            parsedMap = result.parsedMap;
        }
    })

    await chrome.storage.local.get('highlight_keywords', function (result) {
        keywords = result.highlight_keywords;

        let instance = new Mark(document.body.querySelectorAll("P"));

        unmark(instance, undefined);
        removeCanvases();

        let options = {
            "acrossElements": true,
            "className": "clicked_on"
        }

        for (const keyword of keywords) {
            let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            instance.markRegExp(regex, options);
        }

        let elements = document.getElementsByClassName("clicked_on");

        for (let i = 0; i < elements.length; i++) {

            let parent = elements[i].parentNode;

            while (parent.nodeName != "P") {
                parent = parent.parentNode;
            }

            parent.style.zIndex = 0;
            parent.style.position = "relative";

            let parentInstance = new Mark(parent);

            const boundingRect = elements[i].getBoundingClientRect();

            const conceptName = keywords[0];
            let concept = parsedMap.nodes.find(node => node.data.label.toLowerCase() === conceptName.toLowerCase());
            if (concept) {

                //add the tooltip for clicking a highlighted concept
                const sourcePopup = document.createElement('div');
                sourcePopup.classList.add("popup_content");

                sourcePopup.style.left = (boundingRect.right - boundingRect.left) / 2 - 150 + "px";
                sourcePopup.innerText = "click to add '" + concept.data.label + "' to the Map";

                elements[i].appendChild(sourcePopup);


                //request to add the clicked concept to the current map
                elements[i].addEventListener('click', function (event) {
                    event.preventDefault();
                    let payload = {
                        undefined, concept, undefined
                    }

                    chrome.runtime.sendMessage({
                        message: 'add',
                        payload: payload
                    });
                    alert("'" + concept.data.label + "' has been added to the Map");
                })

                //get all relations of this concept
                let relations = parsedMap.edges.filter(edge => edge.data.source === concept.data.id);

                if (relations.length !== 0) {

                    let targets = [];
                    for (const relation of relations) {

                        let target = parsedMap.nodes.find(node => node.data.id === relation.data.target)

                        targets.push(target);
                    }

                    //highlight all the targets
                    let count = 0;
                    for (const target of targets) {

                        let classLabel = target.data.label;
                        classLabel = classLabel.replace(/ /g, "_").replace(/'/g, "");


                        if (document.getElementsByClassName("related_" + classLabel).length == 0) {
                            options = {
                                "acrossElements": true,
                                "className": "related related_" + classLabel,
                                "exclude": [".popup_content"]
                            }
                            let regex = new RegExp(`\\b${target.data.label}\\b`, 'gi');
                            parentInstance.markRegExp(regex, options);
                        }

                        const sourceRect = elements[i].getBoundingClientRect();
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

                                    //add the relation, incl. source and target concept to the current map
                                    targetElement.addEventListener('click', function (event) {
                                        event.preventDefault();
                                        let payload = {
                                            relation, concept, target, url, sourceText
                                        }

                                        chrome.runtime.sendMessage({
                                            message: 'add',
                                            payload: payload
                                        });
                                        alert("'" + concept.data.label + " ... " + relation.data.label + " ... " + target.data.label + "' has been added to the Map");
                                    })

                                    //add the tooltip for adding the relation
                                    if(!(targetElement.childNodes.length > 1)){
                                        const popup = document.createElement('div');
                                        popup.classList.add("popup_content");
    
                                        popup.style.left = (targetRect.right - targetRect.left) / 2 - 150 + "px";
                                        popup.innerText = "click to add '" + concept.data.label + " " + relation.data.label + " " + target.data.label + "' to the Map";
    
                                        targetElement.appendChild(popup);
                                    }



                                    //create and add the canvas for the relation link
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

                                    elements[i].appendChild(canvas);
                                    count++;
                                } else {
                                    //unmark(parentInstance, { "className": "related_" + classLabel })
                                }
                            }
                        }
                    }
                }
            }

        }

    })
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

function removeCanvases() {
    let canvases = document.getElementsByClassName("canvas_line");

    if (canvases.length !== 0) {
        for (j = canvases.length - 1; j >= 0; j--) {
            canvases[j].parentNode.removeChild(canvases[j]);
        }
    }
}

highlight();