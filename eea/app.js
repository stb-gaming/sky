( async ()=>{
const player = await loadSWF("app.swf")

eventTarget = player.shadowRoot.querySelector("canvas");

let help = SkyRemote.getBinding("help")
help.codes = ["KeyH"]
help.keyCodes = [72]
help.keys =['h']
})()