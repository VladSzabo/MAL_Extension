function httpGetAsync(theUrl, callback, removeScripts) {
    removeScripts = removeScripts || true;

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var text = xmlHttp.responseText;
            callback(text);
        }
    }
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
}

function httpPostAsync(url, headers, data) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', headers);

    xhr.onload = function () {
        console.log(this.responseText);
    };

    xhr.send(data);
}

/*function change(e) {
    var jsonVar = {};
    jsonVar[e.target.name] = e.target.checked;
    chrome.storage.local.set(jsonVar);

    if (elementsWithBonuses.indexOf(e.target.name) != -1)
        if (!e.target.checked)
            document.querySelectorAll("#bonus" + e.target.name).forEach((el) => { el.className = "hidden"; });
        else
            document.querySelectorAll("#bonus" + e.target.name).forEach((el) => { el.className = ""; });
}*/
/*
function searchAnime(e) {
    var link = `https://myanimelist.net/search/prefix.json?type=anime&keyword=` + e.target.value + `&v=1`;
    httpGetAsync(link, function (response) {
        var items = JSON.parse(response)["categories"]["0"]["items"];

        if (items.length > 0)
            document.getElementById("topSearchResultList").classList.remove("hidden");

        var template = `
        <div class="list anime" id="@id"><a href="@href" class="clearfix">
            <div class="off"><span class="image" style="background-image: url(&quot;@image&quot;);"></span>
                <div class="info anime">
                    <div class="name">@name <span class="media-type">(@media_type)</span></div>
                    <div class="extra-info">Aired: @aired<br>Score: @score<br>Status: @status</div>
                </div>
            </div>
        </a></div>`;

        document.getElementById("topSearchResultList").innerHTML = "";

        for (var i = 0; i < items.length; i++)
            document.getElementById("topSearchResultList").innerHTML += template.replace("@name", items[i]["name"])
                .replace("@aired", items[i]["payload"]["aired"]).replace("@score", items[i]["payload"]["score"])
                .replace("@status", items[i]["payload"]["status"]).replace("@href", items[i]["url"]).replace("@id", items[i]["id"])
                .replace("@image", items[i]["image_url"]).replace("@media_type", items[i]["payload"]["media_type"]);


        document.querySelectorAll("div.list.anime").forEach(function (el) {
            el.addEventListener("mouseover", function (e) {
                el.children[0].children[0].className = "on";
                el.children[0].children[0].getElementsByClassName("extra-info")[0].classList.remove("hidden");
                el.classList.add("focus");
            });
            el.addEventListener("mouseleave", function (e) {
                el.children[0].children[0].className = "off";
                el.children[0].children[0].getElementsByClassName("extra-info")[0].classList.add("hidden");
                el.classList.remove("focus");
            });
            el.addEventListener("click", function (e) {
                console.log("A fost selectat");

                httpGetAsync(el.children[0].href, function (response) {
                    var doc = document.createElement("div");
                    doc.innerHTML = response;

                    var data = {
                        "anime_id": el.id,
                        "status": null,
                        "num_watched_episodes": null,
                        "csrf_token": doc.getElementsByTagName("meta")
                    };

                    for (var i = 0; i < data["csrf_token"].length; i++)
                        if (data["csrf_token"][i].name == "csrf_token") {
                            data["csrf_token"] = data["csrf_token"][i].content;
                            break;
                        }


                });

                //httpPostAsync("https://myanimelist.net/ownlist/anime/edit.json", "application/x-www-form-urlencoded; charset=UTF-8",
                //    JSON.stringify({ "anime_id": 223, "status": 1, "score": 0, "num_watched_episodes": 21, "csrf_token":"5d44caafea24cf5159bb7c28308458af4fa039f9"}));
                //
            });

        });
    });
}
*/
//var elementsWithBonuses = ["Eliminate", "Shared", "Websites"];

//document.querySelectorAll("#check").forEach((el) => { el.addEventListener("click", change); });
//document.querySelectorAll("#search")[0].addEventListener("input", searchAnime);
/*document.getElementsByTagName("body")[0].addEventListener("click", () => {
    document.getElementById("topSearchResultList").classList.add("hidden");
});*/

chrome.storage.local.get(null, function (items) {
    var defaultValues = { "Eliminate": true, "Shared": true, "Websites": true, "BonusEliminate": false, "BonusShared": false, "Kitsu": false, "AniDB": false };

    if (Object.keys(items).length == 0) {
        chrome.storage.local.set(defaultValues);
    }
    else {
        var keys = Object.keys(defaultValues);

        for (var i = 0; i < keys.length; i++) {
            document.getElementsByName(keys[i])[0].checked = items[keys[i]];

            if (!items[keys[i]]) $(".bonus" + keys[i]).hide();
        }
    }
});


$(document).ready(function () {

    $("body").click(function () {
        $("#topSearchResultList").toggleClass("hidden");
    });

    $(".check").click(function () {
        var jsonVar = {};
        jsonVar[this.name] = this.checked;
        chrome.storage.local.set(jsonVar);

        if (!this.checked) $(".bonus" + this.name).hide();
        else $(".bonus" + this.name).show();
    });

    $("#search").on("input", function () {
        var link = `https://myanimelist.net/search/prefix.json?type=anime&keyword=` + this.value + `&v=1`;

        $.get(link, function (response) {
            var items = response["categories"]["0"]["items"];
            var template = `
            <div class="list anime" id="@id"><a href="@href" class="clearfix">
                <div class="off"><span class="image" style="background-image: url(&quot;@image&quot;);"></span>
                    <div class="info anime">
                        <div class="name">@name <span class="media-type">(@media_type)</span></div>
                        <div class="extra-info hidden">Aired: @aired<br>Score: @score<br>Status: @status</div>
                    </div>
                </div>
            </a></div>`;

            if (items.length > 0) $("#topSearchResultList").removeClass("hidden").html("");

            for (var i = 0; i < items.length; i++)
                $("#topSearchResultList").append(template.replace("@name", items[i]["name"])
                    .replace("@aired", items[i]["payload"]["aired"]).replace("@score", items[i]["payload"]["score"])
                    .replace("@status", items[i]["payload"]["status"]).replace("@href", items[i]["url"]).replace("@id", items[i]["id"])
                    .replace("@image", items[i]["image_url"]).replace("@media_type", items[i]["payload"]["media_type"]));

            $("div.list.anime").on({
                "mouseenter mouseleave": function () {
                    $(this).toggleClass("focus");
                    $(this.children[0].children[0]).toggleClass("off on");
                    $(this).find(".extra-info").toggleClass("hidden");
                },
                "click": function () {
                    
                }
            });

        });
    });


});