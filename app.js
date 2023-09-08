const urlParams = new URLSearchParams(location.search), , gameEvents = {};

function toCORS(url) {
	return 'https://corsproxy.io/?' + encodeURIComponent(url); (edited);
}



async function setAppUrl(url) {
	url = toCORS(url);

	const appJS = url.replace(".html", ".js"),
		appWasm = url.replace(".html", ".wasm"),
		appData = url.replace(".html", ".data"),
		response = await fetch(appJS),
		scriptContent = await response.text(),
		scriptElement = document.createElement("script");
	scriptElement.textContent = scriptContent.split("app.wasm").join(appWasm).split("app.data").join(appData);
	document.body.appendChild(scriptElement);

	const addEvt = window.addEventListener;

	window.addEventListener = function (...args) {
		const eventTypes = ["keydown", "keyup"];

		if (eventTypes.includes(args[0])) {
			if (!gameEvents.hasOwnProperty(args[0])) {

				console.log(...args);
				gameEvents[args[0]] = args[1];
			}
		} else {
			addEvt(...args);
		}
	};
}

window.addEventListener("DOMContentLoaded", () => {
	setAppUrl(urlParams.get("url") || "https://denki.co.uk" + location.pathname);
});



SkyRemote.onTriggerEvent((type, options) => {
	console.log({ type, options });
	gameEvents[type](new KeyboardEvent(type, options));
});
