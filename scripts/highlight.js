async function highlight() {

    let keywords;

    await chrome.storage.local.get('highlight_keywords', function (result) {
        keywords = result.highlight_keywords;

        console.log("content-script highlight function")
        console.log(keywords);

        let instance = new Mark(document.body.querySelectorAll("P"));

        instance.unmark();

        let options = {
            "acrossElements": true
        }

        for (const keyword of keywords) {
            let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            instance.markRegExp(regex, options);
        }

    })
}

highlight();