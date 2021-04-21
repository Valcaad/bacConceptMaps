function getDOM() {
    const ps = document.querySelectorAll("P");
    let parray =[];
    for (const p of ps) {
        if((p.innerText.split(" ")).length <= 3){

        } else {
            parray.push(p.innerHTML);
        }

    }
    chrome.storage.local.set({"pelements": parray}, function(){
    }) ;
}

getDOM();