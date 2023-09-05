// <script type="text/javascript" src="https://denki.co.uk/sky/apiHandler.js"></script>
// Created by tumble for denki, denki can hold rights to this and even remove this comment

window.addEventListener('message', (event) => {
	console.log("hello");
	if (!Array.isArray(event.data) || event.data.length < 2) {
		// Check if event.data is an array with at least two elements
		return;
	}

	const [eventType, eventOptions] = event.data;

	if (typeof eventType !== "string" || typeof eventOptions !== "object") {
		// Check if the first element is a string and the second is an object
		return;
	}

	document.dispatchEvent(new KeyboardEvent(eventType, eventOptions));
}, false);
