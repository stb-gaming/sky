function pxToNumber(px) {
	return Number(px.replace("px",""))
}

class PositionEditor {
	constructor(mouseBinder) {
		this.mouseBinder = mouseBinder;
		this.bindCanvas = document.createElement("div");
		this.bindCanvas.id = "bind-canvas"
		this.bindCanvas.style.display ="none";

	
		mouseBinder.canvas.parentElement.appendChild(this.bindCanvas)
		mouseBinder.canvas.parentElement.style.position = "relative";
		this.bindCanvas.style.position= "absolute";
		this.bindCanvas.style.top= "0";
		this.bindCanvas.style.left= "50%";
		this.bindCanvas.style.translate = "-50%"
		this.bindCanvas.style.width=  `${mouseBinder.bounds.width}px`;
		this.bindCanvas.style.height= `${mouseBinder.bounds.height}px`;


		this.bindCanvas.addEventListener("mousedown",({clientX,clientY,target})=>{
			if(target!==this.bindCanvas) return
			this.mouseDown(clientX,clientY)
		})
		this.bindCanvas.addEventListener("mousemove",({clientX,clientY,target})=>{
			if(target!==this.bindCanvas) return
			this.mouseMove(clientX,clientY)
		})
		this.bindCanvas.addEventListener("mouseup",({clientX,clientY,target})=>{
			if(target!==this.bindCanvas) return
			this.mouseUp(clientX,clientY)
		})


		this.loadMenu();

	}

	helperButtons() {
		if(this.addedBtns) return
		this.addedBtns = true;
		const toolbar = document.getElementsByClassName("toolbar")[0]
			const editBtn = document.createElement("a")
			toolbar.prepend(editBtn)
			editBtn.href="#"
			editBtn.classList.add("btn","big","trans")
			editBtn.innerText = "🏗️"
			editBtn.dataset.balloon = "Edit Menu"
			editBtn.onclick = ()=>this.toggle()

			const menuBtn = document.createElement("a")
			toolbar.prepend(menuBtn)
			menuBtn.href="#"
			menuBtn.classList.add("btn","big","trans")
			menuBtn.innerText = "📜"
			menuBtn.dataset.balloon = "Change Menu"
			menuBtn.onclick = ()=>this.changeMenu()

			const exportBtn = document.createElement("a")
			toolbar.prepend(exportBtn)
			exportBtn.href="#"
			exportBtn.classList.add("btn","big","trans")
			exportBtn.innerText = "📤"
			exportBtn.dataset.balloon = "Export Menu"
			exportBtn.onclick = ()=>prompt("Copy this", JSON.stringify(this.mouseBinder.positions))

			const mouseBtn = document.createElement("a")
			toolbar.prepend(mouseBtn)
			mouseBtn.href="#"
			mouseBtn.classList.add("btn","big","trans")
			mouseBtn.innerText = "🐁"
			mouseBtn.dataset.balloon = "Toggle Debug Mouse"
			mouseBtn.onclick = ()=>this.mouseBinder.toggleDebug();
	}

	toggle() {
		this.bindCanvas.style.display = this.bindCanvas.style.display ? null:"none"
		this.loadMenu();
	}

	changeMenu(menu) {
		const newMenu = menu|| prompt("Change Menu")
		if(newMenu==this.mouseBinder.menu&&confirm("Delete Menu?")) {
			delete this.mouseBinder.positions[menu];
			this.bindCanvas.innerHTML = "";
			return;
		} else {
			this.mouseBinder.changeMenu(newMenu,true);
		}
		this.loadMenu();
	}

	loadMenu() {
		this.bindCanvas.innerHTML = "";
		const menu = this.mouseBinder.menu,
		positions = this.mouseBinder.positions[menu];
		if(!positions) {
			this.mouseBinder.positions[menu] = {}
			return;
		}else {
			for (const {left,top,right,bottom,target} of Object.values(positions)) {
				this.createBox(left,top,right,bottom,target)
				this.saveBox();
			}
		}
	}

	get bounds() {
		return this.mouseBinder.bounds;
	}

