async function highlight() {

    let keywords;

    await chrome.storage.local.get('highlight_keywords', function (result) {
        keywords = result.highlight_keywords;

        console.log("content-script highlight function")
        console.log(keywords);

        let instance = new Mark(document.body.querySelectorAll("P"));

        unmark(instance);

        let options = {
            "acrossElements": true
        }

        for (const keyword of keywords) {
            let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            instance.markRegExp(regex, options);
        }

    })
}

function unmark(instance){

    instance.unmark();

    let popups = document.getElementsByClassName('popup_content');
    for (i = popups.length-1; i >=0; i--) {
        popups[i].remove();
    }
}

highlight();