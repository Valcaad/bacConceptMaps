async function highlight_interesting(){
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

highlight_interesting();