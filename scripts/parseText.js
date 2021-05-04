function getDOM() {
    const ps = document.querySelectorAll("P");
    let parray =[];
    for (const p of ps) {
        if((p.innerText.split(" ")).length <= 5){

        } else {
            let pp =p.innerHTML;
            if(pp.match(/\[\d*\]/) != null){
                pp = pp.replace(/\[\d*\]/ig,'');
            }

            parray.push(pp);
        }

    }
    chrome.storage.local.set({"pelements": parray}, function(){
    }) ;
}

getDOM();