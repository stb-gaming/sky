function createSkyRemoteContainer() {
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

	// Create dpad buttons
	const dpadButtons = ["up", "left", "right", "down"];
	dpadButtons.forEach((direction) => {
		const button = document.createElement("div");
		button.id = `sky-remote-dpad-${direction}`;
		dpad.appendChild(button);
	});
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



let log = (function () {
	let { log, info, warn, error } = window.console;
	return { log, info, warn, error };
})(),
	queuedLogs = [];
function logLog(type, ...args) {
	log[type](...args);
	let logLine = document.createElement("p");
	logLine.classList.add(type);
	logLine.innerText = args.join(" ");
	if (logLine.innerText === "Skyapp: SkyApp_Initialise)") resizeCanvas();
	if (document.getElementById("game-log")) {
		document.getElementById("game-log").appendChild(logLine);
	} else {
		queuedLogs.push(logLine);
	}
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
		b.element.addEventListener("touchstart", () => {
			SkyRemote.holdButton(b.button, portalWindow, true);
		});
		b.element.addEventListener("touchend", () => {
			SkyRemote.releaseButton(b.button, portalWindow, true);
		});
	});
	let toggleLog = () => {
		let logContainer = document.getElementById("game-log-container");
		console.log(logContainer);
		logContainer.style.display = logContainer.style.display ? null : "none";
	};
	document.getElementById("sky-remote-log").addEventListener("touchend", toggleLog);
	toggleLog();

	let dpad = document.getElementById("sky-remote-dpad");

	function touchEvent(e) {
		let dpad = e.currentTarget,
			bounds = dpad.getBoundingClientRect(),
			touch = e.targetTouches[0],

			x = 2 * (touch.clientX - bounds.left) / bounds.width - 1,
			y = 2 * (touch.clientY - bounds.top) / bounds.height - 1,
			deadZone = .2;
		if (Math.abs(x) < deadZone) x = 0;
		if (Math.abs(y) < deadZone) y = 0;
		console.log({ x, y });
		if (Math.sign(x) < 0) {
			SkyRemote.releaseButton("right", portalWindow, true);
			SkyRemote.holdButton("left", portalWindow, true);
		}
		if (Math.sign(x) > 0) {
			SkyRemote.releaseButton("left", portalWindow, true);
			SkyRemote.holdButton("right", portalWindow, true);
		}
		if (Math.sign(y) < 0) {
			SkyRemote.releaseButton("down", portalWindow, true);
			SkyRemote.holdButton("up", portalWindow, true);
		}
		if (Math.sign(y) > 0) {
			SkyRemote.releaseButton("up", portalWindow, true);
			SkyRemote.holdButton("down", portalWindow, true);
		}
	}

	dpad.addEventListener("touchstart", touchEvent);
	dpad.addEventListener("touchmove", touchEvent);
	dpad.addEventListener("touchend", e => {
		["up", "down", "left", "right"].forEach(d =>
			SkyRemote.releaseButton(d, portalWindow, true));
	});
}

window.getQueuedLogs = function () {
	console.log(queuedLogs.map(l => l.classList.toString() + ": " + l.innerText).join(`
		`));
};


Object.keys(log).forEach(type => {
	window.console[type] = logLog.bind(null, type);
});
