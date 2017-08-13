chrome.storage.local.get(["Eliminate"], function(items) {
    alert(JSON.stringify(items));
});