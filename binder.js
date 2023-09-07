const devices = {},
	bindings = JSON.parse(localStorage.getItem("stb_bindings")) || {},
	doublePress = 100,
	inputCallbacks = [],
	newDeviceQueue = [];
let gamepadAnimationFrame = null,
	lastGamepads = [],
	lastInput = null;


function getTime() {
	return Number(new Date());
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function deviceBound(device) {
	if (!Object.keys(bindings).length) return false;
	for (const button in bindings) {
		if (!bindings[button].hasOwnProperty(device)) {
			return false;
		}
	}
	return true;
}

function collectInput(device, action, value) {
	let currentTime = getTime();
	if (!devices.hasOwnProperty(device)) {
		devices[device] = {};
		if (!deviceBound(device) && !newDeviceQueue.includes(device)) {
			newDeviceQueue.push(device);
			if (!popupExists()) bindAll();
			return;
		}

	}
	if (!devices[device].hasOwnProperty(action)) devices[device][action] = { times: 0 };

	const inputStatus = devices[device][action];
	inputStatus.value = value;

	if (value) {
		if ((currentTime - inputStatus.last) > doublePress) {
			inputStatus.times = 0;
		}
		inputStatus.times++;
	} else {
		inputStatus.last = currentTime;
	}

	const input = { device, action, ...inputStatus };


	for (const callback of inputCallbacks) {
		callback(input);
	}
}


function onInput(cb) {
	return inputCallbacks.push(cb) - 1;
}


function getInput(device) {
	return new Promise(resolve => {
		let id;
		id = onInput(input => {
			if (!device || input.device == device) {
				resolve(input);
				inputCallbacks.splice(id, 1);
			}
		});
	});
}



["keyup", "keydown"].forEach(type => window.addEventListener(type, e => {
	collectInput("Keyboard", e.code, e.type == "keydown");
}));

function countGamepads() {
	return navigator.getGamepads().filter(g => !!g).length;
}


function gamepadLoop() {
	let gamepads = navigator.getGamepads();
	if (countGamepads() < 2) {
		gamepadDisconnection();
		window.addEventListener("gamepaddisconnected", gamepadDisconnection);
	}
	if (countGamepads() > 1) window.removeEventListener("gamepaddisconnected", gamepadDisconnection);

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
				collectInput(gamepad.id, "Button" + bid, button.pressed);
			}
		}
		if (!gamepad.axes) {
			console.warn("Gamepad has no buttons");
		}
		for (const aid in gamepad.axes) {
			const axis = gamepad.axes[aid], lastAxis = lastGamepad.axes[aid];
			if (lastAxis !== axis) {
				//TODO collect multiple axis
				collectInput(gamepad.id, "Axis" + aid, axis);
			}
		}

	}

	lastGamepads = gamepads;

	startGamepadLoop();
}
function startGamepadLoop() {
	gamepadAnimationFrame = requestAnimationFrame(gamepadLoop);
}

function gamepadConnection() {
	console.debug("New Gamepad");
	if (countGamepads() > 0) {
		console.debug("Started Gamepad loop");
		startGamepadLoop();
		window.removeEventListener("gamepadconnected", gamepadConnection);
	}
}

function gamepadDisconnection() {
	if (countGamepads() == 0) {
		console.debug("Stopped Gamepad loop");
		cancelAnimationFrame(gamepadAnimationFrame);
		window.addEventListener("gamepadconnected", gamepadConnection);
		window.removeEventListener("gamepaddisconnected", gamepadDisconnection);
	}
}

function popupExists() {
	return !!document.querySelector('.bind-popup');
}


