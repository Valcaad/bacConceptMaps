async function highlight() {

    let keyword;

    await chrome.storage.local.get('highlight_keyword', function (result) {
        keyword = result.highlight_keyword;

        console.log("content-script highlight function")
        console.log(keyword);

        let instance = new Mark(document.querySelectorAll("P"));

        instance.unmark();

        let options = {
            "acrossElements": true
        }

        let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        instance.markRegExp(regex, options);
    })

    return "ok";
}

highlight();