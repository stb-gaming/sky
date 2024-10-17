function pxToNumber(px) {
	return Number(px.replace("px", ""))
}

const regionSchema = {
	left: 0,
	right: 0,
	top: 0,
	bottom: 0,
	role: "button",
	sliderSpeed: 0.01
}

class PositionEditor {
	constructor(mouseBinder) {
		this.mouseBinder = mouseBinder;
		this.bindCanvas = document.createElement("div");
		this.bindCanvas.id = "bind-canvas"
		this.bindCanvas.style.display = "none";


		mouseBinder.canvas.parentElement.appendChild(this.bindCanvas)
		mouseBinder.canvas.parentElement.style.position = "relative";
		this.bindCanvas.style.position = "absolute";
		this.bindCanvas.style.top = "0";
		this.bindCanvas.style.left = "50%";
		this.bindCanvas.style.translate = "-50%"
		this.bindCanvas.style.width = `${mouseBinder.bounds.width}px`;
		this.bindCanvas.style.height = `${mouseBinder.bounds.height}px`;


		this.bindCanvas.addEventListener("mousedown", ({ clientX, clientY, target }) => {
			if (target !== this.bindCanvas) return
			this.mouseDown(clientX, clientY)
		})
		this.bindCanvas.addEventListener("mousemove", ({ clientX, clientY, target }) => {
			if (target !== this.bindCanvas) return
			this.mouseMove(clientX, clientY)
		})
		this.bindCanvas.addEventListener("mouseup", ({ clientX, clientY, target }) => {
			if (target !== this.bindCanvas) return
			this.mouseUp(clientX, clientY)
		})


		this.loadMenu();

	}

	listMenus() {
		let menus = Object.keys(this.mouseBinder.positions)
		return "Menus include; " + menus.join(", ") + " or type something new to create a menu"
	}

	listRoles() {
		let roles = ["button", "slider", "slider-vertical", "slider-horizontal", "dial"]
		return "Roles include; " + roles.join(", ") + ""
	}

	aboutTargets() {
		return `
A target can be;
 * A sky remote button (help,backup, select etc)
 * menu name to change to
If you do 'select' then the player wont be able to switch between menu options.
		`
	}

	setMode(mode) {
		const oldMode = this.mode;
		this.mode = this.mode === mode ? null : mode;

		const customButton = document.getElementById("editor-custom-mode"),
			oldModeElement = document.getElementById("editor-mode-" + oldMode) || customButton,
			modeElement = document.getElementById("editor-mode-" + mode) || customButton;
		if (oldModeElement) oldModeElement.classList.remove("active")
		if (modeElement) {
			if (this.mode === mode) {
				modeElement.classList.add("active")
			} else {
				modeElement.classList.remove("active")
			}
		}
		this.bindCanvas.style.display = this.mode ? null : "none"
		if (this.mode) {
			this.loadMenu();
		}
	}

	helperButtonsMenus(toolbar) {
		if (!toolbar) return
		toolbar.addButton({ label: "Save", emoji: "💾", action: () => prompt("Copy this", JSON.stringify(this.mouseBinder.positions)) })
		toolbar.addButton({ label: "Change Menu", emoji: "📜", action: () => this.changeMenu() })
		toolbar.addButton({ label: "Toggle Debug Mouse", emoji: "🐁", action: () => this.mouseBinder.toggleDebug() })

	}
	helperButtonsPos(toolbar) {
		if (!toolbar) return
		const createButton = toolbar.addButton({ label: "Create Region", emoji: "🆕", action: () => this.setMode("create") })
		const deleteButton = toolbar.addButton({ label: "Delete Region", emoji: "🗑️", action: () => this.setMode("delete") })
		const renameButton = toolbar.addButton({ label: "Set Target", emoji: "🎯", action: () => this.setMode("rename") })
		const roleButton = toolbar.addButton({ label: "Set Region Role", emoji: "🤹", action: () => this.setMode("role") })
		const setButton = toolbar.addButton({ label: "Set Property", emoji: "🔧", action: () => this.setMode("set") })
		const customButton = toolbar.addButton({ label: "Set Custom Mode", emoji: "🧪", action: () => this.setMode(prompt("Set Mode or set blank to exit")) })

		createButton.id = "editor-mode-create"
		deleteButton.id = "editor-mode-delete"
		renameButton.id = "editor-mode-rename"
		setButton.id = "editor-mode-set"
		roleButton.id = "editor-mode-role"
		customButton.id = "editor-custom-mode";

	}


