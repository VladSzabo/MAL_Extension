function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
}

function getElements(doc, specifications) {
    if ("class" in specifications)
        return doc.getElementsByClassName(specifications["class"]);
    else if ("tag" in specifications)
        return doc.getElementsByTagName(specifications["tag"]);
}
