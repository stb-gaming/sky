/**
 * Init
 * addGamepadEvents()
 * addKeybaordEvents()
 * connectToGame()
 * setupMidi()
 *
 * React useEffect return
 * removeGamepadEvents()
 * removeKeyboardEvents()
 * cleanUpMidi()
 */

const devices = {},
	bindings = JSON.parse(localStorage.getItem("stb_bindings")) || {},
	doublePress = 100,
	inputCallbacks = [],
	newDeviceQueue = [];
buttons = ["select", "backup", "up", "down", "left", "right", "red", "green", "yellow", "blue", "help"];
let gamepadAnimationFrame = null,
	lastGamepads = [],
	lastInput = null,
	midiAccess = null;


function getTime() {
	return new Number(new Date());
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

/**
 * 
 * @param {KeyboardEvent} e 
 */
function keyboardCollector(e) {
	if (!e.isTrusted) return
	e.preventDefault();
	collectInput("Keyboard", e.code, e.type == "keydown");
}

function addKeyboardEvents() {
	["keyup", "keydown"].forEach(type => window.addEventListener(type, keyboardCollector, null, "sky"));
}

function removeKeyboardEvents() {
	["keyup", "keydown"].forEach(type => window.removeEventListener(type, keyboardCollector, null, "sky"));
}


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
		if (!gamepads[gid]) continue;
		const gamepad = gamepads[gid], lastGamepad = lastGamepads[gid] || {}
		if (gamepad.buttons) {
			//console.debug("Gamepad has buttons");
			lastGamepad.buttons = lastGamepad.buttons || []
		} else {
			console.warn("Gamepad has no buttons");
		}
		for (const bid in gamepad.buttons) {
			const button = gamepad.buttons[bid], lastButton = lastGamepad.buttons[bid] || false;
			console.debug(lastButton, button.pressed);
			if (button && lastButton !== button.pressed) {
				collectInput(gamepad.id, "Button" + bid, button.pressed);
				lastGamepad.buttons[bid] = button.pressed;
			}
		}
		if (gamepad.axes) {
			//console.debug("Gamepad has axes");
			lastGamepad.axes = lastGamepad.axes || []
		} else {
			console.warn("Gamepad has no axes");
		}
		for (const aid in gamepad.axes) {
			const axis = gamepad.axes[aid], lastAxis = lastGamepad.axes[aid] || 0;
			if (lastAxis !== axis && Math.abs(axis) > .25) {
				//TODO collect multiple axis
				collectInput(gamepad.id, "Axis" + aid, axis);
				lastGamepad.axes[aid] = axis;
			}
		}
		lastGamepads[gid] = lastGamepad
	}

	//lastGamepads = gamepads;

	gamepadAnimationFrame = requestAnimationFrame(gamepadLoop);
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



function removeGamepadEvents() {
	window.removeEventListener("gamepadconnected", gamepadConnection);
	cancelAnimationFrame(gamepadAnimationFrame);
	window.removeEventListener("gamepaddisconnected", gamepadDisconnection);
}

function addGamepadEvents() {
	window.addEventListener("gamepadconnected", gamepadConnection);
}


async function setupMidi() {
	if (midiAccess) return;
	if (navigator.requestMIDIAccess) {
		try {
			midiAccess = await navigator.requestMIDIAccess({ sysex: false, software: true });

		} catch (error) {
			//alert("You may not play the game using midi inputs then.")
			console.error(error)
			return;
		}
		console.debug("MIDI has been enabled")
		const inputs = midiAccess.inputs.values();
		for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
			input.value.onmidimessage = message => {
				onMidiInput(message, input.value);
			}
		}
	}

}
function midiToNote(midiId) {
	const notesArray = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	const octave = Math.floor(midiId / 12) - 1;
	const noteIndex = midiId % 12;

	const noteName = notesArray[noteIndex] + octave;

	return noteName;
}

function onMidiInput(message, inputDevice) {
	if (message.data.length > 1) {
		const noteid = +message.data[1];
		collectInput(inputDevice.name, midiToNote(noteid) || "Note" + noteid, message.data[2])
	}
}

function cleanUpMidi() {
	if (!midiAccess) return;
	const inputs = midiAccess.inputs.values();
	for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
		input.value.onmidimessage = null;
	}
	midiAccess = null;
}



function popupExists() {
	return !!document.querySelector('.bind-popup');
}



