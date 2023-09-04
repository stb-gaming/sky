const binds = {}, buttons = ["select", "backup", "up", "down", "left", "right", "red", "green", "yellow", "blue"];
let binding = null, bindCheck;

function bind(button, binding) {
	console.log(`Binding ${button} to ${binding.device} - ${binding.button}`, binding);
	binds[button] = binding;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function objEqual(a, b) {
	if (typeof a !== typeof b || Object.keys(a).length !== Object.keys(b).length)
		return { isEqual: false, difference: 'Different types or number of keys' };

	for (const k in a) {
		if (typeof a[k] === 'object') {
			const nestedComparison = objEqual(a[k], b[k]);
			if (!nestedComparison.isEqual)
				return { isEqual: false, difference: `Nested property '${k}' is different: ${nestedComparison.difference}` };
		} else if (a[k] !== b[k])
			return { isEqual: false, difference: `Property '${k}' is different: a[${k}] = ${a[k]}, b[${k}] = ${b[k]}` };
	}

	return { isEqual: true };
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

	popup.appendChild(heading);
	popup.appendChild(prompt);

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







function onBindCheck() {
	console.debug("Do that again to confirm");
	editPrompt(`Press ${bindCheck.device} - ${bindCheck.button} again to confirm its binding to ${binding}`);
}

function onBindFail() {
	editPrompt(`Failed to bind ${binding}`);
	setTimeout(() => collectBinding(binding), 1000);

}

function onBindSuccess() {
	bind(binding, bindCheck);
	editPrompt(`Successfully bound ${binding} to ${bindCheck.device} - ${bindCheck.button}`);

	setTimeout(() => collectBinding(buttons[buttons.indexOf(binding) + 1]), 1000);


}

function onInput(device, button, status, velocity, unitX, unitY, extra) {
	const inputData = { device, button, status, velocity, unitX, unitY, extra };
	if (typeof binding === 'string') {
		if (bindCheck) {
			if (status == bindCheck.status) {
				console.log(bindCheck, inputData);
				let equality = objEqual(bindCheck, inputData);
				if (equality.isEqual) {
					onBindSuccess();
				} else {
					console.debug(`Failed to bind ${binding}: `, equality.difference);
					onBindFail();
				}
			}
			console.debug("ignoring button depression");
		} else {
			bindCheck = inputData;
			onBindCheck();
		}
	}
}

function collectBinding(button) {
	if (!button || binds[button]) {
		deletePopup();
		return;
	}
	binding = null;
	bindCheck = null;
	binding = button;
	console.debug(`Ready to bind ${button}`);
	createPopup(button);
}





["keydown", "keyup"].forEach(type => document.addEventListener(type, ({ type, key, code, ctrlKey, metaKey, shiftKey, repeat }) => {
	let status;
	switch (type) {
		case "keyup":
			status = false;
			break;
		case "keydown":
			status = true;
		default:
			break;
	}
	if (key === ' ') {
		key = "Space";
	}
	onInput("keyboard", key || code, status, 0, 0, 0, { ctrl: ctrlKey, meta: metaKey, shift: shiftKey, repeat });
}));


collectBinding(buttons[0]);
