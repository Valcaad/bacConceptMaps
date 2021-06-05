async function highlight_known() {

    let keywords_known;
    let loadedMap;

    let instance = new Mark(document.body.querySelectorAll("P"));

    unmark(instance, undefined);
    removeCanvases();

    await chrome.storage.local.get('loadedMap', function (result) {
        if (result.loadedMap) {
            loadedMap = result.loadedMap;

            for (const node of loadedMap.nodes) {

                const classLabel = node.label.replace(/ /g, "_");
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
        
                markRelations(elements[i], parent, loadedMap);
        
            }
        }
    })
}

function markRelations(known, parent, loadedMap) {
    let instance = new Mark(parent);

    let concept = loadedMap.nodes.find(node => node.label.toLowerCase() === known.innerText.toLowerCase());

    if (concept) {
        let relations = loadedMap.edges.filter(edge => edge.source === concept.id);

        if (relations.length !== 0) {
            let targets = [];
            for (const relation of relations) {
                let target = loadedMap.nodes.find(node => node.id === relation.target);

                targets.push(target);
            }


            let count = 0;
            for (const target of targets) {

                const sourceRect = known.getBoundingClientRect();
                const classLabel = target.label.replace(/ /g, "_");
                const targetElement = parent.getElementsByClassName("known_" + classLabel)[0];

                const relation = relations.find(edge => edge.target === target.id);

                if (targetElement) {


                    const targetRect = targetElement.getBoundingClientRect();
                    if (sourceRect.top <= targetRect.top) {

                        const popup = document.createElement('div');
                        popup.classList.add("popup_content");

                        popup.innerText = concept.label + " " + relation.label + " " + target.label;

                        targetElement.appendChild(popup);

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
                        } else if (sourceRect.left > targetRect.right) {
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