async function highlight() {

    let keywords;
    let parsedMap;

    await chrome.storage.local.get('parsedMap', function (result){
        if(result.parsedMap){
            parsedMap = result.parsedMap;
        }
    })

    await chrome.storage.local.get('highlight_keywords', function (result) {
        keywords = result.highlight_keywords;

        console.log("content-script highlight function")
        console.log(keywords);

        let instance = new Mark(document.body.querySelectorAll("P"));

        unmark(instance);
        removeCanvases();

        let options = {
            "acrossElements": true,
            "className": "related"
        }

        for (const keyword of keywords) {
            let regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            instance.markRegExp(regex, options);
        }

        let elements = document.getElementsByClassName("related");

        for(let i = 0; i < elements.length; i++){

                let popup = document.createElement('div');
                popup.classList.add("popup_content");

                let concept = parsedMap.nodes.find(node => node.data.label.toLowerCase() === elements[i].innerText.toLowerCase());
                let relations = parsedMap.edges.filter(edge => edge.data.source === concept.data.id);

                let list = document.createElement('ul');
                list.classList.add("relation_list");
                list.style.marginLeft = "0px";
                if(relations.length == 0){
                    const li = document.createElement('li');
                    li.innerText = "No further relations";
                    list.appendChild(li);
                } else{
                    for (const relation of relations) {
                        let li = document.createElement('li');
                        let target = parsedMap.nodes.find(node => node.data.id === relation.data.target)
                        let text = relation.data.label + " ... " + target.data.label;
                        li.innerText = text;
    
                        li.addEventListener('click', function (){
                            let payload = {
                                relation, concept, target
                            }
    
                            chrome.runtime.sendMessage({
                                message: 'update',
                                payload: payload
                            });
                            alert("add '" + concept.data.label + " ... " +  li.innerText + "' to Map");
                        })
                        list.appendChild(li);
                    }
                }


                popup.appendChild(list);
                elements[i].appendChild(popup);
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

function removeCanvases() {
    let canvases = document.getElementsByClassName("canvas_line");

    if (canvases.length !== 0) {
        for (j = canvases.length - 1; j >= 0; j--) {
            canvases[j].parentNode.removeChild(canvases[j]);
        }
    }
}

highlight();