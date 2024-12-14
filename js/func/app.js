const urlParams = new URLSearchParams(location.search),
	gameEvents = {},
	games = {
		"sky-snake": "../sky-snake/app.js",
		"kurakku": "../kurakku/app.js",
		"tj_ff": "../tj_ff/app.js",
		"eea": "../eea/app.js",
		"zk": "../zk/app.js",
		"bb": "../bb/app.js",
		"op": "../op/app.js",
		"pjd": "../pjd/app.js",
		"tm": "../tm/app.js",
		"wwk": "../wwk/app.js",
		"tra": "static",
		"ppg": "static",
		"dlrr": "static",
		"sdff": "static",
	}, additionalOnTriggerEvents = [];
let gameid;

function toCORS(url) {
	return 'https://corsproxy.io/' + encodeURIComponent(url);
}

function toDenki() {
	location.href = `https://denki.co.uk/sky/${gameid}/app.html`;
}

function waitDom() {
	return new Promise((res, rej) => {
		document.addEventListener("DOMContentLoaded", res)
	});
}

function replaceCanvas(element) {
	const canvas = document.getElementById("canvas");
	canvas.parentElement.replaceChild(element, canvas);
	// canvas.replaceWith(element)
	["id", "class", "tabindex", "style", "width", "height"].forEach(attr => {
		element.setAttribute(attr, canvas.getAttribute(attr))
	});

}

