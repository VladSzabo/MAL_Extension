function httpGetAsync(theUrl, callback, removeScripts) {
    removeScripts = removeScripts || true;

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var text = xmlHttp.responseText;

            //Removing scripts from the source
            /*if (removeScripts) {
                var i, end;

                while (true) {
                    i = text.indexOf("<script");
                    if (i != -1) {
                        end = text.indexOf("</script>");
                        console.log(text.substring(i, end + 8));
                        text = text.substring(0, i) + text.substring(end + 8, text.length);
                    }
                    else
                        break;
                }

            }*/

            callback(text);
        }
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

function unique(a, b) {
    return a.filter(function (e) {
        return b.indexOf(e) == -1;
    });
}


function sortTable(tableBody, colNr, parser) {
    var rows = tableBody.children, i, j, aux, reverse = false;

    if (rows[0].children[colNr].getAttribute("sort") == "up") {
        rows[0].children[colNr].setAttribute("sort", "down");
        reverse = true;
    }
    else
        rows[0].children[colNr].setAttribute("sort", "up");

    for (i = 1; i < rows.length; i++)
        for (j = i + 1; j < rows.length; j++)
            if ((reverse ? parser(rows[i].children[colNr]) < parser(rows[j].children[colNr]) :
                parser(rows[i].children[colNr]) > parser(rows[j].children[colNr]))) {
                aux = rows[i].outerHTML;
                rows[i].outerHTML = rows[j].outerHTML;
                rows[j].outerHTML = aux;
            }

}

String.prototype.hexEncode = function () {
    var hex, i;

    var result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }

    return result
}