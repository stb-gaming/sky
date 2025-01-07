self.addEventListener("install", event => {
	console.debug("[SW] install",event)
})
self.addEventListener("activate", event => {
	console.debug("[SW] activate",event)
})
self.addEventListener("message", event => {
	console.debug("[SW] message",event)
})