async function createRuffle(swf, flashvars = "") {
	window.RufflePlayer = window.RufflePlayer || {};

	const ruffle = window.RufflePlayer.newest(),
		player = ruffle.createPlayer();
	replaceCanvas(player)
	await player.load({
		url: swf,
		parameters: flashvars,

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

	eventTarget = player.shadowRoot.querySelector("canvas");

	additionalOnTriggerEvents.push(() => {
		eventTarget.focus()
	})

	return player
}

function loadMouseBinds(player, mouseBinds) {
	const binder = new MouseBinder(player, mouseBinds);
	binder.setEventTarget(player.shadowRoot.querySelector("canvas"), "pointer", PointerEvent)
}

function loadRebinds(player, rebinds) {
	for (const { button, codes, keyCodes, keys } of rebinds) {
		const binding = SkyRemote.getBinding(button)
		binding.codes = codes
		binding.keyCodes = keyCodes
		binding.keys = keys
	}
}

async function createSkyRemoteChanges() {
	removeKeyboardEvents()
	unCollectEvents()
	cancelBind()
	const bindings = [], buttons = "select,backup,up,down,left,right,red,green,blue,yellow,help".split(",")
	async function getKey() {
		return new Promise((res, rej) => {
			const event = "keyup";
			function callback(e) {
				window.removeEventListener(event, callback)
				res(e)
			}
			window.addEventListener(event, callback)
		})
	}
	let button;

	do {
		button = prompt(`Type the name of a sky remote button such as:
${buttons.join(", ")}
Leave blank if you are finished.`);
		if (button) {
			if (buttons.includes(button)) {
				let e, confirmed;
				do {
					alert(`Press 'OK' and then press the key that the game looks for when the player wants to press '${button}'`)
					e = await getKey()
					alert(`Press OK and press ${e.key} again `);
					confirmed = (await getKey()).key == e.key;
				} while (!confirmed)
				bindings.push({
					button,
					keys: [e.key],
					codes: [e.code],
					keyCodes: [e.keyCode]
				})
				alert(`Saved ${button} as ${e.key}`)
			} else {
				alert("Invalid SkyRemote Button")
			}
		}
	} while (button);

	prompt("Here are your finished bindings, copy this into app.js:", JSON.stringify(bindings))

}
function appendToHead(element) {
	if (document.head) {
		document.head.appendChild(element);
	} else {
		window.addEventListener("DOMContentLoaded", () => {
			document.head.appendChild(element);
		});
	}
}

function appendToBody(element) {
	if (document.body) {
		document.body.appendChild(element);
	} else {
		window.addEventListener("DOMContentLoaded", () => {
			document.body.appendChild(element);
		});
	}
}

let stbToolsSummoned = false;

function SummonSTBTools() {
	if (stbToolsSummoned) return
	stbToolsSummoned = true;
	let gameContainers = document.getElementsByClassName("emscripten_border");
	if (!gameContainers || !gameContainers.length) gameContainers = document.getElementsByClassName("monogame_border")
	if (!gameContainers || !gameContainers.length) throw new Error("No Game Containers were found");
	const gameContainer = gameContainers[0];
	if (!gameContainer) throw new Error("No Game Container was found")

	const topToolbar = new Toolbar(gameContainer),
		leftToolbar = new Toolbar(gameContainer);
	//rightToolbar = new Toolbar(gameContainer);
	topToolbar.classList.add("top")
	leftToolbar.classList.add("left")
	//rightToolbar.classList.add("right")
	if (window.mouseBinder) {
		window.mouseBinder.posEditor.helperButtonsMenus(topToolbar);
		window.mouseBinder.posEditor.helperButtonsPos(leftToolbar);
	}
	topToolbar.addButton({ label: "Change Sky Remote", emoji: "📺", action: createSkyRemoteChanges })

	setTimeout(() => alert("Game Setup Mode Activated 🥳"), 0)
}

async function loadSWF(...args) {
	window.appJS = [...args];
	function getSWF(value) {
		return typeof value == "string" &&
			value.endsWith(".swf")
	}
	function getMouseBinds(value) {
		return typeof value == "object" && !Array.isArray(value);
	}
	function getSkyRemoteRebinds(value) {
		return Array.isArray(value)
	}
	function getArg(cb) {
		const i = args.findIndex(cb)
		if (i !== -1) {
			const thing = args[i]
			delete args[i];
			return thing
		}
	}
	const swf = getArg(getSWF),
		rebinds = getArg(getSkyRemoteRebinds) || [],
		mouseBinds = getArg(getMouseBinds) || {};
	if (typeof swf === 'undefined') throw new Error("No SWF Specified")
	const player = await createRuffle(swf);

	if (mouseBinds) {
		loadMouseBinds(player, mouseBinds)
	}
	if (rebinds) {
		loadRebinds(player, rebinds);
	}

	return player
}


async function loadGame(scriptUrl) {
	const scriptElement = document.createElement("script")
	scriptElement.src = scriptUrl;

	appendToBody(scriptElement)
}

function collectEvents() {
	EventTarget.prototype.addEventListenerOld = window.addEventListener
	EventTarget.prototype.addEventListener = function (...args) {
		const eventTypes = ["keydown", "keyup"];
		console.debug(this, "addEventListener", args)
		if (typeof args[1] === "function") console.debug(args[1].name)

		if (eventTypes.includes(args[0]) && !gameEvents.hasOwnProperty(args[0]) && args.length < 4) {

			console.debug("EVENT COLLECTED", ...args);
			gameEvents[args[0]] = args[1];
		} else if (args[0] === "load") {
			args[1]();
		} else {
			this.addEventListenerOld(...args);
		}
	};
}

function unCollectEvents() {
	window.addEventListener = window.addEventListenerOld
}


async function getFileContents(src) {
	const response = await fetch(src);

	if (!response.ok) return redirectToHelp();

	content = await response.text();
	return content
}

function wait(ms = 0) {
	return new Promise((res, rej) => {
		setTimeout(res, ms)
	})
}


async function runJS(src) {
	const content = await getFileContents(src)

	await (new Function(content)).call(globalThis);
}

async function loadJS(src, text) {
	const scriptElement = document.createElement("script");
	scriptElement.defer = true
	if (src) {
		if (text)
			scriptElement.textContent = await getFileContents(src)
		else
			scriptElement.src = src
	}
	appendToBody(scriptElement)
	return scriptElement
}
async function loadJSContent(content) {
	const scriptElement = document.createElement("script");
	scriptElement.defer = true
	if (content) {
		scriptElement.textContent = content;
	}
	appendToBody(scriptElement)
	return scriptElement
}

async function loadDenkiGame(scriptUrl) {
	await waitDom();
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
		scriptContent = await getFileContents(appJS);

	await loadJSContent(scriptContent.split("app.wasm").join(appWasm).split("app.data").join(appData))
}

if (!window.setWindowTitle) {
	window.setWindowTitle = (t) => {
		document.title = t
	}
}

async function initPortal() {

	let pathname = location.pathname;
	if (!pathname.startsWith("/sky/")) pathname = "/sky" + location.pathname


	const gameUrl = urlParams.get("url") || "https://denki.co.uk" + pathname;
	result = /\/sky\/([a-zA-Z0-9-_]*)\/app\.html/.exec(pathname);

	if (result && result.length > 1) gameid = result[1];
	if (gameid === "ask") gameid = prompt("Enter GameID")

	if (gameid) {
		const hsBtn = document.getElementById("highscore_button")
		if (hsBtn) {
			hsBtn.href = "https://stb-gaming.github.io/high-scores/games/" + gameid
		}
		setupTouchEvents();
		addGamepadEvents();
		addKeyboardEvents();
		//collectEvents();


		const gameUrl = games[gameid] || urlParams.get("url") || "https://denki.co.uk/sky/" + gameid + "/app.html";
		if (gameUrl != "static")
			try {
				if (gameUrl.includes("denki.co.uk")) {

					await loadDenkiGame(gameUrl)
				} else {
					document.getElementById("denki_button")?.remove();
					await loadGame(gameUrl)
				}
			} catch (error) {
				console.error(error)
				redirectToHelp();
			}
		connectToGame();
		window.setWindowTitle(gameid)
	} else {
		console.error("no gameid");
	}
}

collectEvents();
initPortal();


SkyRemote.onTriggerEvent((type, options, element) => {
	console.debug({ type, options });
	for (const E of additionalOnTriggerEvents) {
		E();
	}
	if (gameEvents[type]) gameEvents[type](new KeyboardEvent(type, options));
	//Keep actvating SkyRemote.on####### events
	SkyRemote.constructor.triggerEvent(type, options, element)
});
