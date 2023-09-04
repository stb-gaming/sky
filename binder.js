const binds = {};
let binding = null, bindCheck;

function bind(button, binding) {
	console.log(`Binding ${button} to ${button.device} - ${button.button}`, binding);
	binds[button] = binding;
}

function compareBinds(bind1, bind2) {

	const keysA = Object.keys(bind1);
	const keysB = Object.keys(bind2);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (const key of keysA) {
		if (bind1[key] !== bind2[key]) {
			return false;
		}
	}

	return true;

}

function onBindCheck() {
	console.debug("Do that again to confirm");
}

function onInput(device, button, status, velocity, unitX, unitY, extra) {
	const inputData = { device, button, status, velocity, unitX, unitY, extra };
	if (typeof binding === 'string') {
		if (bindCheck) {
			if (status == bindCheck.status) {
				if (compareBinds(bindCheck, inputData)) {

					bind(binding, inputData);
				} else {
					console.debug(`Failed to bind ${binding}`);
				}
				binding = null;
				bindCheck = null;
			}
			console.debug("ignoreing button depression");
		} else {
			bindCheck = inputData;
			onBindCheck();
		}
	}
}

function collectBinding(button) {
	binding = button;
	console.debug(`Ready to bind ${button}`);
}



["keydown", "keyup"].forEach(type => document.addEventListener(type, e => {
	let status;
	switch (e.type) {
		case "keyup":
			status = false;
			break;
		case "keydown":
			status = true;
		default:
			break;
	}
	onInput("keyboard", e.key || e.code, status, 0, 0, 0, { ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, repeat: e.repeat });
}));
