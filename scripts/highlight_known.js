async function highlight_known() {

    let keywords_known;
    let keywords_related;

    let instance = new Mark(document.body.querySelectorAll("P"));

    instance.unmark();

    await chrome.storage.local.get('relatedKeywords', function (result){
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
    })

    await chrome.storage.local.get('knownKeywords', function (result) {
        keywords_known = result.knownKeywords;

        console.log("content-script highlight function")
        console.log(keywords_known);

        let options = {
            "acrossElements": true,
            "className": "known"
        }

        for (const keyword of keywords_known) {
            let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            instance.markRegExp(regex, options);
        }

    })


}

highlight_known();