	createBox(left,top,right,bottom,target) {
		this.lastElement = document.createElement("span");
		this.bindCanvas.appendChild(this.lastElement)
		this.lastElement.style.position = "absolute"
		this.lastElement.style.background = "green"
		this.lastElement.addEventListener("click",e=>{
			if(confirm("Delete Box?")) {
				this.deleteBox(e.target)
			}
		})
		this.setBox(left,top,right,bottom,target)
	}
	setBox(left,top,right,bottom,target) {
		const [winLeft,winTop] = this.mouseBinder.canvasToWindow(left,top),
			[winRight,winBottom] = this.mouseBinder.canvasToWindow(right,bottom);
		if(left){
			this.lastElement.dataset.left = left
			this.lastElement.style.left = `${winLeft-this.bounds.left}px`;
		}
		if(top) {
			this.lastElement.dataset.top = top
			this.lastElement.style.top = `${winTop-this.bounds.top}px`;
		}
		if(right) {
			this.lastElement.dataset.right = right
			this.lastElement.style.width = `${winRight-pxToNumber(this.lastElement.style.left)-this.bounds.left}px`;
		}
		if(bottom) {
			this.lastElement.dataset.bottom = bottom
			this.lastElement.style.height = `${winBottom-pxToNumber(this.lastElement.style.top)-this.bounds.top}px`;
		}
		if(target) {
			this.lastElement.dataset.target = target;
		}
	}

	changeBox(left,top,right,bottom) {
		let d= this.lastElement.dataset
		this.setBox(
			left?d.left+left:null,
			top?d.top+top:null,
			right?d.right+right:null,
			bottom?d.bottom+bottom:null,
			)
	}

	saveBox() {
		const menu = this.mouseBinder.menu;
		if(!this.mouseBinder.positions[menu])this.mouseBinder.positions[menu] ||{}
		const positions = this.mouseBinder.positions[menu]
		const dataset = this.lastElement.dataset
		if(!dataset.target) dataset.target = prompt("Target Menu")
		let box =  {
			target:dataset.target,
			left:Number(dataset.left),
			right:Number(dataset.right),
			top:Number(dataset.top),
			bottom:Number(dataset.bottom)
		}
		positions[box.target] = box;
	}

	deleteBox(element) {
		const target = element.dataset.target,
			menu = this.mouseBinder.menu;
		delete this.mouseBinder.positions[menu][target]
		element.remove();
	}

	mouseDown(clientX,clientY) {
		this.mousedown = [clientX,clientY]
		const pos = this.mouseBinder.windowToCanvas(clientX,clientY)
		this.createBox(...pos)
	}
	mouseUp(clientX,clientY){
		this.mousedown = false
		const pos = this.mouseBinder.windowToCanvas(clientX,clientY)
		this.saveBox();

	}
	mouseMove(clientX,clientY) {
		if(!this.mousedown) return
		const pos = this.mouseBinder.windowToCanvas(clientX,clientY)
		this.setBox(null,null,...pos)
	}

	cleanup() {
		this.bindCanvas.remove()

		delete this.mouseBinder.posEditor;
	}
}

class MouseBinder {
	constructor(canvas=document.getElementsByTagName("canvas")[0],positions={}) {
		if(!canvas) throw new Error("No canvas was given");
		window.mouseBinder = this;
		this.canvas = canvas;
		this.positions = positions
		this.menu = Object.keys(positions)[0]||"main"
		this.menuBreadcrumbs = []
		this.menuPos = 0;
		this.posEditor = new PositionEditor(this)
		this.debugMouse = this.createDot()
		this.lastMousePos = [];

		//SkyRemote
		if(positions&&!!Object.keys(positions[this.menu]).length) {
			if(typeof SkyRemote === 'undefined') {
				console.error("No SkyRemote was found");
			} else {
				SkyRemote.onHoldButton("up", _=>this.up());
				SkyRemote.onHoldButton("down", _=>this.down());
				SkyRemote.onHoldButton("left", _=>this.left());
				SkyRemote.onHoldButton("right", _=>this.right());
				SkyRemote.onHoldButton("select", _=>this.selectDown());
				SkyRemote.onReleaseButton("select", _=>this.selectUp());
				SkyRemote.onHoldButton("backup", _=>this.backup());
				SkyRemote.onHoldButton("help", _=>this.help());
			}
		} else {
			additionalOnTriggerEvents.push(()=>{
				this.click(.5,.5)
			})
		}
	}


	get bounds() {
		return canvas.getBoundingClientRect()
	}

	canvasToWindow(x,y) {
		return [
		this.bounds.left + x * this.bounds.width,
		this.bounds.top + y * this.bounds.height
		]
	}
	windowToCanvas(x,y) {
		return [
		(x-this.bounds.left)/ this.bounds.width,
		(y-this.bounds.top)/ this.bounds.height
		]
	}

	createDot() {
		let dot = document.createElement("span");
		dot.style.background = "magenta"
		dot.style.width="10px"
		dot.style.height="10px"
		dot.style.position="absolute"
		dot.style.translate = "-50% -50%"
		dot.style.zIndex = "100";
		document.body.appendChild(dot);
		document.body.style.position = "relative"
		dot.style.display = "none"
		return dot;
	}

