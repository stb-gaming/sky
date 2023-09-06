const devices = {},
	bindings = {},
	doublePress = 100,
	inputCallbacks = [];
let gamepadAnimationFrame = null,
	lastGamepads = [],
	lastInput = null;

function getTime() {
	return Number(new Date());
}


function collectInput(device, action, value) {
	let currentTime = getTime();
	if (!devices.hasOwnProperty(device)) devices[device] = {};
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

["keyup", "keydown"].forEach(type => window.addEventListener(type, e => {
	collectInput("keyboard", e.code, e.type == "keydown");
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
	console.log("New Gamepad");
	if (countGamepads() > 0) {
		console.log("Started Gamepad loop");
		startGamepadLoop();
		window.removeEventListener("gamepadconnected", gamepadConnection);
	}
}

function gamepadDisconnection() {
	if (countGamepads() == 0) {
		console.log("Stopped Gamepad loop");
		cancelAnimationFrame(gamepadAnimationFrame);
		window.addEventListener("gamepadconnected", gamepadConnection);
		window.removeEventListener("gamepaddisconnected", gamepadDisconnection);
	}
}

function onInput(cb) {
	return inputCallbacks.push(cb) - 1;
}

function getInput() {
	return new Promise(resolve => {
		let id;
		id = onInput(input => {
			resolve(input);
			inputCallbacks.splice(id, 1);
		});
	});
}


function createPopup(button) {
	if (document.querySelector('.bind-popup')) {
		editPrompt(`Press a key to bind ${button}...`);
		return;
	}

	const popup = document.createElement('div');
	popup.classList.add('bind-popup');

	const heading = document.createElement('h1');
	heading.textContent = 'Creating Binds';

	const prompt = document.createElement('p');
	prompt.id = 'bind-prompt';
	prompt.textContent = `Press a key to bind ${button}...`;

	const info = document.createElement('p');
	info.textContent = 'Supports: Keyboards, Controllers (TV Remotes are some combination of controller or keybaord)';
	const notice = document.createElement('em');
	notice.textContent = 'Please dont press system buttons like "Home" or "Back", this website will not detect them, (and yes i tried)';

	popup.appendChild(heading);
	popup.appendChild(prompt);
	popup.appendChild(info);
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


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


async function bindInput(button) {
	createPopup(button);
	let bindingConfirmed = false;
	if (!bindings.hasOwnProperty(button)) bindings[button] = {};
	const btnBindings = bindings[button];

	while (!bindingConfirmed) {
		let input = await getInput(),

			// use later for chords
			state = devices[input.devices];

		editPrompt(`Press ${input.device} - ${input.action} again to confirm binding`);
		let input2 = {};
		while (Math.sign(input.value) !== Math.sign(input2.value)) {
			input2 = await getInput();
		}

		// use kater for chords
		let state2 = devices[input2.device];

		if (input.device == input2.device && input.action == input2.action) {
			if (!btnBindings.hasOwnProperty(input.device)) btnBindings[input.device] = {};
			const binding = btnBindings[input.device];
			binding.actions = [input.action];
			binding.values = [input.value];
			binding.times = input.times;
			binding.precise = input.value === input2.value;
			editPrompt(`Successfully bound ${button} to ${input.device} - ${binding.actions}`);

			bindingConfirmed = true;
			await sleep(1000);
		} else {
			editPrompt(`Failed to bind ${button}`);
			await sleep(1000);
		}
	}


}

async function bindAll() {
	for (const button of ["select", "backup", "up", "down", "left", "right", "red", "green", "yellow", "blue"]) {
		await bindInput(button);
	}
}

async function init() {
	await bindAll();
	deletePopup();
};

init();




window.addEventListener("gamepadconnected", gamepadConnection);
