function removeUnwantedElements(doc, target, criteria, startFrom, compare) {
    var elements = getElements(doc, target);
    var deleted = 0, found = false, indexFound = -1;

    if (startFrom && compare) {
        var doc = document.createElement("div");
        doc.innerHTML = startFrom;

        for (var i = 0; i < elements.length; i++) {
            var el1 = getElements(elements[i], compare), el2 = getElements(doc, compare);
            if (el1.length > 0 && el2.length > 0 && el1[0].outerHTML == el2[0].outerHTML) {
                found = true;
                indexFound = i;
                break;
            }
        }
    }

    for (var i = 0; i < elements.length; i++)
        if (i <= indexFound) {
            elements[i].parentNode.removeChild(elements[i]);
            deleted++; i--; indexFound--;
        }
        else if (criteria(elements[i])) {
            elements[i].parentNode.removeChild(elements[i]);
            deleted++; i--;
        }

    return { "total": elements.length, "deleted": deleted };
}

function determineNewUrl(lastUrl, templateUrl) {
    //Determine the url of the next page

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
    oldUrl = oldUrl || url;
    newUrl = determineNewUrl(oldUrl, templateUrl);
    containerBody = getElements(document, container)[container["number"] || 0];

    httpGetAsync(newUrl, function (response) {
        var doc = document.createElement("div");
        doc.innerHTML = response;
        var elements = getElements(doc, target);

        for (var i = 0; i < elements.length; i++)
            if (nr > 0) {
                if (criteria(elements[i])) {
                    containerBody.innerHTML += elements[i].outerHTML;
                    nr--;
                    chrome.storage.local.set({ "startFrom": elements[i].outerHTML })
                }
            }
            else
                break;

        if (nr > 0)
            addWantedAnime(nr, templateUrl, container, target, criteria, newUrl);
        else
            changeNextPageUrl(newUrl);
    });
}

function updateAnimeTable(target, criteriaText, templateUrl, container, bonus, compare) {
    chrome.storage.local.get(null, function (items) {
        var criteriaRemove, criteriaAdd;

        if (!Array.isArray(criteriaText)) {
            criteriaRemove = function (element) {
                return element.innerHTML.indexOf(criteriaText) != -1;
            }
            criteriaAdd = function (element) {
                return element.innerHTML.indexOf(criteriaText) == -1;
            }
        }
        else {
            criteriaRemove = function (element) {
                return element.innerHTML.indexOf(criteriaText[0]) != -1 && element.innerHTML.indexOf(criteriaText[1]) != -1;
            }
            criteriaAdd = function (element) {
                return element.innerHTML.indexOf(criteriaText[0]) == -1 && element.innerHTML.indexOf(criteriaText[1]) != -1;
            }
        }
        var results = removeUnwantedElements(document, target, criteriaRemove, items["startFrom"], compare);

        if (bonus)
            addWantedAnime(results["deleted"], templateUrl, container, target, criteriaAdd);
    });
}

function changeNextPageUrl(url) {
    if (nextTargets) {
        nextTargets = getElements(document, nextTargets);

        for (var i = 0; i < nextTargets.length; i++)
            nextTargets[i].href = url;
    }
}

/*function getUserName() {
    var text = document.getElementsByTagName("body")[0].innerHTML.split("window.MAL.USER_NAME")[1];
    var found = 0, i = 0;
    userName = "";

    while (found < 2) {
        if (text[i] == "\"")
            found++;

        if (found == 1)
            userName += text[i];
        i++;
    }
    return userName.replace("\"", '');
}*/

function getAnimeList(doc) {
    var allAnime = [], elements = getElements(doc, { "tag": "a" });

    for (var i = 0; i < elements.length; i++) {
        var href = elements[i].href;
        if (href.indexOf("/anime/") != -1 && href.indexOf("ownlist") == -1
            && allAnime.indexOf(href) == -1 && href.indexOf("/video") == -1)
            allAnime.push(elements[i].href);
    }

    return allAnime;
}

function showSharedPTWAnime(niceView) {
    var user1, user2;
    var user1List, user2List;
}

const mal = "https://myanimelist.net/"
var url = window.location.href;

chrome.storage.local.get(null, function (items) {

    if (items["Eliminate"]) {
        if (url.indexOf(mal + "topanime") == 0) {
            updateAnimeTable({ "class": "ranking-list" }, "Completed", "?limit=<0+50>", { "tag": "tbody" },
                items["BonusEliminate"], { "class": "information di-ib mt4" });
            nextTargets = { "class": "link-blue-box next" };
        }
        else if (url.indexOf(mal + "anime/genre") == 0 || url.indexOf(mal + "anime/producer") == 0) {
            updateAnimeTable({ "class": "seasonal-anime js-seasonal-anime" }, "CMPL", "?page=<1+1>",
                { "class": "seasonal-anime-list clearfix" }, items["BonusEliminate"], { "class": "title-text" });
        }
        else if (url.indexOf(mal + "anime/season") == 0) {
            updateAnimeTable({ "class": "seasonal-anime js-seasonal-anime" }, "CMPL", null, null, false, null);
        }
        else if (url.indexOf(mal + "anime.php?") == 0) {
            updateAnimeTable({ "tag": "tr" }, ["CMPL", "pt4"], "&show=<0+50>", { "tag": "tbody", "number": 2 },
                items["BonusEliminate"], { "class": "pt4" });
        }
    }
    if (items["Shared"]) {
        if (url.indexOf(mal + "animelist") == 0) {
            // Add new option to page
            var links = document.getElementsByTagName("a"), found = false, element;

            for (var i = 0; i < links.length; i++)
                if (links[i].href.indexOf("sharedanime.php") != -1) {
                    found = true;
                    element = links[i];
                    break;
                }
            if(found){
                console.log(element.parentElement);
                console.log(element);
                element.parentElement.innerHTML += `| <a href="/sharedanime.php?u1=BaconDroid&amp;u2=NoxErinys?ptw">Shared PTW Anime</a>`;
            }
        }
        else if (url.indexOf(mal + "shared.php") == 0) {
            showSharedPTWAnime(items["BonusShared"]);
        }
    }
});