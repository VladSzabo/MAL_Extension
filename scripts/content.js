function getCommonAnime() {

}

function removeUnwantedElements(doc, target, criteria) {
    var elements = getElements(doc, target);
    var deleted = 0;

    for (var i = 0; i < elements.length; i++)
        if (criteria(elements[i])) {
            elements[i].parentNode.removeChild(elements[i]);
            deleted++; i--;
        }

    return { "total": elements.length, "deleted": deleted };
}

function determineNewUrl(lastUrl, templateUrl) {
    if (lastUrl.indexOf("?") != -1 && lastUrl.indexOf(templateUrl.split('<')[0]) == -1)
        templateUrl = templateUrl.replace('?', '&');

    var newUrl = lastUrl;
    var extra = templateUrl.split('<');
    var indices = extra[1].replace('>', '').split('+');

    if (newUrl.indexOf(extra[0]) == -1)
        newUrl += extra[0] + (Number(indices[0]) + Number(indices[1])).toString();
    else {
        var parts = newUrl.split(extra[0]);
        newUrl = parts[0] + extra[0] + (Number(parts[1]) + Number(indices[1])).toString();
    }
    return newUrl;
}

function addWantedAnime(nr, templateUrl, container, target, criteria, oldUrl) {

    var number = 0;
    if ("number" in container)
        number = container["number"]

    oldUrl = oldUrl || url;
    newUrl = determineNewUrl(oldUrl, templateUrl);
    containerBody = getElements(document, container)[number];

    httpGetAsync(newUrl, function (response) {
        var doc = document.createElement("div");
        doc.innerHTML = response;
        var elements = getElements(doc, target);

        for (var i = 0; i < elements.length; i++)
            if (nr > 0) {
                if (!criteria(elements[i])) {
                    containerBody.innerHTML += elements[i].outerHTML;
                    nr--;
                }
            }
            else
                break;

        chrome.storage.local.set({ "lastUrl": newUrl });
        if (nr > 0)
            addWantedAnime(nr, templateUrl, container, target, criteria, newUrl);
    });
}

function updateAnimeTable(target, criteriaText, templateUrl, container, bonus) {

    function criteria(element) {
        if (!Array.isArray(criteriaText))
            return element.innerHTML.indexOf(criteriaText) != -1;
        else {
            for (var i = 0; i < criteriaText.length; i++)
                if (element.innerHTML.indexOf(criteriaText[i]) != -1)
                    return true;
            return false;
        }
    }
    var results = removeUnwantedElements(document, target, criteria);

    if (bonus) {
        chrome.storage.local.get(["lastUrl"], function (item) {
            addWantedAnime(results["deleted"], templateUrl, container, target, criteria);
        });
    }
}

const mal = "https://myanimelist.net/"
var url = window.location.href;

chrome.storage.local.get(null, function (items) {

    if (items["Eliminate"]) {

        if (url.indexOf(mal + "topanime") == 0) {
            updateAnimeTable({ "class": "ranking-list" }, "Completed", "?limit=<0+50>", { "tag": "tbody" }, items["Bonus"]);
        }
        else if (url.indexOf(mal + "anime/genre") == 0 || url.indexOf(mal + "anime/producer") == 0) {
            updateAnimeTable({ "class": "seasonal-anime js-seasonal-anime" }, "CMPL", "?page=<1+1>",
                { "class": "seasonal-anime-list clearfix" }, items["Bonus"]);
        }
        else if (url.indexOf(mal + "anime/season") == 0) {
            updateAnimeTable({ "class": "seasonal-anime js-seasonal-anime" }, "CMPL", null, null, false);
        }
        else if (url.indexOf(mal + "anime.php?") == 0) {
            updateAnimeTable({ "tag": "tr" }, ["CMPL", "input"], "&show=<0+50>", { "tag": "tbody", "number": 2 }, items["Bonus"]);
        }

    }
});