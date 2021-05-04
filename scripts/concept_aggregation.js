async function extractCluster(){

    let cluster = [];
    await chrome.storage.local.get('parsedMap', function (result){
    let parsedMap = result.parsedMap;

    parsedMap.nodes.forEach(node => {
        let found = false;
        for(let i = 0; i < cluster.length; i++){
            if(node.data.cluster_id === cluster[i].cluster_id){
                cluster[i].nodes.push(node);
                found = true;
                break;
            }
        }
        if(!found){
            let newCluster = {
                "cluster_id": node.data.cluster_id,
                "nodes": [node]
            }
            cluster.push(newCluster);
        }
    });

    console.log(cluster);

    });
    
}

extractCluster();