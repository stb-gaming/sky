const devices = {
	keyboard: {}
},
	doublePress = 100;
let gamepadAnimationFrame = null,
	lastGamepads = [];

function getTime() {
	return Number(new Date());
}

function onInput(device, input, value) {
	let currentTime = getTime();
	if (!devices.hasOwnProperty(device)) devices[device] = {};
	if (!devices[device].hasOwnProperty(input)) devices[device][input] = { times: 0 };

	const inputStatus = devices[device][input];
	inputStatus.value = value;

	if (value) {
		if ((currentTime - inputStatus.last) > doublePress) {
			inputStatus.times = 0;
		}
		inputStatus.times++;
	} else {
		inputStatus.last = currentTime;
	}

	console.log({ device, input, ...inputStatus });
}

["keyup", "keydown"].forEach(type => window.addEventListener(type, e => {
	onInput("keyboard", e.code, e.type == "keydown");
}));

function countGamepads() {
	return navigator.getGamepads().filter(g => !!g).length;
}


function gamepadLoop() {
	let gamepads = navigator.getGamepads();
	if (countGamepads() < 2) {
		onGamepadRemoval();
		window.addEventListener("gamepaddisconnected", onGamepadRemoval);
	}
	if (countGamepads() > 1) window.removeEventListener("gamepaddisconnected", onGamepadRemoval);

	//  TODO: check for differences in buttons and axis and cal the oninput event accordingly

	for (const gid in gamepads) {
		if (!gamepads[gid] || !lastGamepads[gid]) continue;
		const gamepad = gamepads[gid], lastGamepad = lastGamepads[gid];
		if (!gamepad.buttons) {
			console.warn("Gamepad has no buttons");
		}
		for (const bid in gamepad.buttons) {
			const button = gamepad.buttons[bid], lastButton = lastGamepad.buttons[bid];
			if (button && lastButton && lastButton.pressed !== button.pressed) {
				onInput(gamepad.id, "Button" + bid, button.pressed);
			}
		}
		if (!gamepad.axes) {
			console.warn("Gamepad has no buttons");
		}
		for (const aid in gamepad.axes) {
			const axis = gamepad.axes[aid], lastAxis = lastGamepad.axes[aid];
			if (lastAxis !== axis) {
				onInput(gamepad.id, "Axis" + aid, axis);
			}
		}

	}

	lastGamepads = gamepads;

	startGamepadLoop();
}
function startGamepadLoop() {
	gamepadAnimationFrame = requestAnimationFrame(gamepadLoop);
}

function onGamepadAddition() {
	console.log("New Gamepad");
	if (countGamepads() > 0) {
		console.log("Started Gamepad loop");
		startGamepadLoop();
		window.removeEventListener("gamepadconnected", onGamepadAddition);
	}
}

function onGamepadRemoval() {
	if (countGamepads() == 0) {
		console.log("Stopped Gamepad loop");
		cancelAnimationFrame(gamepadAnimationFrame);
		window.addEventListener("gamepadconnected", onGamepadAddition);
		window.removeEventListener("gamepaddisconnected", onGamepadRemoval);
	}
}

window.addEventListener("gamepadconnected", onGamepadAddition);