	toggle() {
		this.bindCanvas.style.display = this.bindCanvas.style.display ? null : "none"
		this.loadMenu();
	}

	changeMenu(menu) {
		const newMenu = menu || prompt("Change Menu, " + this.listMenus())
		if (newMenu == this.mouseBinder.menu && confirm("Delete Menu?")) {
			delete this.mouseBinder.positions[menu];
			this.bindCanvas.innerHTML = "";
			return;
		} else {
			this.mouseBinder.changeMenu(newMenu, true);
		}
		this.loadMenu();
	}

	loadMenu() {
		this.bindCanvas.innerHTML = "";
		const menu = this.mouseBinder.menu,
			positions = this.mouseBinder.positions[menu];
		if (!positions) {
			this.mouseBinder.positions[menu] = {}
			return;
		} else {
			for (const region of Object.values(positions)) {
				this.createBox(region)
				this.saveBox();
			}
		}
	}

	get bounds() {
		return this.mouseBinder.bounds;
	}

	createBox(region) {
		console.debug("Creating Region", region)
		this.lastElement = document.createElement("span");
		this.bindCanvas.appendChild(this.lastElement)
		this.lastElement.addEventListener("click", e => {
			switch (this.mode) {
				case "delete":
					if (confirm("Delete Box?")) {
						this.deleteBox(e.target)
					}
					break;
				case "set":
					e.target.dataset[prompt("Property to change")] = prompt("New value");
					this.saveBox(e.target)
					break;
				case "rename":
					e.target.dataset.target = prompt("Target Menu" + this.aboutTargets());
					this.saveBox(e.target)
					break;
				case "role":
					e.target.dataset.role = prompt("New Role, " + this.listRoles());
					this.saveBox(e.target)
					break;
				default:
					break;
			}
		})
		for (const key in regionSchema) {
			this.lastElement.dataset[key] = regionSchema[key]
		}
		this.setBox(region)
	}
	setBox(region) {
		console.debug("Setting region to ", region)
		const { left, top, right, bottom } = region;
		const [winLeft, winTop] = this.mouseBinder.canvasToWindow(left, top),
			[winRight, winBottom] = this.mouseBinder.canvasToWindow(right, bottom);
		if (left) {
			this.lastElement.style.left = `${winLeft - this.bounds.left}px`;
		}
		if (top) {
			this.lastElement.style.top = `${winTop - this.bounds.top}px`;
		}
		if (right) {
			this.lastElement.style.width = `${winRight - pxToNumber(this.lastElement.style.left) - this.bounds.left}px`;
		}
		if (bottom) {
			this.lastElement.style.height = `${winBottom - pxToNumber(this.lastElement.style.top) - this.bounds.top}px`;
		}
		for (const key in region) {
			this.lastElement.dataset[key] = region[key]
		}
	}

	changeBox(left, top, right, bottom) {
		let d = this.lastElement.dataset
		this.setBox({
			left: left ? d.left + left : null,
			top: top ? d.top + top : null,
			right: right ? d.right + right : null,
			bottom: bottom ? d.bottom + bottom : null,
		})
	}

