const urlParams = new URLSearchParams(location.search),
	portalFrame = document.getElementById("portal"),
	portalWindow = window.frames[0];

let portalLoaded = false;

function setUrlBar(url) {
	history.pushState({}, null, url);
}

function setFrameUrl(url) {
	portalWindow.location.href = url;
}

portalFrame.addEventListener("load", () => {
	console.log(urlParams.toString());
	setUrlBar(location.pathname + '?' + urlParams.toString());
});


if (urlParams.has("url")) setFrameUrl(urlParams.get("url"));
