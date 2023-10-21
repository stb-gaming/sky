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

		if(location.hostname == "localhost") {
			this.helperButtons();
		}
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
	}

	changeMenu(menu) {
		const newMenu = menu|| prompt("Change Menu")
		if(newMenu==this.mouseBinder.currentMenu&&confirm("Delete Menu?")) {
			delete this.mouseBinder.positions[menu];
			this.bindCanvas.innerHTML = "";
			return;
		}
		this.mouseBinder.currentMenu = newMenu;
		this.loadMenu();
	}

	loadMenu() {
		this.bindCanvas.innerHTML = "";
		const menu = this.mouseBinder.currentMenu,
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
		const menu = this.mouseBinder.currentMenu;
		if(!this.mouseBinder.positions[menu])this.mouseBinder.positions[menu] ||{}
		const positions = this.mouseBinder.positions[menu]
		const dataset = this.lastElement.dataset
		let box =  {
			target:dataset.target,
			left:Number(dataset.left),
			right:Number(dataset.right),
			top:Number(dataset.top),
			bottom:Number(dataset.bottom)
		}
		if(!box.target) box.target = prompt("Target Menu")
		positions[box.target] = box;
	}

	deleteBox(element) {
		const target = element.dataset.target,
			menu = this.mouseBinder.currentMenu;
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
		this.currentMenu = Object.keys(positions)[0]||"main"
		this.menuPos = 0;
		this.posEditor = new PositionEditor(this)
		this.debugMouse = this.createDot()
		this.lastMousePos = []

		this.canvas.addEventListener("mouseup", e => {
		})

		this.updateMenuPos();
	}

	setEventTarget(element,prefix,type) {
		this.eventTarget = element
		this.eventPrefix = prefix;
		this.eventType = type;
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

	sendMouseEvent(event,x,y) {
		if(!x||!y) {
			x = this.lastMousePos[0]
			y = this.lastMousePos[1]
		}
		const c = this.canvasToWindow(x,y);
		(this.eventTarget||this.canvas).dispatchEvent(new (this.eventType||MouseEvent)((this.eventPrefix||"mouse")+event,{
			clientX:c[0],
			clientY:c[1],
			bubbles: true,
			cancelable: true,
			composed: true
		}))
		this.debugMouse.style.left = `${c[0]}px`;
		this.debugMouse.style.top = `${c[1]}px`;
		this.lastMousePos = [x,y]
	}

	 mouseDown( x, y) {
		console.debug("pressing mouse at", x, y );
		this.sendMouseEvent("down", x, y );
	}
	 mouseUp(x, y ) {
		console.debug("releasing mouse at", x, y );
		this.sendMouseEvent("up", x, y );
	}
	 mouseMove( x, y) {
		console.debug("moving mouse to",  x, y );
		this.sendMouseEvent("move",  x, y );
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

	updateMenuPos() {
		const menuOptions = Object.values(this.positions[this.currentMenu]);
		if (this.menuPos < 0) {
			this.menuPos = 0;
		}
		if (this.menuPos >= menuOptions.length) {
			this.menuPos = menuOptions.length - 1;
		}
		const menuPosBounds = menuOptions[this.menuPos];

		this.mouseMove(
			(menuPosBounds.left + menuPosBounds.right) / 2,
			(menuPosBounds.top + menuPosBounds.bottom) / 2
		);
	}
}