	saveBox(element) {
		if (element) this.lastElement = element;
		const menu = this.mouseBinder.menu;
		if (!this.mouseBinder.positions[menu]) this.mouseBinder.positions[menu] || {}
		const positions = this.mouseBinder.positions[menu]
		const dataset = this.lastElement.dataset
		if (!dataset.target) dataset.target = prompt("Target Menu" + this.aboutTargets())
		if (!dataset.target) {
			element.remove()
			return
		}
		let box = {}
		for (let key in dataset) {
			box[key] = dataset[key]
			if (typeof regionSchema[key] !== 'undefined') {
				box[key] = regionSchema[key].constructor(box[key])
			}
		}
		positions[box.target] = box;
	}

	deleteBox(element) {
		const target = element.dataset.target,
			menu = this.mouseBinder.menu;
		delete this.mouseBinder.positions[menu][target]
		element.remove();
	}

	mouseDown(clientX, clientY) {
		this.mousedown = [clientX, clientY]
		const pos = this.mouseBinder.windowToCanvas(clientX, clientY)
		if (this.mode === "create") this.createBox({ left: pos[0], top: pos[1] })
	}
	mouseUp(clientX, clientY) {
		this.mousedown = false
		const pos = this.mouseBinder.windowToCanvas(clientX, clientY)
		if (this.mode === "create") this.saveBox();

	}
	mouseMove(clientX, clientY) {
		if (!this.mousedown) return
		const pos = this.mouseBinder.windowToCanvas(clientX, clientY)
		if (this.mode === "create") this.setBox({ right: pos[0], bottom: pos[1] })
	}

	cleanup() {
		this.bindCanvas.remove()

		delete this.mouseBinder.posEditor;
	}
}

class MouseBinder {
	constructor(canvas = document.getElementsByTagName("canvas")[0], positions = {}) {
		if (!canvas) throw new Error("No canvas was given");
		window.mouseBinder = this;
		this.canvas = canvas;
		this.positions = positions
		this.menu = Object.keys(positions)[0] || "main"
		this.menuBreadcrumbs = []
		this.menuPos = typeof this.menu.select === "undefined" ? 0 : "select";
		this.posEditor = new PositionEditor(this)
		this.debugMouse = this.createDot()
		this.lastMousePos = [];

		//SkyRemote
		if (typeof positions === "object" && typeof positions[this.menu] == "object" && !!Object.keys(positions[this.menu]).length) {
			if (typeof SkyRemote === 'undefined') {
				console.error("No SkyRemote was found");
			} else {
				SkyRemote.onHoldButton("up", _ => this.up());
				SkyRemote.onHoldButton("down", _ => this.down());
				SkyRemote.onHoldButton("left", _ => this.left());
				SkyRemote.onHoldButton("right", _ => this.right());
				SkyRemote.onHoldButton("select", _ => this.selectPress());
				SkyRemote.onReleaseButton("select", _ => this.selectRelease());
				SkyRemote.onHoldButton("backup", _ => this.backup());
				SkyRemote.onHoldButton("help", _ => this.help());
			}
		} else {
			additionalOnTriggerEvents.push(() => {
				this.click(.5, .5)
			})
		}
	}


	get bounds() {
		return canvas.getBoundingClientRect()
	}

	canvasToWindow(x, y) {
		return [
			this.bounds.left + x * this.bounds.width,
			this.bounds.top + y * this.bounds.height
		]
	}
	windowToCanvas(x, y) {
		return [
			(x - this.bounds.left) / this.bounds.width,
			(y - this.bounds.top) / this.bounds.height
		]
	}

	createDot() {
		let dot = document.createElement("span");
		dot.style.background = "magenta"
		dot.style.width = "10px"
		dot.style.height = "10px"
		dot.style.position = "absolute"
		dot.style.translate = "-50% -50%"
		dot.style.zIndex = "100";
		document.body.appendChild(dot);
		document.body.style.position = "relative"
		dot.style.display = "none"
		return dot;
	}

	toggleDebug() {
		this.debugMouse.style.display = this.debugMouse.style.display ? null : "none"
	}

