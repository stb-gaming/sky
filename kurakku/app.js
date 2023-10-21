
(async function() {
let player = await loadSWF("../kurakku/app.swf")
let binder = new MouseBinder(player,
	{"main":{"play":{"target":"play","left":0.30833333333333335,"right":0.4152777777777778,"top":0.8180555502573649,"bottom":0.8788194391462538},"help":{"target":"help","left":0.575,"right":0.6916666666666667,"top":0.8180555502573649,"bottom":0.8753472169240316}},"help":{"main":{"left":"0.8375","top":"0.11146375868055555","right":"0.9111111111111111","bottom":"0.16007486979166666","target":"main"}},"play":{"play":{"left":"0.27361111111111114","top":"0.7798611058129205","right":"0.33611111111111114","bottom":"0.835416661368476","target":"go"},"help":{"left":"0.7819444444444444","top":"0.929166661368476","right":"0.8527777777777777","bottom":"0.9621527724795871","target":"help"},"pause":{"left":"0.9013888888888889","top":"0.9343749947018094","right":"0.9694444444444444","bottom":"0.9656249947018094","target":"pause"}},"pause":{"play":{"left":"0.5638888888888889","top":"0.49513888359069824","right":"0.6694444444444444","bottom":"0.5732638835906982","target":"play"}}}
	);

	binder.setEventTarget(player.shadowRoot.querySelector("canvas"),"pointer",PointerEvent)
})()