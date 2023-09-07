
function resizeCanvas() {
	const canvas = document.querySelector('canvas');
	const border = document.querySelector('.emscripten_border');
	const aspectRatio = canvas.width / canvas.height;

	// Get the computed style of the border element to get its actual width and height
	const borderStyle = getComputedStyle(border);
	const borderWidth = parseFloat(borderStyle.width);
	const borderHeight = parseFloat(borderStyle.height);

	// Calculate the available width and height for the canvas inside the border
	let availableWidth = borderWidth;
	let availableHeight = borderHeight;

	if (borderWidth / borderHeight > aspectRatio) {
		availableWidth = borderHeight * aspectRatio;
	} else {
		availableHeight = borderWidth / aspectRatio;
	}

	// Update the CSS style to fit the available width and height
	canvas.style.width = availableWidth + 'px';
	canvas.style.height = availableHeight + 'px';

	// Calculate the offset to center the canvas
	const offsetX = (borderWidth - availableWidth) / 2;
	const offsetY = (borderHeight - availableHeight) / 2;

	// Apply the calculated position to the canvas
	canvas.style.left = offsetX + 'px';
	canvas.style.top = offsetY + 'px';
}


window.addEventListener('resize', resizeCanvas);
