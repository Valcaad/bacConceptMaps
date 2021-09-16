async function highlight_known() {

    let loadedMap;

    let instance = new Mark(document.body.querySelectorAll("P"));

    unmark(instance, undefined);
    removeCanvases();

    await chrome.storage.local.get('loadedMap', function (result) {
        if (result.loadedMap) {
            loadedMap = result.loadedMap;

            //highlight all the concepts in the known map
            for (const node of loadedMap.nodes) {

                let classLabel = node.label;
                classLabel = classLabel.replace(/ /g, "_");
                let options = {
                    "acrossElements": true,
                    "className": "known known_" + classLabel
                }

                let regex = new RegExp(`\\b${node.label}\\b`, 'gi');

                instance.markRegExp(regex, options);
            }

            let elements = document.getElementsByClassName("known");

            for (let i = 0; i < elements.length; i++) {

                let parent = elements[i].parentNode;

                while (parent.nodeName != "P") {
                    parent = parent.parentNode;
                }

                parent.style.zIndex = 0;
                parent.style.position = "relative";
                
                markRelations(elements[i], parent, loadedMap);

                elements[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                })

            }
        }
    })
}

function markRelations(known, parent, loadedMap) {

    const conceptName = known.classList[1].substring(6).replace(/_/g, ' ');
    let concept = loadedMap.nodes.find(node => node.label.toLowerCase() === conceptName.toLowerCase());

    if (concept) {
        let relations = loadedMap.edges.filter(edge => edge.source === concept.id);

        if (relations.length !== 0) {
            let targets = [];
            for (const relation of relations) {
                let target = loadedMap.nodes.find(node => node.id === relation.target);

                targets.push(target);
            }


            //identify the tragets of this concept
            let count = 0;
            for (const target of targets) {
                const sourceRect = known.getBoundingClientRect();
                const classLabel = target.label.replace(/ /g, "_");
                const targetElement = parent.getElementsByClassName("known_" + classLabel)[0];

                const relation = relations.find(edge => edge.target === target.id);

                if (targetElement) {

                    targetElement.addEventListener('mouseover', function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    })

                    const targetRect = targetElement.getBoundingClientRect();
                    if (sourceRect.top <= targetRect.top && !(sourceRect.top == targetRect.top && targetRect.right < sourceRect.left)) {

                        //add or extend the tooltip for drawn relations
                        if (targetElement.querySelector(".popup_content") !== null) {
                            const popup = targetElement.querySelector(".popup_content");
                            if (!popup.textContent.includes(concept.label + " " + relation.label + " " + target.label)) {
                                popup.textContent += "\r\n " + concept.label + " " + relation.label + " " + target.label;
                            }
                        } else {
                            const popup = document.createElement('div');
                            popup.classList.add("popup_content");

                            popup.style.left = (targetRect.right - targetRect.left) / 2 - 150 + "px";
                            popup.textContent = concept.label + " " + relation.label + " " + target.label;

                            targetElement.appendChild(popup);
                        }


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

highlight_known();