	sendMouseEvent(event, x = this.lastMousePos[0], y = this.lastMousePos[1]) {
		console.debug(`Mouse ${event} at ${[x, y]}`)
		if (x == NaN || y == NaN) {
			throw new Error("TODO: Fix sending NaN coordinates. Please report this.")
		}
		const c = this.canvasToWindow(x, y);
		if (!this.eventTarget) this.setEventTarget(this.canvas, "mouse", MouseEvent)
		this.eventTarget.dispatchEvent(new (this.eventType)(this.eventPrefix + event, {
			clientX: parseFloat(c[0]),
			clientY: parseFloat(c[1]),
			bubbles: true,
			cancelable: true,
			composed: true
		}))
		this.debugMouse.style.left = `${c[0]}px`;
		this.debugMouse.style.top = `${c[1]}px`;
		this.lastMousePos = [x, y]
	}

	mouseDown(x, y) {
		this.sendMouseEvent("down", x, y);
	}
	mouseUp(x, y) {
		this.sendMouseEvent("up", x, y);
	}
	mouseMove(x, y) {
		this.sendMouseEvent("move", x, y);
	}

	getItem(id = this.menuPos, menu = this.positions[this.menu]) {
		if (!menu) return
		if (typeof id === 'number') {
			return Object.values(menu)[id]
		} else {
			return menu[id]
		}
	}


	click(x, y) {
		this.mouseDown(x, y);
		return new Promise((res, rej) => {
			setTimeout(() => {
				this.mouseUp(x, y);
				res();
			}, 100);
		});
	}

	clickItem(id) {
		console.debug(`Clicking ${id}`)
		const item = this.getItem(id)
		this.click(
			(item.left + item.right) / 2,
			(item.top + item.bottom) / 2
		);
	}

	holdItem(id) {
		console.debug(`Holding ${id}`)
		const item = this.getItem(id)
		this.mouseDown(
			(item.left + item.right) / 2,
			(item.top + item.bottom) / 2
		);
	}

	releaseItem(id) {
		console.debug(`Releasing ${id}`)
		const item = this.getItem(id)
		this.mouseUp(
			(item.left + item.right) / 2,
			(item.top + item.bottom) / 2
		);
	}

	updateMenuPos() {
		const menu = this.positions[this.menu];
		if (!menu) return
		if (menu.select) {
			this.menuPos = "select"
		}
		const item = this.getItem()
		if (!item) return
		this.menuPos = item.target
		console.debug(item);

		this.mouseMove(
			(item.left + item.right) / 2,
			(item.top + item.bottom) / 2
		);
	}



	changeMenu(menu, force) {
		if ((force || Object.keys(this.positions).includes(menu))) {
			this.menuBreadcrumbs.push(this.menu)
			console.debug(`Changing menu to ${menu}`)
			this.menu = menu;
			this.menuPos = 0;
			this.updateMenuPos();
		}
	}
	setEventTarget(element, prefix, type) {
		console.debug("setting event target to", element, prefix, type)
		this.eventTarget = element
		this.eventPrefix = prefix;
		this.eventType = type;


		this.eventTarget.addEventListener(this.eventPrefix + "up", ({ clientX, clientY }) => {
			const mouse = this.windowToCanvas(clientX, clientY),
				menu = this.positions[this.menu];
			if (!menu) return;
			for (const option in menu) {
				const item = menu[option];
				if (
					mouse[0] > item.left && mouse[0] < item.right &&
					mouse[1] > item.top && mouse[1] < item.bottom
				) {
					this.changeMenu(option)
					if (this.getItem("pause")) {
						this.menuBreadcrumbs = []
					}
				}
				if (this.getItem().role === "button") this.updateMenuPos();
			}
		})
	}

