function showUpdateAnime(link) {
    $("#showUpdateAnime").removeClass("hidden");
    $("#showUpdateAnime").addClass("flex-center");

    $("#showUpdateAnime").css("height", "5em");
    $("#animeContainer").addClass("hidden");
    $("#eliminateAnime").addClass("hidden");
    $(".loader").removeClass("hidden");


    $.get(link, function (response) {
        var doc = document.createElement("div");
        doc.innerHTML = response;

        $("#showUpdateAnime").css("height", "");
        $("#showUpdateAnime").removeClass("flex-center");
        $("#animeContainer").removeClass("hidden");
        $("#eliminateAnime").removeClass("hidden");
        $(".loader").addClass("hidden");

        $("#myinfo_score > option[selected='selected']").removeAttr("selected");
        $("#myinfo_status > option[selected='selected']").removeAttr("selected");

        $("#csrf_token").attr("content", $(doc).find("meta[name='csrf_token']").attr("content"));
        $("#animeTitle > a").attr("name", $(doc).find("#myinfo_anime_id")[0].value);
        $("#animeTitle > a").html($(doc).find("h1.h1")[0].children[0].innerHTML);
        $("#animeImage > a > img").attr("src", $(doc).find("img.ac")[0].src);
        $("#myinfo_status > option[value='" + $(doc).find("#myinfo_status > option[selected='selected']")[0].getAttribute("value") + "']").attr("selected", "selected");
        $("#myinfo_watchedeps").attr("value", $(doc).find("#myinfo_watchedeps").attr("value"));
        $("#curEps").html($(doc).find("#curEps").html());
        $("#myinfo_score > option[value='" + $(doc).find("#myinfo_score > option[selected='selected']")[0].getAttribute("value") + "']").attr("selected", "selected");
        $("#animeTitle>a").attr("href", link);
        $("#animeImage>a").attr("href", link);
        $("#editLink").attr("href", $($(doc).find("input[name='myinfo_submit']")[0].parentNode).find("a").attr("href"));

        chrome.storage.local.set({ "anime": link });

        if ($(doc).find(".js-anime-add-button").length > 0)
            $(".inputButton.btn-middle.flat").attr("value", "Add");
        else
            $(".inputButton.btn-middle.flat").attr("value", "Update");
    });

}

function updateAnime() {
    var data = {
        "anime_id": Number($("#animeTitle > a").attr("name")),
        "status": Number($("#myinfo_status")[0].value),
        "score": Number($("#myinfo_score")[0].value),
        "num_watched_episodes": Number($("#myinfo_watchedeps")[0].value.replace(/[^0-9]/g, '')),
        "csrf_token": $("#csrf_token").attr("content")
    };

    $("#updateMessage").removeClass("hidden");
    $("#updateMessage").html("Loading...");

    if ($(".inputButton.btn-middle.flat").attr("value") == "Update")
        $.post("https://myanimelist.net/ownlist/anime/edit.json", JSON.stringify(data), function (data) {
            $("#updateMessage").html("Successfuly Updated");
            setTimeout(function () { $("#updateMessage").addClass("hidden") }, 3000);
        }).fail(function () {
            $("#updateMessage").html("Update failed");
            setTimeout(function () { $("#updateMessage").addClass("hidden") }, 3000);
        });

    else
        $.post("https://myanimelist.net/ownlist/anime/add.json", JSON.stringify(data), function (data) {
            $("#updateMessage").html("Successfuly Added");
            $(".inputButton.btn-middle.flat").attr("value", "Update");
            setTimeout(function () { $("#updateMessage").addClass("hidden") }, 3000);
        }).fail(function () {
            $("#updateMessage").html("Update failed");
            setTimeout(function () { $("#updateMessage").addClass("hidden") }, 3000);
        });
}

chrome.storage.local.get(null, function (items) {
    var defaultValues = { "Eliminate": true, "Shared": true, "Websites": true, "BonusEliminate": false, "BonusShared": false, "Kitsu": false, "AniDB": false };

    if (Object.keys(items).length == 0)
        chrome.storage.local.set(defaultValues);

    else {
        var keys = Object.keys(defaultValues);

        for (var i = 0; i < keys.length; i++) {
            document.getElementsByName(keys[i])[0].checked = items[keys[i]];
            if (!items[keys[i]]) $(".bonus" + keys[i]).hide();
        }

        if (items["anime"])
            showUpdateAnime(items["anime"]);
    }
});


$(document).ready(function () {

    $("body").click(function () {
        $("#topSearchResultList").addClass("hidden");
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
                    showUpdateAnime(this.children[0].href);
                }
            });

        });
    });

    $(".close-button").click(function () {
        $("#showUpdateAnime").addClass("hidden");
        chrome.storage.local.remove("anime");
    });

    $(".inputButton.btn-middle.flat").click(function () {
        updateAnime();
    });

    $(".js-anime-increment-episode-button").click(function () {
        var input = $("#myinfo_watchedeps")[0];
        input.value = (Number(input.value.replace(/[^0-9]/g, '')) + 1).toString();
        updateAnime();
    });

});