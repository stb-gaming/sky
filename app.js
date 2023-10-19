const urlParams = new URLSearchParams(location.search),
	gameEvents = {};
let gameUrl;

function toCORS(url) {
	return 'https://corsproxy.io/?' + encodeURIComponent(url);
}

function toDenki() {
	location.href = gameUrl;
}


async function setAppUrl(url) {
	url = toCORS(url);

	const appJS = url.replace(".html", ".js"),
		appWasm = url.replace(".html", ".wasm"),
		appData = url.replace(".html", ".data"),
		response = await fetch(appJS),
		scriptContent = await response.text(),
		scriptElement = document.createElement("script");

	if(!response.ok) redirectToHelp();
		

	scriptElement.textContent = scriptContent.split("app.wasm").join(appWasm).split("app.data").join(appData);
	document.body.appendChild(scriptElement);

	const addEvt = window.addEventListener;

	window.addEventListener = function (...args) {
		const eventTypes = ["keydown", "keyup"];

		if (eventTypes.includes(args[0])) {
			if (!gameEvents.hasOwnProperty(args[0])) {

				console.debug(...args);
				gameEvents[args[0]] = args[1];
			}
		} else {
			addEvt(...args);
		}
	};
}

function initSnake() {
	let scriptElement = document.createElement("script");
	scriptElement.src = "../sky-snake/app.js"
	document.body.appendChild(scriptElement)
}

function denkiInit() {
	var statusElement = document.getElementById('status');
		var progressElement = document.getElementById('progress');
		var spinnerElement = document.getElementById('spinner');

		var Module = {
			preRun: [],
			postRun: [],
			print: (function () {
				var element = document.getElementById('output');
				if (element) element.value = ''; // clear browser cache
				return function (text) {
					if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
					// These replacements are necessary if you render to raw HTML
					//text = text.replace(/&/g, "&amp;");
					//text = text.replace(/</g, "&lt;");
					//text = text.replace(/>/g, "&gt;");
					//text = text.replace('\n', '<br>', 'g');
					console.log(text);
					if (element) {
						element.value += text + "\n";
						element.scrollTop = element.scrollHeight; // focus on bottom
					}
				};
			})(),
			printErr: function (text) {
				if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
				console.error(text);
			},
			canvas: (function () {
				var canvas = document.getElementById('canvas');

				// As a default initial behavior, pop up an alert when webgl context is lost. To make your
				// application robust, you may want to override this behavior before shipping!
				// See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
				canvas.addEventListener("webglcontextlost", function (e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

				return canvas;
			})(),
			setStatus: function (text) {
				if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
				if (text === Module.setStatus.last.text) return;
				var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
				var now = Date.now();
				if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
				Module.setStatus.last.time = now;
				Module.setStatus.last.text = text;
				if (m) {
					text = m[1];
					progressElement.value = parseInt(m[2]) * 100;
					progressElement.max = parseInt(m[4]) * 100;
					progressElement.hidden = false;
					spinnerElement.hidden = false;
				} else {
					progressElement.value = null;
					progressElement.max = null;
					progressElement.hidden = true;
					if (!text) spinnerElement.hidden = true;
				}
				statusElement.innerHTML = text;
			},
			totalDependencies: 0,
			monitorRunDependencies: function (left) {
				this.totalDependencies = Math.max(this.totalDependencies, left);
				Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
			}
		};
		Module.setStatus('Downloading...');
		window.Module = Module
		window.onerror = function () {
			Module.setStatus('Exception thrown, see JavaScript console');
			spinnerElement.style.display = 'none';
			Module.setStatus = function (text) {
				if (text) Module.printErr('[post-exception status] ' + text);
			};
		};
}


window.addEventListener("load", () => {
	let pathname = location.pathname,gameid;
	if(!pathname.startsWith("/sky/")) pathname = "/sky"+location.pathname

	
	gameUrl = urlParams.get("url") || "https://denki.co.uk" + pathname;
	const gameIdRX = /https:\/\/denki\.co\.uk\/sky\/([a-zA-Z0-9-]*)\/app\.html/,
	result= gameIdRX.exec(gameUrl);
	window.t = {gameUrl,gameIdRX,result}

	if(result && result.length>1) gameid = result[1]

	if(gameid) {
		console.log(gameid);
		const hsBtn = document.getElementById("highscore_button")
		if(hsBtn) {
			hsBtn.href = "https://stb-gaming.github.io/high-scores/games/"+gameid
		}

		try {
			switch (gameid.toLowerCase()) {
				case "sky-snake":
					initSnake()
					break;
				default:
					denkiInit();
					setAppUrl(gameUrl);
					break;
			}
		} catch (error) {
			//redirectToHelp();
		}

		setupTouchEvents();
		addGamepadEvents();
		addKeyboardEvents();
		//setupMidi();
		connectToGame();
	} else {
		console.error("no gameid");
	}
});



SkyRemote.onTriggerEvent((type, options) => {
	console.debug({ type, options });
	if(gameEvents[type])	gameEvents[type](new KeyboardEvent(type, options));
});
