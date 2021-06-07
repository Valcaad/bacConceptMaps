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


            for (const node of unknownConcepts) {
                const classLabel = node.data.label.replace(/ /g, "_").replace(/'/g, "");
                let options = {
                    "acrossElements": true,
                    "className": "new new_" + classLabel
                }

                let regex = new RegExp(`\\b${node.data.label}\\b`, 'gi');

                instance.markRegExp(regex, options);
            }

            let elements = document.getElementsByClassName("new");

            for (let i = 0; i < elements.length; i++) {

                const boundingRect = elements[i].getBoundingClientRect();

                const concept = unknownConcepts.find(node => node.data.label.toLowerCase() === elements[i].innerText.toLowerCase());

                const popup = document.createElement('div');
                popup.classList.add("popup_content");

                popup.style.left = (boundingRect.right - boundingRect.left) / 2 - 150 + "px";
                popup.innerText = "click to add '" + concept.data.label + "' to Map";

                elements[i].appendChild(popup);

                elements[i].addEventListener('click', function (event) {
                    event.preventDefault();

                    let payload = {
                        undefined, concept, undefined
                    }

                    chrome.runtime.sendMessage({
                        message: 'update',
                        payload: payload
                    });

                    alert("add " + concept.data.label + " to map");
                })
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