const uWindow = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;

const colours = {
	"red": { "down": "darkred", "up": "red" },
	"blue": { "down": "darkblue", "up": "blue" },
	"yellow": { "down": "goldenrod", "up": "yellow" },
	"green": { "down": "darkgreen", "up": "green" },
	"select": { "down": "darkcyan", "up": "cyan" },
	"backup": { "down": "dimgrey", "up": "black" },
	"help": { "down": "dimgrey", "up": "black" },
	"log": { "down": "dimgrey", "up": "black" }
}, mobileEvents = [];

function createSkyRemoteContainer() {
	const toolbar = document.getElementsByClassName("toolbar")[0]
	// Create the main container
	const skyRemoteContainer = document.createElement("span");
	skyRemoteContainer.id = "sky-remote-container";

	// Create the game log container
	const gameLogContainer = document.createElement("div");
	gameLogContainer.id = "game-log-container";

	// Create the game log
	const gameLog = document.createElement("div");
	gameLog.id = "game-log";
	gameLogContainer.appendChild(gameLog);

	// Create the sky remote
	const skyRemote = document.createElement("div");
	skyRemote.id = "sky-remote";

	// Create the dpad
	const dpad = document.createElement("div");
	dpad.id = "sky-remote-dpad";
	skyRemote.appendChild(dpad);

	// Create colored buttons
	const coloredButtons = ["yellow", "blue", "green", "red"];
	coloredButtons.forEach((color) => {
		const button = document.createElement("div");
		button.id = `sky-remote-${color}`;
		skyRemote.appendChild(button);
	});

	// Create additional buttons
	const additionalButtons = ["backup", "help", "log", "select"];
	additionalButtons.forEach((label) => {
		if (label == "log" && toolbar) {
			let logBtn = document.createElement("a")
			logBtn.classList.add("btn", "big", "trans")
			logBtn.innerText = "🖥️"
			logBtn.dataset.balloon = "Error Log"
			logBtn.href = "javascript:toggleLog()"
			toolbar.appendChild(logBtn);
			return
		}
		//if(label=="help"&&toolbar) return
		const button = document.createElement("div");
		button.id = `sky-remote-${label.replace(/\s+/g, "-").toLowerCase()}`;
		const span = document.createElement("span");
		span.innerText = label;
		button.appendChild(span);
		skyRemote.appendChild(button);
	});

	// Append everything to the main container
	skyRemoteContainer.appendChild(gameLogContainer);
	skyRemoteContainer.appendChild(skyRemote);

	return skyRemoteContainer;
}



let lastTouchEnd = 0,
	log = (function () {
		let { log, info, warn, error } = uWindow.console;
		return { log, info, warn, error };
	})(),
	queuedLogs = [];
function logLog(type, ...args) {
	const error = new Error();
	const stackTrace = error.stack.split("\n")[2].trim();

	log[type](...args);
	if (type == "debug") return
	let logLine = document.createElement("span");
	logLine.classList.add(type);
	let logText = document.createElement("p");
	logText.innerText = args.join(" ");
	logLine.appendChild(logText);

	// if(stackTrace) {
	// 	[_, fileName, lineNumber] = /([^\/]+):(\d+):\d+/g.exec(stackTrace)
	// 	let logLoc = document.createElement("span");
	// 	logLoc.innerText = `${fileName}:${lineNumber}`;
	// 	logLine.appendChild(logLoc);
	// }



	if (logLine.innerText === "Skyapp: SkyApp_Initialise)") resizeCanvas();
	if (document.getElementById("game-log")) {
		document.getElementById("game-log").appendChild(logLine);
	} else {
		queuedLogs.push(logLine);
	}
}

function createEvent(element, type, callback) {
	mobileEvents.push({ element, type, callback });
	element.addEventListener(type, callback);
}

function toggleLog() {
	let logContainer = document.getElementById("game-log-container");
	// console.debug(logContainer);
	logContainer.style.display = logContainer.style.display ? null : "none";
}