	toggleDebug() {
		this.debugMouse.style.display = this.debugMouse.style.display?null:"none"
	}

	sendMouseEvent(event,x=this.lastMousePos[0],y=this.lastMousePos[1]) {
		console.debug(`Mouse ${event} at ${[x,y]}`)
		const c = this.canvasToWindow(x,y);
		if(!this.eventTarget) this.setEventTarget(this.canvas,"mouse",MouseEvent)
		this.eventTarget.dispatchEvent(new (this.eventType)(this.eventPrefix+event,{
			clientX:parseFloat(c[0]),
			clientY:parseFloat(c[1]),
			bubbles: true,
			cancelable: true,
			composed: true
		}))
		this.debugMouse.style.left = `${c[0]}px`;
		this.debugMouse.style.top = `${c[1]}px`;
		this.lastMousePos = [x,y]
	}

	 mouseDown( x, y) {
		this.sendMouseEvent("down", x, y );
	}
	 mouseUp(x, y ) {
		this.sendMouseEvent("up", x, y );
	}
	 mouseMove( x, y) {
		this.sendMouseEvent("move",  x, y );
	}

	getItem(id=this.menuPos,menu=this.positions[this.menu]) {
		if(!menu) return
		if(typeof id === 'number') {
			return Object.values(menu)[id]
		}else {
			return menu[id]
		}
	}


	click(x, y ) {
		this.mouseDown( x, y );
		return new Promise((res, rej) => {
			setTimeout(() => {
				this.mouseUp(x, y );
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
		const menu= this.positions[this.menu];
		if(menu.select) {
			this.menuPos = "select"
		}
		if(!menu) return
		const item = this.getItem()
		if(!item) return
		console.debug(item);

		this.mouseMove(
			(item.left + item.right) / 2,
			(item.top + item.bottom) / 2
		);
	}



	changeMenu(menu,force) {
		if((force||Object.keys(this.positions).includes(menu))&&Object.keys(this.positions[this.menu]).includes(menu)) {
			this.menuBreadcrumbs.push(this.menu)
			console.debug(`Changing menu to ${menu}`)
			this.menu = menu;
			this.menuPos = 0;
			this.updateMenuPos();
		}
	}
	setEventTarget(element,prefix,type) {
		console.debug("setting event target to",element,prefix,type)
		this.eventTarget = element
		this.eventPrefix = prefix;
		this.eventType = type;


		this.eventTarget.addEventListener(this.eventPrefix+"up",({clientX,clientY})=>{
			const mouse = this.windowToCanvas(clientX,clientY),
			menu = this.positions[this.menu];
			if(!menu) return;
			for(const option in menu) {
				const item = menu[option];
				if(
					mouse[0] > item.left && mouse[0] < item.right &&
					mouse[1] > item.top && mouse[1] < item.bottom
				) {
					this.changeMenu(option)
					if(this.getItem("pause")) {
						this.menuBreadcrumbs = []
					}
				}
				this.updateMenuPos();
			}
		})
	}

	traverse(dx, dy) {
		const
			items = this.positions[this.menu],
			cb = this.getItem(),
			cx = (cb.left + cb.right) / 2,
			cy = (cb.top + cb.bottom) / 2;

		let rels = Object.values(items).map((eb, i) => {
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
		rels = rels.filter(e => (e.i !== this.menuPos) && (!dx || e.ux > 0) && (!dy || e.uy > 0));
		rels = rels.sort((a, b) => a.m - b.m).sort((a, b) => (dx ? a.mx - b.mx : dy ? a.my - b.my : a.m - b.m));

		if (!!rels.length) {
			this.menuPos= rels[0].i;
		}
		this.updateMenuPos();
	}

	left() {
		console.log("hi");
		this.traverse(-1,0)
	}
	right() {
		this.traverse(1,0)
	}
	up() {
		this.traverse(0,-1)
	}
	down() {
		this.traverse(0,1);
	}
	select() {
		const item = this.getItem("select")||this.getItem()
		this.clickItem(item.target)
	}
	selectDown() {
		const item = this.getItem("select")||this.getItem()
		this.holdItem(item.target)
	}
	selectUp() {
		const item = this.getItem("select")||this.getItem()
		this.releaseItem(item.target)
	}
	backup() {
		if(this.getItem("pause")) {
			console.debug("pausing")
			this.clickItem("pause")
		}
		else if(!!this.menuBreadcrumbs.length) {
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