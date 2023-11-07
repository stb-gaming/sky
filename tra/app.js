const canvas = document.getElementById("canvas");
if (canvas) {
	canvas.id = "monogamecanvas";
	canvas.width = null
	canvas.height = null
}

/**
 * 
 * @param {String} thing 
 */
async function waitFor(thing,parent=window) {
	while (typeof parent[thing] === "undefined") {
		console.debug("Wating for " + thing)
		await wait()
	}
	console.debug(parent[thing])	
}

async function init() {

	loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/bridge.min.js")
	await waitFor("Bridge")	
	loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/bridge.meta.min.js")
	loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/MonoGame.Framework.min.js")
	loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/MonoGame.Framework.meta.min.js")
	await waitFor("Microsoft")	
	loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/TombTV.min.js")
	loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/TombTV.meta.min.js")
}

init()