function createPopup(device, button) {
	if (popupExists()) {
		editPrompt(`Press a key to bind ${button}...`);

		const bindDevice = document.getElementById('bind-device');
		bindDevice.innerText = device;

		return;
	}

	const popup = document.createElement('div');
	popup.classList.add('bind-popup');

	const popupHeader = document.createElement('div');
	popupHeader.classList.add('bind-header');

	const heading = document.createElement('h1');
	heading.textContent = 'New Device: ';


	const closeButton = document.createElement("button");
	closeButton.textContent = "❌";
	closeButton.dataset.balloon = "Close"
	closeButton.classList.add("big", "trans")
	closeButton.onclick = () => {
		cancelBind()
	}

	popupHeader.append(heading, closeButton)

	const deviceText = document.createElement('h3');
	deviceText.id = "bind-device";
	deviceText.textContent = device;

	const prompt = document.createElement('p');
	prompt.id = 'bind-prompt';
	prompt.textContent = `Press a key to bind ${button}...`;


	const notice = document.createElement('em');
	notice.textContent = 'Pressing system buttons such as the home or back button will not work - this has been tested.';

	popup.appendChild(popupHeader);
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
		for (const button of buttons) {
			await bindInput(device, button);
		}
		localStorage.setItem("stb_bindings", JSON.stringify(bindings));
	}

	deletePopup();
	updateDeviceDropdown()
	updateBindSettings();
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
		//console.debug({ skyButton, binding, input });
		if ((binding.action || binding.actions[0]) === input.action && binding.times <= input.times) {
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


function uniq(a) {
	var prims = { "boolean": {}, "number": {}, "string": {} }, objs = [];

	return a.filter(function (item) {
		var type = typeof item;
		if (type in prims)
			return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
		else
			return objs.indexOf(item) >= 0 ? false : objs.push(item);
	});
}

// Settuings update functions
function getSettingDropdown() {
	return document.getElementById("settings-controller")
}

function getSelectedDevice() {
	return getSettingDropdown()?.value
}


function getDevices() {
	return uniq([
		...Object.keys(devices),
		...Object.values(bindings).reduce((arr, val) => [...arr, ...Object.keys(val)], [])
	])
}

function updateDeviceDropdown() {
	const dropdown = getSettingDropdown();
	if (!dropdown) return;
	dropdown.innerHTML = "";
	dropdown.append(...getDevices().map(device => {
		const option = document.createElement("option");
		option.innerText = option.value = device;
		return option;
	}))
}

function updateBindSettings() {
	const device = getSelectedDevice();
	if (device)
		buttons.forEach(button => {
			const element = document.getElementById("setting_" + button);
			document.getElementById("setting_" + button + "_bind").disabled = !Object.keys(bindings).length ? "true" : null
			if (!element || !bindings[button] || !bindings[button][device]) return
			element.value = bindings[button][device].action;
		})
}

function initSettings() {
	const deviceBinds = document.getElementById("device_binds");
	if (!deviceBinds) return

	getSettingDropdown().addEventListener("input", updateBindSettings)

	buttons.forEach((button) => {
		const divElement = document.createElement("div");

		const labelElement = document.createElement("label");
		labelElement.for = `setting_${button.toLowerCase()}`;
		labelElement.textContent = `${button}: `;

		const inputElement = document.createElement("input");
		inputElement.id = `setting_${button.toLowerCase()}`;
		inputElement.name = `setting_${button.toLowerCase()}`;
		inputElement.disabled = true;

		const buttonElement = document.createElement("button");
		buttonElement.id = `setting_${button.toLowerCase()}_bind`
		buttonElement.textContent = "Bind";
		buttonElement.onclick = async () => {
			// Prompt bind popup
			await bindInput(getSelectedDevice(), button.toLowerCase());
			///close the popup
			deletePopup();
			// save the new binds to browser storage
			localStorage.setItem("stb_bindings", JSON.stringify(bindings));
			// set the text box text
			inputElement.value = bindings[button][getSelectedDevice()].action
		}

		// Append everything to the div
		divElement.appendChild(labelElement);
		divElement.appendChild(inputElement);
		divElement.appendChild(buttonElement);

		// Append the div to the device binds
		deviceBinds.appendChild(divElement);
	});

}

function createSettings() {
	if (document.querySelectorAll(".settings-panel").length) return


	// Create the settings panel div
	const settingsPanel = document.createElement("div");
	settingsPanel.classList.add("settings-panel");

	// Create the heading
	const heading = document.createElement("h1");
	settingsPanel.appendChild(heading);
	heading.textContent = "Settings";

	//Create Toolbar
	const toolbar = new Toolbar(settingsPanel)
	toolbar.classList.add("settings-toolbar")
	toolbar.addButton({ label: "Tools", emoji: "🧰", action: SummonSTBTools })
	toolbar.addButton({ label: "Enable MIDI", emoji: "🎹", action: setupMidi })
	toolbar.addButton({
		label: "Refresh", emoji: "🔄", action: () => {
			updateDeviceDropdown()
			updateBindSettings();
		}
	})
	toolbar.addButton({ label: "Close", emoji: "❌", action: () => settingsPanel.remove() })


	// Info Text
	let info = document.createElement("p")
	info.classList.add("settings-info");
	info.innerText = `Changes are saved to the browser automatically, one binding per device and all keyboards are treated as one.

	If the device you're looking for isn't listed, please press a button on that device and it should be detected.`
	settingsPanel.appendChild(info);

	// Create the settings content div
	const settingsContent = document.createElement("div");
	settingsContent.classList.add("settings-content");

	// Create the device selection div
	const deviceDiv = document.createElement("div");
	settingsContent.appendChild(deviceDiv);

	// Create the label for device
	const deviceLabel = document.createElement("label");
	deviceLabel.for = "setting-controller";
	deviceLabel.textContent = "Device: ";
	deviceDiv.appendChild(deviceLabel);

	// Create the select element for device
	const deviceSelect = document.createElement("select");
	deviceSelect.name = "setting-controller";
	deviceSelect.id = "settings-controller";
	deviceDiv.appendChild(deviceSelect);

	// Create the device binds div
	const deviceBindsDiv = document.createElement("div");
	deviceBindsDiv.id = "device_binds";
	settingsContent.appendChild(deviceBindsDiv);



	// Append everything to the settings panel
	settingsPanel.appendChild(settingsContent);

	document.body.appendChild(settingsPanel)

	initSettings();
	updateDeviceDropdown()
	updateBindSettings();
}

