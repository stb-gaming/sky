const urlParams = new URLSearchParams(location.search),
	portalFrame = document.getElementById("portal"),
	portalWindow = window.frames[0];


function setUrlBar(newURL) {
	history.pushState({}, null, newURL);
}

portalFrame.addEventListener("load", () => {
	urlParams.set('url', portalWindow.location.href);
	const newBrowserUrl = window.location.pathname + '?' + urlParams.toString();
	setUrlBar(newBrowserUrl);

	portalWindow.SkyRemote = window.SkyRemote;
});


if (urlParams.has("url")) {
	portalWindow.location.href = urlParams.get("url");
}
