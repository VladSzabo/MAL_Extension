function change(e) {
    var jsonVar = {};
    jsonVar[e.target.name] = e.target.checked;
    chrome.storage.local.set(jsonVar);

    if (elementsWithBonuses.indexOf(e.target.name) != -1)
        if (!e.target.checked)
            document.querySelectorAll("#bonus" + e.target.name).forEach((el) => { el.className = "hidden"; });
        else
            document.querySelectorAll("#bonus" + e.target.name).forEach((el) => { el.className = ""; });
}

var elementsWithBonuses = ["Eliminate", "Shared", "Websites"];
document.querySelectorAll("#check").forEach((el) => { el.addEventListener("click", change); });

chrome.storage.local.get(null, function (items) {
    var defaultValues = { "Eliminate": true, "Shared": true, "Advanced": true, "BonusEliminate": false, "BonusShared": false, "Kitsu": false, "Anime-planet": false };

    if (Object.keys(items).length == 0) {
        chrome.storage.local.set(defaultValues);
    }
    else {
        var keys = Object.keys(defaultValues);

        for (var i = 0; i < keys.length; i++) {
            document.getElementsByName(keys[i])[0].checked = items[keys[i]];
            
            if(elementsWithBonuses.indexOf(keys[i]) != -1 && !items[keys[i]])
                document.querySelectorAll("#bonus" + keys[i]).forEach((el) => { el.className = "hidden"; });
        }
    }
});