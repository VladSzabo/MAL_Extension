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
    else if ("id" in specifications)
        return [doc.getElementById(specifications["id"])];
}

function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t;
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}

function unique(a, b){
    return a.filter(function (e) {
        return b.indexOf(e) == -1;
    });
}