function setupMobileControls() {
	[
		{
			button: "select",
			element: document.getElementById("sky-remote-select")
		},
		{
			button: "backup",
			element: document.getElementById("sky-remote-backup")
		},
		{
			button: "help",
			element: document.getElementById("sky-remote-help")
		},
		{
			button: "red",
			element: document.getElementById("sky-remote-red")
		},
		{
			button: "green",
			element: document.getElementById("sky-remote-green")
		},
		{
			button: "yellow",
			element: document.getElementById("sky-remote-yellow")
		},
		{
			button: "blue",
			element: document.getElementById("sky-remote-blue")
		}
	].forEach(b => {
		if (!b.element || b.element == null) return
		createEvent(b.element, "touchstart", () => {
			if (typeof colours[b.button] !== 'undefined' && colours[b.button].down) {
				b.element.style.backgroundColor = colours[b.button].down;
			}
			SkyRemote.holdButton(b.button);
		});
		createEvent(b.element, "touchstart", () => {
			if (typeof colours[b.button] !== 'undefined' && colours[b.button].down) {
				b.element.style.backgroundColor = colours[b.button].down;
			}
			SkyRemote.holdButton(b.button);
		});
		createEvent(b.element, "touchend", () => {
			if (typeof colours[b.button] !== 'undefined' && colours[b.button].up) {
				b.element.style.backgroundColor = colours[b.button].up;
			}
			SkyRemote.releaseButton(b.button);
		});
	});
	const logButton = document.getElementById("sky-remote-log");
	if (logButton) {
		let toggleLogBtn = () => {
			logButton.style.backgroundColor = colours.log.up;
			toggleLog();

		};
		createEvent(logButton, "touchstart", () => { logButton.style.backgroundColor = colours.log.down; });
		createEvent(logButton, "touchend", toggleLogBtn);
	}
	toggleLog();

	let dpad = document.getElementById("sky-remote-dpad");

	function touchEvent(e) {
		if (e.type == "touchmove") {
			disablePinchZoom(e);
		}
		let dpad = e.currentTarget,
			bounds = dpad.getBoundingClientRect(),
			touch = e.targetTouches[0],

			x = 2 * (touch.clientX - bounds.left) / bounds.width - 1,
			y = 2 * (touch.clientY - bounds.top) / bounds.height - 1,
			deadZone = .2;
		if (Math.abs(x) < deadZone) x = 0;
		if (Math.abs(y) < deadZone) y = 0;
		//console.debug({ x, y });
		if (Math.sign(x) < 0) {
			SkyRemote.releaseButton("right");
			SkyRemote.holdButton("left");
		}
		if (Math.sign(x) > 0) {
			SkyRemote.releaseButton("left");
			SkyRemote.holdButton("right");
		}
		if (Math.sign(y) < 0) {
			SkyRemote.releaseButton("down");
			SkyRemote.holdButton("up");
		}
		if (Math.sign(y) > 0) {
			SkyRemote.releaseButton("up");
			SkyRemote.holdButton("down");
		}
	}

	createEvent(dpad, "touchstart", touchEvent);
	createEvent(dpad, "touchmove", touchEvent);
	createEvent(dpad, "touchend", e => {
		disableDoubleTapZoom();
		["up", "down", "left", "right"].forEach(d =>
			SkyRemote.releaseButton(d));
	});
}

function disablePinchZoom(e) {
	if (typeof e !== 'undefined' && e.scale !== 1) { e.preventDefault(); }
}


function disableDoubleTapZoom(e) {
	var now = (new Date()).getTime();
	if (now - lastTouchEnd <= 300 && typeof e !== 'undefined') {
		e.preventDefault();
	}
	lastTouchEnd = now;
}


uWindow.getQueuedLogs = function () {
	console.log(queuedLogs.map(l => l.classList.toString() + ": " + l.innerText).join(``));
};


Object.keys(log).forEach(type => {
	uWindow.console[type] = logLog.bind(null, type);
});



function touchstart(e) {
	uWindow.removeEventListener("touchstart", touchstart);
	if (typeof cancelBind !== 'undefined') cancelBind();
	document.querySelectorAll('p').forEach(p => p.remove());
	document.body.appendChild(createSkyRemoteContainer());

	const remove = [
		document.getElementById("fullscreen_button"),
		//document.getElementById("denki_button"),
		//document.getElementById("controls_button"),
		document.getElementById("help_button")
	]

	if (remove.length) {
		remove.forEach(r => r.remove());
		if (document.fullscreenElement) toggleFullscreen();
	}

	setupMobileControls();
}


function setupTouchEvents() {
	createEvent(uWindow, "touchstart", touchstart);
}

function removeTouchEvents() {
	let mobileEvent;
	do {
		mobileEvent = mobileEvents.pop();
		mobileEvent.element.removeEventListener(mobileEvent.type, mobileEvent.callback);
	} while (!!mobileEvents.length);
}
