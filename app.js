const urlParams = new URLSearchParams(location.search),
	gameEvents = {}
let gameid;
const games = {
	"sky-snake":"../sky-snake/app.js",
	"kurakku":"../kurakku/app.js",
	"tj_ff":"../tj_ff/app.js",
	"zk":"../zk/app.js",
	"bb":"../bb/app.js",
}

function toCORS(url) {
	return 'https://corsproxy.io/?' + encodeURIComponent(url);
}

function toDenki() {
	location.href = `https://denki.co.uk/sky/${gameid}/app.html`;
}

function replaceCanvas(element) {
	const canvas = document.getElementById("canvas");
	canvas.parentElement.replaceChild(element,canvas);
	// canvas.replaceWith(element)
	["id","class","tabindex","style","width","height"].forEach(attr => {
		element.setAttribute(attr, canvas.getAttribute(attr))
	});
	
}

async function loadSWF(swf,flashvars="") {
	window.RufflePlayer = window.RufflePlayer || {};

	const ruffle = window.RufflePlayer.newest(),
        player = ruffle.createPlayer();
		replaceCanvas(player)
        await player.load({
			url: swf,
			parameters:flashvars,
			
			// Options affecting the whole page
			"publicPath": undefined,
			"polyfills": true,
		
			// Options affecting files only
			"allowScriptAccess": true,
			"autoplay": "on",
			"unmuteOverlay": "hidden",
			"backgroundColor": null,
			"wmode": "transparent",
			"letterbox": "fullscreen",
			"warnOnUnsupportedContent": true,
			"contextMenu": "off",
			"showSwfDownload": true,
			"upgradeToHttps": window.location.protocol === "https:",
			"maxExecutionDuration": 15,
			"logLevel": "error",
			"base": null,
			"menu": false,
			"salign": "",
			"forceAlign": false,
			"scale": "showAll",
			"forceScale": true,
			"frameRate": null,
			"quality": "high",
			"splashScreen": false,
			"preferredRenderer": null,
			"openUrlMode": "allow",
			"allowNetworking": "all",
			"favorFlash": true,
		});

		return player
}


async function loadGame(scriptUrl) {
	const scriptElement = document.createElement("script")
		scriptElement.src = scriptUrl;

	document.body.appendChild(scriptElement)
}

function collectEvents() {

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

async function loadDenkiGame(scriptUrl) {
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


	scriptUrl = toCORS(scriptUrl)
	const appJS = scriptUrl.replace(".html", ".js"),
		appWasm = appJS.replace(".js", ".wasm"),
		appData = appJS.replace(".js", ".data"),
		response = await fetch(appJS),
		scriptContent = await response.text(),
		scriptElement = document.createElement("script");

	if(!response.ok) redirectToHelp();
		

	scriptElement.textContent = scriptContent.split("app.wasm").join(appWasm).split("app.data").join(appData);
	document.body.appendChild(scriptElement);


	// collectEvents();
}


window.addEventListener("load",async  () => {
	let pathname = location.pathname,gameid;
	if(!pathname.startsWith("/sky/")) pathname = "/sky"+location.pathname

	
	const gameUrl = urlParams.get("url") || "https://denki.co.uk" + pathname;
	result = /\/sky\/([a-zA-Z0-9-_]*)\/app\.html/.exec(pathname);

	if(result && result.length>1) gameid = result[1]

	if(gameid) {
		const hsBtn = document.getElementById("highscore_button")
		if(hsBtn) {
			hsBtn.href = "https://stb-gaming.github.io/high-scores/games/"+gameid
		}

		const gameUrl = games[gameid]|| urlParams.get("url") || "https://denki.co.uk" + pathname;

		try {
			if(gameUrl.includes("denki.co.uk")) {
				await loadDenkiGame(gameUrl)
			} else {
				document.getElementById("denki_button")?.remove();
				await loadGame(gameUrl)
			}
		} catch (error) {
			console.error(error)
			redirectToHelp();
		}
		setupTouchEvents();
		addGamepadEvents();
		addKeyboardEvents();

		collectEvents();
		connectToGame();
	} else {
		console.error("no gameid");
	}
});



SkyRemote.onTriggerEvent((type, options) => {
	console.debug({ type, options });
	if(gameEvents[type])	gameEvents[type](new KeyboardEvent(type, options));
	//Keep actvating SkyRemote.on####### events
	SkyRemote.constructor.triggerEvent(type,options)
});
