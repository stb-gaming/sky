
(async function() {
let player = await loadSWF("../kurakku/app.swf")
let binder = new MouseBinder(player,
	{"main":{"play":{"target":"play","left":0.30833333333333335,"right":0.4152777777777778,"top":0.8180555502573649,"bottom":0.8788194391462538},"help":{"target":"help","left":0.575,"right":0.6916666666666667,"top":0.8180555502573649,"bottom":0.8753472169240316}},"help":{"main":{"left":0.8375,"top":0.11146375868055555,"right":0.9111111111111111,"bottom":0.16007486979166666,"target":"main"}},"play":{"play":{"left":0.27361111111111114,"top":0.7798611058129205,"right":0.33611111111111114,"bottom":0.835416661368476,"target":"go"},"help":{"target":"help","left":0.7819444444444444,"right":0.8597222222222223,"top":0.9239637586805556,"bottom":0.9691026475694444},"pause":{"target":"pause","left":0.8986111111111111,"right":0.9708333333333333,"top":0.9274359809027778,"bottom":0.9656304253472222},"select":{"target":"select","left":0.2763888888888889,"right":0.33194444444444443,"top":0.7763943142361112,"bottom":0.8354220920138888},"go":{"target":"go","left":0.27361111111111114,"right":0.33611111111111114,"top":0.7798611058129205,"bottom":0.835416661368476}},"pause":{"play":{"left":0.5638888888888889,"top":0.49513888359069824,"right":0.6694444444444444,"bottom":0.5732638835906982,"target":"play"}}}
	);

	binder.setEventTarget(player.shadowRoot.querySelector("canvas"),"pointer",PointerEvent)
})()