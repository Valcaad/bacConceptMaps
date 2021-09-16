async function highlight_new() {
    let unknownConcepts;
    let parsedMap;

    let instance = new Mark(document.body.querySelectorAll("P"));

    unmark(instance);
    removeCanvases();

    await chrome.storage.local.get('parsedMap', function (result) {
        if (result.parsedMap) {
            parsedMap = result.parsedMap;
        }
    })

    await chrome.storage.local.get("unknownConcepts", function (result) {
        if (result.unknownConcepts) {
            unknownConcepts = result.unknownConcepts;


            //highlight the concepts listed in unknownConcepts
            for (const node of unknownConcepts) {
                let classLabel = node.data.label;
                classLabel = classLabel.replace(/ /g, "_").replace(/'/g, "");
                let options = {
                    "acrossElements": true,
                    "className": "new_mark new_" + classLabel
                }

                let regex = new RegExp(`\\b${node.data.label}\\b`, 'gi');
                instance.markRegExp(regex, options);
            }

            let elements = document.getElementsByClassName("new_mark");

            for (let i = 0; i < elements.length; i++) {

                const boundingRect = elements[i].getBoundingClientRect();

                const conceptName = elements[i].classList[1].substring(4).replace(/_/g, ' ');
                const concept = unknownConcepts.find(node => node.data.label.toLowerCase() === conceptName.toLowerCase());

                if (concept) {
                    //add the tooltip for adding a concept
                    const popup = document.createElement('div');
                    popup.classList.add("popup_content");

                    popup.style.left = (boundingRect.right - boundingRect.left) / 2 - 150 + "px";
                    popup.innerText = "click to add '" + concept.data.label + "' to the Map";

                    elements[i].appendChild(popup);


                    //request to add the concept to current map
                    elements[i].addEventListener('click', function (event) {
                        event.preventDefault();

                        let payload = {
                            undefined, concept, undefined
                        }

                        chrome.runtime.sendMessage({
                            message: 'add',
                            payload: payload
                        });

                        alert("'" + concept.data.label + "' has been added to the map");
                    })

                }
            }
        }
    })

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

    removeCanvases();
}

highlight_new();