function change(e){
    var jsonVar = {};
    jsonVar[e.target.name] = e.target.checked;
    chrome.storage.local.set(jsonVar);

    if(e.target.name == "Eliminate")
        if(!e.target.checked)
            document.getElementById("bonus").className = "hidden";
        else
            document.getElementById("bonus").className = "";
}

document.querySelectorAll("#check").forEach((el) => {el.addEventListener("click", change);});

chrome.storage.local.get(null, function(items) {
    var allKeys = Object.keys(items);

    if(allKeys.length == 0){
        chrome.storage.local.set({"Eliminate": true, "Common": true, "Advanced": true, "Bonus": false});
    }
    else{
        for(var i=0;i<4;i++){
            document.getElementsByName(allKeys[i])[0].checked = items[allKeys[i]];
        }
        if(!items["Eliminate"])
            document.getElementById("bonus").className = "hidden";
    }  
});