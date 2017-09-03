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

function searchAnime(e) {
    var link = `https://myanimelist.net/search/prefix.json?type=anime&keyword=` + e.target.value + `&v=1`;
    httpGetAsync(link, function (response) {
        var items = JSON.parse(response)["categories"]["0"]["items"];

        if (items.length > 0)
            document.getElementById("topSearchResultList").classList.remove("hidden");

        var template = `
        <div class="list anime"><a href="@href" class="clearfix">
            <div class="off"><span class="image" style="background-image: url(&quot;@image&quot;);"></span>
                <div class="info anime">
                    <div class="name">@name <span class="media-type">(@media_type)</span></div>
                    <div class="extra-info hidden">Aired: @aired<br>Score: @score<br>Status: @status</div>
                </div>
            </div>
        </a></div>`;

        document.getElementById("topSearchResultList").innerHTML = "";

        for (var i = 0; i < items.length; i++)
            document.getElementById("topSearchResultList").innerHTML += template.replace("@name", items[i]["name"])
                .replace("@aired", items[i]["payload"]["aired"]).replace("@score", items[i]["payload"]["score"])
                .replace("@status", items[i]["payload"]["status"]).replace("@href", items[i]["url"])
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

            });

        });
    });
}

var elementsWithBonuses = ["Eliminate", "Shared", "Websites"];

document.querySelectorAll("#check").forEach((el) => { el.addEventListener("click", change); });
document.querySelectorAll("#search")[0].addEventListener("input", searchAnime);
document.getElementById("topSearchResultList").addEventListener("mouseleave", () => {
    document.getElementById("topSearchResultList").classList.add("hidden");
});

chrome.storage.local.get(null, function (items) {
    var defaultValues = { "Eliminate": true, "Shared": true, "Websites": true, "BonusEliminate": false, "BonusShared": false, "Kitsu": false, "AniDB": false };

    if (Object.keys(items).length == 0) {
        chrome.storage.local.set(defaultValues);
    }
    else {
        var keys = Object.keys(defaultValues);

        for (var i = 0; i < keys.length; i++) {
            document.getElementsByName(keys[i])[0].checked = items[keys[i]];

            if (elementsWithBonuses.indexOf(keys[i]) != -1 && !items[keys[i]])
                document.querySelectorAll("#bonus" + keys[i]).forEach((el) => { el.className = "hidden"; });
        }
    }
});