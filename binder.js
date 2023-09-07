const devices = {},
	bindings = JSON.parse(localStorage.getItem("stb_bindings")) || {},
	doublePress = 100,
	inputCallbacks = [];
let gamepadAnimationFrame = null,
	lastGamepads = [],
	lastInput = null;


function getTime() {
	return Number(new Date());
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
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

	const touch = document.createElement('p');
	touch.textContent = 'Tap here to start touch controls';

	const info = document.createElement('p');
	info.textContent = 'Supports: Keyboards, Controllers (TV Remotes are some combination of controller or keybaord)';
	const notice = document.createElement('em');
	notice.textContent = 'Please dont press system buttons like "Home" or "Back", this website will not detect them, (and yes i tried)';

	popup.appendChild(heading);
	popup.appendChild(prompt);
	popup.appendChild(touch);
	popup.appendChild(info);
	popup.appendChild(notice);

	document.body.appendChild(popup);

	popup.addEventListener("touchstart", touchstart);
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

	popup.removeEventListener("touchstart", touchstart);
}



async function bindInput(button) {
	if (bindings[button]) return;
	createPopup(button);
	let bindingConfirmed = false;
	if (!bindings.hasOwnProperty(button)) bindings[button] = {};
	const btnBindings = bindings[button];

	while (!bindingConfirmed) {
		let input = await getInput();

		let buttons = getButtonsFromInput(input);
		if (buttons.includes("backup")) {
			return cancelBind();
		}

		editPrompt(`Press ${input.device} - ${input.action} again to confirm binding`);
		let input2 = {};
		while (Math.sign(input.value) !== Math.sign(input2.value)) {
			input2 = await getInput();


			let buttons = getButtonsFromInput(input2);
			if (buttons.map(b => b.button).includes("backup")) {
				return cancelBind();
			}
		}

		if (input.device == input2.device && input.action == input2.action) {
			if (!btnBindings.hasOwnProperty(input.device)) btnBindings[input.device] = {};
			const binding = btnBindings[input.device];
			binding.action = input.action;
			binding.value = input.value;
			binding.times = input.times;
			binding.precise = input.value === input2.value;
			editPrompt(`Successfully bound ${button} to ${input.device} - ${binding.action}`);

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
	localStorage.setItem("stb_bindings", JSON.stringify(bindings));
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
		console.debug(buttons);
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
	e.target.removeEventListener("touchstart", touchstart);
	cancelBind();
	document.querySelectorAll('p').forEach(p => p.remove());
	document.body.appendChild(createSkyRemoteContainer());
	setupMobileControls();
	resizeCanvas();

}


async function init() {
	await bindAll();
	deletePopup();
	await connectToGame();
};

init();


window.addEventListener("gamepadconnected", gamepadConnection);
