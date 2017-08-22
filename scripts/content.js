function removeUnwantedElements(target, criteria, startFrom, compare) {
    var elements = getElements(document, target);
    var deleted = 0, found = false, indexFound = -1;

    // Find already listed anime in previous pages
    if (startFrom && compare) {
        var doc = document.createElement("div"); doc.innerHTML = startFrom;

        for (var i = 0; i < elements.length; i++) {
            var all = true;

            for (var j = 0; j < compare.length; j++) {
                var el1 = getElements(elements[i], compare[j]), el2 = getElements(doc, compare[j]);

                if (!(el1.length > 0 && el2.length > 0 && el1[0].outerHTML == el2[0].outerHTML)) {
                    all = false;
                    break;
                }
            }

            if (all) {
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

function addWantedAnime(nr, templateUrl, container, target, criteria, nextTargets, oldUrl) {
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
            addWantedAnime(nr, templateUrl, container, target, criteria, nextTargets, newUrl);
        else
            changeNextPageUrl(newUrl, nextTargets);
    });
}

function changeNextPageUrl(url, nextTargets) {
    // Changes 'Next 50' link so that it skips unwanted anime
    if (nextTargets) {
        nextTargets = getElements(document, nextTargets);

        for (var i = 0; i < nextTargets.length; i++)
            nextTargets[i].href = url;
    }
}

function eliminateOption(items) {
    var params = null;

    if (url.indexOf(mal + "topanime") == 0)
        params = {
            target: { "class": "ranking-list" },
            criteriaRemove: function (element) { return element.innerHTML.indexOf("Completed") != -1; },
            criteriaAdd: function (element) { return element.innerHTML.indexOf("Completed") == -1; },
            templateUrl: "?limit=<0+50>",
            container: { "tag": "tbody" },
            compare: [{ "class": "information di-ib mt4" }, { "tag": "span" }],
            bonus: items["BonusEliminate"],
            nextTargets: { "class": "link-blue-box next" }
        }

    else if (url.indexOf(mal + "anime/genre") == 0 || url.indexOf(mal + "anime/producer") == 0)
        params = {
            target: { "class": "seasonal-anime js-seasonal-anime" },
            criteriaRemove: function (element) { return element.innerHTML.indexOf("CMPL") != -1; },
            criteriaAdd: function (element) { return element.innerHTML.indexOf("CMPL") == -1; },
            templateUrl: "?page=<1+1>",
            container: { "class": "seasonal-anime-list clearfix" },
            compare: [{ "class": "title-text" }],
            bonus: items["BonusEliminate"]
        }

    else if (url.indexOf(mal + "anime/season") == 0)
        params = {
            target: { "class": "seasonal-anime js-seasonal-anime" },
            criteriaRemove: function (element) { return element.innerHTML.indexOf("CMPL") != -1; },
            criteriaAdd: function (element) { return element.innerHTML.indexOf("CMPL") == -1; },
            templateUrl: null,
            container: null,
            compare: null,
            bonus: false
        }

    else if (url.indexOf(mal + "anime.php?") == 0)
        params = {
            target: { "tag": "tr" },
            criteriaRemove: criteriaRemove = function (element) {
                return element.innerHTML.indexOf("CMPL") != -1 && element.innerHTML.indexOf("pt4") != -1;
            },
            criteriaAdd: function (element) {
                return element.innerHTML.indexOf("CMPL") == -1 && element.innerHTML.indexOf("pt4") != -1;
            },
            templateUrl: "&show=<0+50>",
            container: { "tag": "tbody", "number": 2 },
            compare: [{ "class": "pt4" }],
            bonus: items["BonusEliminate"]
        }

    if (params) {
        var results = removeUnwantedElements(params.target, params.criteriaRemove, items["startFrom"], params.compare);

        if (params.bonus)
            addWantedAnime(results["deleted"], params.templateUrl, params.container, params.target, params.criteriaAdd, params.nextTargets);
    }
}

function getAnimeList(doc) {
    var allAnime = [], elements = getElements(doc, { "tag": "a" });

    for (var i = 0; i < elements.length; i++) {
        var href = elements[i].href;
        if (href.indexOf("/anime/") != -1 && href.indexOf("ownlist") == -1
            && allAnime.indexOf(href) == -1 && href.indexOf("/video") == -1)
            allAnime.push(elements[i].href.replace("https://myanimelist.net", ''));
    }

    if (allAnime.length < 1) {
        if (doc.getElementsByTagName("table")[0].getAttribute("data-items")) {
            var json = JSON.parse(doc.getElementsByTagName("table")[0].getAttribute("data-items"));

            for (var i = 0; i < json.length; i++)
                allAnime.push(json[i]["anime_url"]);
        }
    }
    return allAnime;
}

function showSharedPTWAnime(niceView) {
    var splitQ = url.split('?')[1], splitAnd = splitQ.split('&');
    var user1 = splitAnd[0].split("u1=")[1], user2 = splitAnd[1].split("u2=")[1];
    var user1List, user2List;

    //Formatting the headers
    document.getElementsByClassName("h1")[0].innerHTML = "Shared PTW Anime";
    var content = document.getElementById("content");
    content.innerHTML = "";

    var templateHeaders = `<div class="spaceit"><a href="#u1">Unique to @user1</a> | <a href="#u2">Unique to @user2</a></div>
            <h2>Shared PTW Anime Between <a href="/profile/@user1">@user1</a> and <a href="/profile/@user2">@user2</a></h2>`;
    templateHeaders = templateHeaders.replace(/@user1/g, user1).replace(/@user2/g, user2);

    content.innerHTML += templateHeaders;

    httpGetAsync("https://myanimelist.net/animelist/" + user1 + "?status=6", function (response) {
        var doc = document.createElement("div");
        doc.innerHTML = response;
        user1List = getAnimeList(doc);

        httpGetAsync("https://myanimelist.net/animelist/" + user2 + "?status=6", function (response) {
            doc.innerHTML = response;
            user2List = getAnimeList(doc);

            if (!niceView) {
                content.innerHTML += `<table border="0" cellpading="0" cellspacing="0" width="100%"> <tbody>
                <tr><td class="borderClass"><a id="title" href=""><strong>Title</strong></a></td></tr>`;

                var shared = intersect(user1List, user2List);
                var tableBody = content.getElementsByTagName("tbody")[0];

                shared.forEach(function (e) {
                    var parts = e.split("/");
                    tableBody.innerHTML += `
                    <tr><td class="borderClass"><a href="` + e + `">` + parts[3].replace(/_/g, ' ') + `</a> 
                    <a href="https://myanimelist.net/ownlist/anime/` + parts[2] + `/edit?hideLayout=1" title="Completed" class="Lightbox_AddEdit button_edit">edit</a></td></tr>`;
                });

                content.innerHTML += `<a name="u1"></a><h2>Unique to <a href="/profile/` + user1 + `">` + user1 + `</a></h2>
                <table border="0" cellpading="0" cellspacing="0" width="100%"> <tbody>
                <tr><td class="borderClass"><a id="title" href=""><strong>Title</strong></a></td></tr>`;

                var uniqueUser1 = unique(user1List, user2List);
                tableBody = content.getElementsByTagName("tbody")[1];

                uniqueUser1.forEach(function (e) {
                    var parts = e.split("/");
                    tableBody.innerHTML += `
                    <tr><td class="borderClass"><a href="` + e + `">` + parts[3].replace(/_/g, ' ') + `</a> 
                    <a href="https://myanimelist.net/ownlist/anime/` + parts[2] + `/edit?hideLayout=1" title="Completed" class="Lightbox_AddEdit button_edit">edit</a></td></tr>`;
                });

                content.innerHTML += `<a name="u2"></a><h2>Unique to <a href="/profile/` + user2 + `">` + user2 + `</a></h2>
                <table border="0" cellpading="0" cellspacing="0" width="100%"> <tbody>
                <tr><td class="borderClass"><a id="title" href=""><strong>Title</strong></a></td></tr>`;

                var uniqueUser2 = unique(user2List, user1List);
                tableBody = content.getElementsByTagName("tbody")[2];

                uniqueUser2.forEach(function (e) {
                    var parts = e.split("/");
                    tableBody.innerHTML += `
                    <tr><td class="borderClass"><a href="` + e + `">` + parts[3].replace(/_/g, ' ') + `</a> 
                    <a href="https://myanimelist.net/ownlist/anime/` + parts[2] + `/edit?hideLayout=1" title="Completed" class="Lightbox_AddEdit button_edit">edit</a></td></tr>`;
                });
            }
            else{

            }

        })
    })
}

function sharedOption(items) {
    if (url.indexOf(mal + "animelist") == 0) {
        // Add new option to page
        var links = document.getElementsByTagName("a"), found = false, element;

        for (var i = 0; i < links.length; i++)
            if (links[i].href.indexOf("sharedanime.php") != -1) {
                found = true;
                element = links[i];
                break;
            }
        if (found) {
            element.parentElement.innerHTML += "| <a href=\"" + element.href + "?ptw\">Shared PTW Anime</a>";
        }
    }
    else if (url.indexOf(mal + "shared.php") == 0 && url.indexOf("?ptw") != -1) {
        showSharedPTWAnime(items["BonusShared"]);
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

const mal = "https://myanimelist.net/"
var url = window.location.href;

//Check options
chrome.storage.local.get(null, function (items) {

    if (items["Eliminate"])
        eliminateOption(items);

    if (items["Shared"])
        sharedOption(items);


});