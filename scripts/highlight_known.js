async function highlight_known() {

    let keywords_known;
    let keywords_related;
    let relatedMap;

    let instance = new Mark(document.body.querySelectorAll("P"));

    unmark(instance);

    await chrome.storage.local.get('relatedMap', function (result){
        if(result.relatedMap){
            relatedMap = result.relatedMap;
        }
    })

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

        let elements = document.getElementsByClassName("known");

        for(let i = 0; i < elements.length; i++){

                let popup = document.createElement('div');
                popup.classList.add("popup_content");
/*                 let btn = document.createElement('button');
                btn.innerText = 'click me';

                btn.addEventListener('click', () => {
                    console.log("clicked");
                })

                popup.appendChild(btn); */

                let concept = relatedMap.nodes.find(node => node.data.label === elements[i].innerText);
                let relations = relatedMap.edges.filter(edge => edge.data.source === concept.data.id);

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
                        let target = relatedMap.nodes.find(node => node.data.id === relation.data.target)
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



/*             fetch(chrome.runtime.getURL('html/hover_popup.html')).then(r => r.text()).then(html => {
                elements[i].insertAdjacentHTML('afterbegin', html);

                document.getElementById("popupbtn").addEventListener("click", () =>{
                    alert("I got clickedid");
                    console.log("clicked?");
                })
                // not using innerHTML as it would break js event listeners of the page
              }); */
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

highlight_known();