function createPopup(device, button) {
	if (popupExists()) {
		editPrompt(`Press a key to bind ${button}...`);

		const bindDevice = document.getElementById('bind-devuce');
		bindDevice.innerText = device;

		return;
	}

	const popup = document.createElement('div');
	popup.classList.add('bind-popup');

	const heading = document.createElement('h1');
	heading.textContent = 'New Device: ';

	const deviceText = document.createElement('h3');
	deviceText.id = "bind-device";
	deviceText.textContent = device;

	const prompt = document.createElement('p');
	prompt.id = 'bind-prompt';
	prompt.textContent = `Press a key to bind ${button}...`;


	const notice = document.createElement('em');
	notice.textContent = 'Please dont press system buttons like "Home" or "Back", this website will not detect them, (and yes i tried)';

	popup.appendChild(heading);
	popup.appendChild(deviceText);;
	popup.appendChild(prompt);
	popup.appendChild(notice);

	document.body.appendChild(popup);

}

function editPrompt(newprompt) {
	const promptElement = document.getElementById('bind-prompt');
	if (promptElement) {
		promptElement.textContent = newprompt;
	}
}

function deletePopup() {
	const popup = document.querySelector('.bind-popup');
	if (popup) {
		popup.remove();
	}
}



async function bindInput(device, button) {
	createPopup(device, button);
	let bindingConfirmed = false;
	if (!bindings.hasOwnProperty(button)) bindings[button] = {};
	const btnBindings = bindings[button];

	while (!bindingConfirmed) {
		let input = {};
		while (!input.value) input = await getInput(device);

		editPrompt(`Press ${input.action} again to confirm binding to ${button}`);
		let input2 = {};
		while (Math.sign(input.value) !== Math.sign(input2.value)) {
			input2 = await getInput(device);
		}

		if (input.device == input2.device && input.action == input2.action) {
			if (!btnBindings.hasOwnProperty(input.device)) btnBindings[input.device] = {};
			const binding = btnBindings[input.device];
			binding.action = input.action;
			binding.value = input.value;
			binding.times = input.times;
			binding.precise = input.value === input2.value;
			editPrompt(`Successfully bound ${button} to ${binding.action}`);

			bindingConfirmed = true;
			await sleep(1000);
		} else {
			editPrompt(`Failed to bind ${button}`);
			await sleep(1000);
		}
	}


}

async function bindAll() {
	while (newDeviceQueue.length) {
		const device = newDeviceQueue.shift();
		for (const button of ["select", "backup", "up", "down", "left", "right", "red", "green", "yellow", "blue"]) {
			await bindInput(device, button);
		}
		localStorage.setItem("stb_bindings", JSON.stringify(bindings));
	}

	deletePopup();
}

function cancelBind() {
	deletePopup();
	inputCallbacks.length = 0;
}


function getButtonsFromInput(input) {
	const boundButtons = [];
	for (const skyButton in bindings) {
		const btnBindings = bindings[skyButton];
		if (!btnBindings.hasOwnProperty(input.device)) continue;
		const binding = btnBindings[input.device];
		console.debug({ skyButton, binding, input });
		if ((binding.action || binding.actions[0]) === input.action && binding.times == input.times) {
			if (!input.value) {
				boundButtons.push({ button: skyButton, value: !!input.value });
			}
			if (binding.precise) {
				if ((binding.value || binding.values[0]) === input.value) {
					boundButtons.push({ button: skyButton, value: !!input.value });
				}
			} else {
				if ((Math.sign(binding.value) || binding.values.map(v => Math.sign(v))) === Math.sign(input.value)) {
					boundButtons.push({ button: skyButton, value: !!input.value });
				}
			}
		}
	}
	return boundButtons;
}

function connectToGame() {
	onInput(input => {
		let buttons = getButtonsFromInput(input);
		for (const button of buttons) {
			if (button.value) {
				console.debug("Holding", button.button);
				SkyRemote.holdButton(button.button);
			} else {
				console.debug("Releasing", button.button);
				SkyRemote.releaseButton(button.button);
			}
		}
	});
}

function touchstart(e) {
	window.removeEventListener("touchstart", touchstart);
	cancelBind();
	document.querySelectorAll('p').forEach(p => p.remove());
	document.body.appendChild(createSkyRemoteContainer());
	setupMobileControls();
}


async function init() {
	await connectToGame();
};

init();


window.addEventListener("gamepadconnected", gamepadConnection);
window.addEventListener("touchstart", touchstart);
