

function toggleFullscreen(element) {
	console.log(element);
	if (document.fullscreenElement === element) {
		document.exitFullscreen();
		element.setAttribute("data-fullscreen", false);
	} else {
		element.requestFullscreen();
		element.setAttribute("data-fullscreen",true);
	}
}