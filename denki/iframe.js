window.addEventListener('message', (event) => {
	if (event.data.length < 2) return;
	if (typeof event.data[0] !== "string") return;
	if (typeof event.data[1] !== "object") return;
	document.dispatchEvent(new KeyboardEvent(...event.data));
});
