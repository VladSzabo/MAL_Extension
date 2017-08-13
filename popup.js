function change(e){
    var jsonVar = {};
    jsonVar[e.target.name] = e.target.checked;
    chrome.storage.local.set(jsonVar);
}

document.querySelectorAll("#check").forEach((el) => {el.addEventListener("click", change);});

chrome.storage.local.get(null, function(items) {
    var allKeys = Object.keys(items);

    if(allKeys.length == 0){
        chrome.storage.local.set({"Eliminate": true, "Common": true, "Advanced": true});
    }
    else{
        for(var i=0;i<allKeys.length;i++){
            document.getElementsByName(allKeys[i])[0].checked = items[allKeys[i]];
        }
    }  
});
