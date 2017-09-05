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
            else {
                content.removeChild(content.getElementsByClassName("spaceit")[0]);
                content.innerHTML += `<table border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr>
                    <td class="borderClass bgColor1" valign="top" width="50">  </td>
                    <td class="borderClass bgColor1 ac fw-b" valign="top" sort="up"><a id="title" href="#">Title<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="45" nowrap="" sort="up"><a id="type" href="#">Type<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="40" nowrap="" sort="up"><a id="eps" href="#">Eps.<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="50" nowrap="" sort="up"><a id="score" href="#">Score<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="80" nowrap="" sort="up"><a id="date" href="#">Date</a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="75" nowrap="" sort="up"><a id="members" href="#">Members<i class="fa fa-sort ml2"></i></a></td>
                    </tr>`;

                var shared = intersect(user1List, user2List), loaded = new Array();
                var tableBody = content.getElementsByTagName("tbody")[0];

                var handler = function (tableBody, response, e) {
                    doc.innerHTML = response;
                    var parts = e.split("/"), name = parts[3].replace(/_/g, ' '), id = parts[2];

                    var spaceit = getElements(doc, { "class": "spaceit" }), span = getElements(doc, { "tag": "span" });
                    var description, more = false, episodes, score, date, members, type = getElements(doc, { "tag": "a" });

                    // I have to find the indexes beacuse they are not constant
                    // Finding description (and handling its formatting) + score 
                    for (var i = 0; i < span.length; i++)
                        if (span[i].getAttribute("itemprop") == "ratingValue")
                            score = span[i].innerHTML;

                        else if (span[i].getAttribute("itemprop") == "description") {
                            description = span[i].innerHTML;

                            if (description.length > 200) {
                                more = true;
                                description = description.substring(0, 200);
                            }
                            else
                                more = false;
                            break;
                        }

                    //Finding anime type
                    for (var i = 0; i < type.length; i++)
                        if (type[i].href.indexOf("topanime.php?type") != -1) {
                            type = type[i].innerHTML;
                            break;
                        }

                    //Finding number of episodes + date + members
                    for (var i = 0; i < spaceit.length; i++)
                        if (spaceit[i].innerHTML.indexOf("Episodes") != -1)
                            episodes = spaceit[i].innerHTML.split("</span>")[1];

                        else if (spaceit[i].innerHTML.indexOf("Aired") != -1) {
                            date = spaceit[i].innerHTML.split("</span>")[1];
                            date = date.indexOf("to") != -1 ? date.split(" to")[0] : date;
                        }
                        else if (spaceit[i].innerHTML.indexOf("Members") != -1) {
                            members = spaceit[i].innerHTML.split("</span>")[1];
                            break;
                        }

                    /*
                    //Finding status
                    var status = getElements(doc, { "class": "inputtext js-anime-status-dropdown" })[0].children, found = false;
                    for (var i = 0; i < status.length; i++)
                        if (status[i].getAttribute("selected") == "selected") {
                            status = statuses[status[i].innerHTML].replace('@id', id);
                            found = true;
                            break;
                        }

                    if (!found) status = statuses["Default"].replace('@id', id);*/

                    //Adding each table row
                    tableBody.innerHTML += `<tr><td class="borderClass bgColor0" valign="top" width="50">
                            <div class="picSurround">
                                <a class="hoverinfo_trigger" href="https://myanimelist.net`+ e + `">
                                <img width="50" height="70" alt="`+ name + `" border="0" src="` + getElements(doc, { "class": "ac" })[0].src + `">
                                </a></div></td>
                                
                                <td class="borderClass bgColor0" valign="top">
                                <a class="hoverinfo_trigger fw-b fl-l" href="https://myanimelist.net`+ e + `"><strong>` + name + `</strong></a>
                                <a href="https://myanimelist.net/ownlist/anime/`+ id + `/edit?hideLayout=1" 
                                   title="Plan to Watch" class="Lightbox_AddEdit button_edit ml8 plantowatch">PTW</a>
                        <div class="pt4">` + description + (more ? `... <a href="https://myanimelist.net` + e + `">read more.</a>` : ``) + `</div></td>
                                <td class="borderClass ac bgColor0" width="45">` + type + `</td>
                                <td class="borderClass ac bgColor0" width="40">` + episodes + `</td>
                                <td class="borderClass ac bgColor0" width="50">` + score + `</td>
                                <td class="borderClass ac bgColor0" width="80">` + date + `</td>
                                <td class="borderClass ac bgColor0" width="75">` + members + `</td>
                                </tr>`;
                }

                shared.forEach(function (e) {
                    try {
                        httpGetAsync("https://myanimelist.net" + e, function (response) {
                            handler(tableBody, response, e);
                            loaded.push(e);

                            if (loaded.length == shared.length) {
                                // Adding event listeners for the sorting
                                var cols = content.getElementsByTagName("tr")[0].children;

                                cols[1].addEventListener("click", function (e) {
                                    sortTable(tableBody, 1, function (element) {
                                        return element.children[0].children[0].innerHTML;
                                    });
                                });
                                cols[2].addEventListener("click", function (e) {
                                    sortTable(tableBody, 2, function (element) {
                                        return element.innerHTML;
                                    });
                                });
                                cols[3].addEventListener("click", function (e) {
                                    sortTable(tableBody, 3, function (element) {
                                        return Number(element.innerHTML);
                                    });
                                });
                                cols[4].addEventListener("click", function (e) {
                                    sortTable(tableBody, 4, function (element) {
                                        return parseFloat(element.innerHTML);
                                    });
                                });
                                cols[6].addEventListener("click", function (e) {
                                    sortTable(tableBody, 6, function (element) {
                                        return Number(element.innerHTML.replace(',', ''));
                                    });
                                });

                            }

                        });
                    } catch (e) {
                        console.log("Exception")
                        console.log(e);
                    }
                });

                /* UNIQUE LISTS! I don't think they are really important for PTW
                var statuses = {
                    "Plan to Watch": `<a href="https://myanimelist.net/ownlist/anime/@id/edit?hideLayout=1" 
                                      title="Plan to Watch" class="Lightbox_AddEdit button_edit ml8 plantowatch">PTW</a>`,
                    "Completed": `<a href="https://myanimelist.net/ownlist/anime/@id/edit?hideLayout=1" 
                                   title="Completed" class="Lightbox_AddEdit button_edit ml8 completed">CMPL</a>`,
                    "On-Hold": `<a href="https://myanimelist.net/ownlist/anime/@id/edit?hideLayout=1" 
                                 title="On-Hold" class="Lightbox_AddEdit button_edit ml8 on-hold">HOLD</a>`,
                    "Watching": `<a href="https://myanimelist.net/ownlist/anime/@id/edit?hideLayout=1" 
                                  title="Watching" class="Lightbox_AddEdit button_edit ml8 watching">CW</a>`,
                    "Dropped": `<a href="https://myanimelist.net/ownlist/anime/@id/edit?hideLayout=1" 
                                 title="Dropped" class="Lightbox_AddEdit button_edit ml8 dropped">DROP</a>`,
                    "Default": `<a href="https://myanimelist.net/ownlist/anime/add?selected_series_id=@id&amp;hideLayout=1" 
                                 title="Quick add anime to my list" class="Lightbox_AddEdit button_add ml8">add</a>`
                };
                content.innerHTML += `<br><a name="u1"></a><h2>Unique to <a href="/profile/` + user1 + `">` + user1 + `</a></h2>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr>
                    <td class="borderClass bgColor1" valign="top" width="50">  </td>
                    <td class="borderClass bgColor1 ac fw-b" valign="top"><a id="title" href="">Title</a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="45" nowrap=""><a id="type" href="">Type<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="40" nowrap=""><a id="eps" href="">Eps.<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="50" nowrap=""><a id="score" href="">Score<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="80" nowrap=""><a id="date" href="">Date<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="75" nowrap=""><a id="members" href="">Members<i class="fa fa-sort ml2"></i></a></td>
                    </tr>`;

                var uniqueUser1 = unique(user1List, user2List);

                uniqueUser1.forEach(function (e) {
                    httpGetAsync("https://myanimelist.net" + e, function (response) {
                        handler(content.getElementsByTagName("tbody")[1], response, e);
                    });
                });

                content.innerHTML += `<br><a name="u2"></a><h2>Unique to <a href="/profile/` + user2 + `">` + user2 + `</a></h2>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr>
                    <td class="borderClass bgColor1" valign="top" width="50">  </td>
                    <td class="borderClass bgColor1 ac fw-b" valign="top"><a id="title" href="">Title</a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="45" nowrap=""><a id="type" href="">Type<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="40" nowrap=""><a id="eps" href="">Eps.<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="50" nowrap=""><a id="score" href="">Score<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="80" nowrap=""><a id="date" href="">Date<i class="fa fa-sort ml2"></i></a></td>
                    <td class="borderClass bgColor1 ac fw-b" width="75" nowrap=""><a id="members" href="">Members<i class="fa fa-sort ml2"></i></a></td>
                    </tr>`;

                var uniqueUser2 = unique(user2List, user1List);

                uniqueUser2.forEach(function (e) {
                    httpGetAsync("https://myanimelist.net" + e, function (response) {
                        handler(content.getElementsByTagName("tbody")[2], response, e);
                    });
                });*/

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

function addWebsitesScore(items) {
    if (url.indexOf(mal + "anime/") == 0) {
        var title = document.getElementsByClassName("h1")[0].children[0].innerHTML, doc = document.createElement("div"), link, doc;

        if (items["Kitsu"]) {
            link = `https://kitsu.io/api/edge/anime?fields%5Banime%5D=slug%2CcanonicalTitle%2Ctitles%2CposterImage&filter%5Btext%5D=@title&page%5Blimit%5D=2`;
            httpGetAsync(link.replace("@title", title), function (response) {
                try {
                    var id = JSON.parse(response)["data"]["0"]["id"];
                    link = "https://kitsu.io/api/edge/anime?fields%5Bcategories%5D=slug%2Ctitle&filter%5Bslug%5D=@title&include=categories%2CanimeProductions.producer";
                    link = link.replace("@title", id);

                    document.getElementsByClassName("di-t w100 mt12")[0].parentNode.innerHTML +=
                        `<div id="kitsu" style="background-color: #f6f6f6; border: #ebebeb 1px solid; border-radius: 1px; height: 68px; margin-top: 10px; display: table; width: 100%;">
                            <div style="display: table-cell; width:25%; height: 55px; text-align:center; position: relative; top: 50%; transform: translate(0, -50%);">
                            <a href="https://kitsu.io/anime/`+ id + `" target="_blank"><svg width="178" height="50" viewBox="0 0 800 224" xmlns="http://www.w3.org/2000/svg" 
                                    style="display: block; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%);">
                                <g fill="none" fill-rule="evenodd"><g fill="#505e6b">
                                <path d="M785.6 43.8c-9 0-14.4 6.4-14.4 14.4v83c0 11.4-6.9 20.6-20.6 20.6-13.6 0-20.6-9.2-20.6-20.6v-83c0-7.9-5.4-14.4-14.4-14.4s-14.4 6.4-14.4 14.4v83.1h.1c1 25.8 17.7 46.3 49.3 46.3 31.6 0 48.2-20.5 49.3-46.3h.1V58.2c0-7.9-5.4-14.4-14.4-14.4zM656.3 118.2C646.1 107.9 623 98 617 90.8c-3.7-4.1-4.2-10.4-.9-15.1 2-2.8 5-4.5 8.1-5.1 5.6-1 11.3-.2 15.8 1.6 5.9 2.3 10.2 5.7 14.8 6 4.2.3 8.5-1.5 11.2-5.3 3.4-4.9 2.8-11.5-1.1-15.7-11.1-13.3-33.9-14.6-45.1-12.8-11 1.8-21.6 7.2-28.2 16.6-10.9 15.5-8.8 36.3 3.5 49.7 9.3 10.6 23.4 16 34.2 22.9 2.3 1.5 5.2 3.6 6.7 5.2 4.6 4.7 5.3 12.1 1.5 17.6-2 2.8-4.8 4.6-7.8 5.4-2.8.8-6.3 1-8.4.9-9.3-.2-19.1-6.6-21.9-7.8-5.2-2.3-11.5-.7-14.9 4.2-2.9 4.1-2.8 9.2-.5 13.3 1.4 2.5 4 5.5 7.4 7.7 16.8 11.2 36.5 9.3 47.6 6.4 8.9-2.4 17.3-7.2 23-15.7 11.5-16.6 8.8-39.1-5.7-52.6zM550.2 45.8h-74.5c-7.2 0-13.1 4.2-13.1 13.1 0 8.9 5.9 13.1 13.1 13.1h23v101.2c0 7.9 4.6 14.4 14.4 14.4 9.7 0 14.4-6.4 14.4-14.4V72h22.7c7.2 0 13.1-4.2 13.1-13.1 0-8.8-5.8-13.1-13.1-13.1zM420.4 43.8c-9 0-14.4 6.4-14.4 14.4v115c0 7.9 4.6 14.4 14.4 14.4 9.7 0 14.4-6.4 14.4-14.4v-115c0-7.9-5.4-14.4-14.4-14.4zM370.5 166.6l-31.4-60.2c23.3-28.1 26.7-44.7 27.1-47.2.1-.7.2-1.5.2-2.3 0-7.2-5.8-13-13-13-5 0-9.3 2.9-11.9 6.9-2.5 4-7.1 15-20.8 34.1-8.3 11.5-17.4 20.9-20.7 24.2V58.3c0-7.9-5.4-14.4-14.4-14.4s-14.4 6.4-14.4 14.4v115c0 7.9 4.6 14.4 14.4 14.4 9.7 0 14.4-6.4 14.4-14.4v-27.8c3.1-3 10-9.6 17.7-17.6l27.1 52.1c3.7 7.1 11.9 9.3 19.4 6.6 7.6-3 10-13 6.3-20z"></path></g><g fill="#E75E45"><path d="M152.7 48.5c-6.8-2.5-14.1-4.1-21.8-4.4-12.7-.6-24.8 2.2-35.4 7.6-.6.3-1.3.6-2 1v36.4c0 .5 0 2.4-.3 4-.7 3.7-2.9 7-6 9.1-2.6 1.8-5.6 2.6-8.8 2.5-.6 0-1.3-.1-1.9-.2-1.6-.3-3.3-.9-3.8-1.1-1.4-.5-21.8-8.4-31.6-12.2-1.2-.5-2.2-.9-3-1.2-11.7 9.9-24 21.7-35.5 35.6-.1.1-.6.7-.7.8-1.5 2.1-1.6 5.1 0 7.4 1.2 1.7 3.1 2.7 5 2.8 1.3.1 2.7-.3 3.9-1.1.1-.1.2-.2.4-.3 12.2-8.8 25.6-15.9 39.8-21.6 1-.5 2.2-.8 3.3-.7 1.6.1 3.1.7 4.3 1.9 2.3 2.3 2.4 6 .5 8.5-.8 1.2-1.5 2.4-2.2 3.6-7.6 12.4-13.7 25.9-18.3 40-.1.4-.2.7-.3 1.1v.1c-.4 1.7-.1 3.5 1 5 1.2 1.7 3.1 2.7 5.1 2.8 1.4.1 2.7-.3 3.9-1.1.5-.4 1-.8 1.4-1.3.1-.2.3-.4.4-.6 5-7.1 10.5-13.8 16.4-20 26.3-28.2 61.2-48.1 100.3-55.9.3-.1.6-.1.9-.1 2.2.1 3.9 2 3.8 4.2-.1 1.9-1.4 3.3-3.2 3.7-36.3 7.7-101.7 50.8-78.8 113.4.4 1 .7 1.6 1.2 2.5 1.2 1.7 3.1 2.7 5 2.8 1.1 0 4.2-.3 6.1-3.7 3.7-7 10.7-14.8 30.9-23.2 56.3-23.3 65.6-56.6 66.6-77.7v-1.2c.9-31.4-18.6-58.8-46.6-69.2zm-56.5 165C91 198 91.5 183 97.6 168.7c11.7 18.9 32.1 20.5 32.1 20.5-20.9 8.7-29.1 17.3-33.5 24.3z"></path><path d="M1.1 50.6c.1.2.3.4.4.5 5.3 7.2 11.3 13.5 17.8 19.1.1.1.2.1.2.2 4.2 3.6 12.2 8.8 18 10.9 0 0 36.1 13.9 38 14.7.7.3 1.7.6 2.2.7 1.6.3 3.3 0 4.8-1s2.4-2.5 2.7-4.1c.1-.6.2-1.6.2-2.3V48.5c.1-6.2-1.9-15.6-3.7-20.8 0-.1-.1-.2-.1-.3-2.8-8.1-6.6-16-11.4-23.5l-.3-.6-.1-.1c-2-2.8-6-3.5-8.9-1.5-.5.3-.8.7-1.2 1.1-.3.4-.5.7-.8 1.1-6.4 9.3-9 20.6-7.3 31.7-3.3 1.7-6.8 4-7.2 4.3-.4.3-3.9 2.7-6.6 5.2-9.7-5.5-21.3-7.2-32.2-4.6-.4.1-.9.2-1.3.3-.5.2-1 .4-1.4.7-2.9 2-3.7 5.9-1.8 8.9v.2zm63.5-40.1c3.4 5.7 6.3 11.6 8.6 17.8-4.6.8-9.1 2-13.5 3.6-.6-7.5 1.1-14.9 4.9-21.4zM31.5 51.3c-3.2 3.5-5.9 7.3-8.3 11.3-4.9-4.3-9.4-9.2-13.5-14.4 7.5-1.3 15-.2 21.8 3.1z"></path></g></g></svg>
                            </a></div>
                        </div>`;

                    httpGetAsync(link, function (response) {
                        var data = JSON.parse(response)["data"]["0"]["attributes"],
                            score = data["averageRating"],
                            ranked = data["ratingRank"],
                            popularity = data["popularityRank"], color;

                        if (parseFloat(score) <= 25) color = "#e74c3c";
                        else if (parseFloat(score) <= 50) color = "#e67e22";
                        else if (parseFloat(score) <= 75) color = "#f39c12";
                        else color = "#1abc9c";

                        document.getElementById("kitsu").innerHTML += `
                            <div style="display: table-cell; width: 25%; padding: 10px; vertical-align: middle;">
                            <p style="font-family: Avenir,lucida grande,tahoma,verdana,arial,sans-serif; font-size: 14px; color: `+ color + `;" align="center">
                            <strong>` + score + `%<br> Community Approval</strong></p>
                            </div>
                            <div style="display: table-cell; width: 25%; padding: 10px; vertical-align: middle;">
                            <p style="font-family: Avenir,lucida grande,tahoma,verdana,arial,sans-serif; font-size: 16px;" align="center">
                            Ranked <strong>#` + ranked + `</strong></p>
                            </div>
                            <div style="display: table-cell; width: 25%; padding: 10px; vertical-align: middle;">
                            <p style="font-family: Avenir,lucida grande,tahoma,verdana,arial,sans-serif; font-size: 16px;" align="center">
                            Popularity <strong>#` + popularity + `</strong></p>
                            </div>`;
                    });
                } catch (e) {

                }
            });
        }
        if (items["AniDB"]) {
            link = "https://anidb.net/perl-bin/animedb.pl?show=search&do=fulltext&adb.search=@title&entity.animetb=1&field.titles=1&do.fsearch=Search";
            link = link.replace("@title", title.replace(/ /g, "+"));
            doc = document.createElement("div");

            httpGetAsync(link, function (response) {
                doc.innerHTML = response;
                link = "https://anidb.net/perl-bin/" + doc.getElementsByClassName("relid")[0].children[0].getAttribute("href");

                document.getElementsByClassName("di-t w100 mt12")[0].parentNode.innerHTML +=
                    `<div id="aniDB" style="background-color: #f6f6f6; border: #ebebeb 1px solid; border-radius: 1px; height: 68px; margin-top: 10px; display: table; width: 100%;">
                    <div style="display: table-cell; width: 25%; height: 55px; text-align:center; position: relative; top: 50%; transform: translate(0, -50%);">
                        <a href="` + link + `" target="_blank"><img width="178" height="50" src="https://static.anidb.net/css-2017-08-29T12-34-45/anidbstyle3/images/logo-small.png"
                            style="display: block; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%);"></img>
                    </a></div>
                    </div>`;

                httpGetAsync(link, function (response) {
                    doc.innerHTML = response;

                    var score = doc.getElementsByClassName("row rating")[0].children[1].children[0].children[0].children[0].innerHTML,
                        ranked = doc.getElementsByClassName("row rating")[0].children[2].children[0].innerHTML,
                        popularity = doc.getElementsByClassName("row popularity")[0].children[2].children[0].innerHTML;

                    document.getElementById("aniDB").innerHTML += `
                            <div style="display: table-cell; width: 25%; padding: 10px; vertical-align: middle;">
                            <p style="font-family: Avenir,lucida grande,tahoma,verdana,arial,sans-serif; font-size: 16px;" align="center">
                            Score <strong>#` + score + `</strong></p>
                            </div>
                            <div style="display: table-cell; width: 25%; padding: 10px; vertical-align: middle;">
                            <p style="font-family: Avenir,lucida grande,tahoma,verdana,arial,sans-serif; font-size: 16px;" align="center">
                            Ranked <strong>` + ranked + `</strong></p>
                            </div>
                            <div style="display: table-cell; width: 25%; padding: 10px; vertical-align: middle;">
                            <p style="font-family: Avenir,lucida grande,tahoma,verdana,arial,sans-serif; font-size: 16px;" align="center">
                            Popularity <strong>` + popularity + `</strong></p>
                            </div>`;
                });
            });

        }
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

    if (items["Websites"])
        addWebsitesScore(items);
});