	traverse(dx, dy) {
		const
			items = this.positions[this.menu],
			cb = this.getItem(),
			cx = (cb.left + cb.right) / 2,
			cy = (cb.top + cb.bottom) / 2;

		let nearByPositions = Object.values(items).map((eb, i) => {
			const
				ex = (eb.left + eb.right) / 2,
				ey = (eb.top + eb.bottom) / 2,
				mx = dx > 0 // right
					? eb.left - cb.right
					: dx < 0 // left
						? cb.left - eb.right
						: ex - cx,
				my = dy > 0 // down
					? eb.top - cb.bottom
					: dy < 0 //up
						? cb.top - eb.bottom
						: ey - cy,
				m = Math.sqrt(mx * mx + my * my),
				ux = mx / m,
				uy = my / m;

			return { i, eb, ux, uy, m, my, mx };

		});

		// eslint-disable-next-line eqeqeq
		nearByPositions = nearByPositions.filter(e => (e.i !== this.menuPos) && (!dx || e.ux > 0) && (!dy || e.uy > 0));
		nearByPositions = nearByPositions.sort((a, b) => a.m - b.m).sort((a, b) => (dx ? a.mx - b.mx : dy ? a.my - b.my : a.m - b.m));

		if (!!nearByPositions.length) {
			this.menuPos = nearByPositions[0].i;
		}
		this.updateMenuPos();
	}

	slide(x, y) {

		console.log("sliding");
		const item = this.getItem();
		x = Math.sign(x)
		y = Math.sign(y)
		if (typeof item.role === "string" && item.role.startsWith("slider")) {
			if (item.role.dial) return;
			const width = item.right - item.left,
				height = item.bottom - item.top;
			let newX = this.lastMousePos[0], newY = this.lastMousePos[1];
			const sliderSpeed = item.sliderSpeed || .01
			newX += x * sliderSpeed
			if (newX < item.left) newX = item.left
			if (newX > item.right) newX = item.right
			newY += y * sliderSpeed
			if (newY < item.top) newY = item.top
			if (newY > item.bottom) newY = item.bottom

			if (item.role === "slider-vertical") {
				newX = item.left + width / 2
			}
			if (item.role === "slider-horizontal") {
				newY = item.top + height / 2
			}

			this.mouseMove(newX, newY)
		}
	}

	left() {
		const item = this.getItem();
		switch (item.role) {
			case "slider":
			case "slider-horizontal":
				this.slide(-1, 0)
				break;

			default:
				this.traverse(-1, 0)
				break;
		}

	}
	right() {
		const item = this.getItem();
		switch (item.role) {
			case "slider":
			case "slider-horizontal":
				this.slide(1, 0)
				break;

			default:
				this.traverse(1, 0)
				break;
		}
	}
	up() {
		const item = this.getItem();
		switch (item.role) {
			case "slider":
			case "slider-vertical":
				this.slide(1, 0)
				break;

			default:
				this.traverse(0, -1)
				break;
		}
	}
	down() {
		const item = this.getItem();
		switch (item.role) {
			case "slider":
			case "slider-vertical":
				this.slide(1, 0)
				break;

			default:
				this.traverse(0, 1)
				break;
		}
	}
	select() {
		//const item = this.getItem("select")||this.getItem()
		//this.clickItem(item.target)
		this.click()
	}
	selectPress() {
		//const item = this.getItem("select")||this.getItem()
		//this.holdItem(item.target)
		this.mouseDown();
	}
	selectRelease() {
		//const item = this.getItem("select")||this.getItem()
		//this.releaseItem(item.target)
		this.mouseUp();
	}
	backup() {
		if (this.getItem("pause")) {
			console.debug("pausing")
			this.clickItem("pause")
		}
		else if (!!this.menuBreadcrumbs.length) {
			console.debug("going back a page")
			this.clickItem(this.menuBreadcrumbs.pop())
			this.menuBreadcrumbs.pop()
		} else {
			console.debug("nowhere to go back to")
		}
	}
	help() {
		this.clickItem("help")
	}
}