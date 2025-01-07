
//register service worker
if ('serviceWorker' in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register('../js/func/offline-sw.js')
			.then(reg => {
			console.debug("[SW] Service worker registered",reg )
			})
			.catch(error => {
			console.log("[SW] Error registering service worker",error)
		})
	})
} else {
	console.debug("[SW] This browser does not support service workers")
}

async function messageSW(message) {
	const registrations = await navigator.serviceWorker.getRegistrations();
	const sw = registrations[0].active;

	return sw.postMessage(message);
}