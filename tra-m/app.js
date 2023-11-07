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

	await loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/bridge.min.js",true)
	await waitFor("Bridge")	
	await loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/bridge.meta.min.js",true)
	await loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/MonoGame.Framework.min.js",true)
	await loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/MonoGame.Framework.meta.min.js",true)
	await waitFor("Microsoft")	
	await loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/TombTV.min.js",true)
	await loadJS("https://stb-gaming.github.io/Tomb-Raider-Apocalypse-Remake-WebGL-/TombTV.meta.min.js",true)
}

init()