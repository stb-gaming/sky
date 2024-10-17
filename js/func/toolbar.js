class Toolbar {
	/**
	 * 
	 * @param {HTMLElement} parent 
	 */
	constructor(parent, insertFunction = "appendChild") {
		if (parent && parent.classList && parent.classList.contains("toolbar")) {
			this.element = parent
			return;
		}
		const element = document.createElement("div");
		element.classList.add("toolbar");

		if (parent) parent[insertFunction](element)
		this.element = element;
	}

	get classList() {
		return this.element.classList
	}

	appendChild(...a) {
		this.element.appendChild(...a)
	}
	append(...a) {
		this.element.append(...a)
	}
	prepend(...a) {
		this.element.prepend(...a)
	}

	addButton({ label, emoji, img, action, insertFunction = "append" }) {
		const button = document.createElement(typeof action === "function" ? "button" : "a")
		this.element[insertFunction](button)
		button.href = "#"
		if (emoji) button.innerText = emoji
		if (label) button.dataset.balloon = label
		if (typeof action === "function") {
			button.onclick = action
		} else {
			button.classList.add("btn")
			button.href = action
		}
		button.classList.add("big", "trans")
		if (img) {
			const imgElement = new Image();
			imgElement.src = img;
			if (emoji) imgElement.alt = emoji
			imgElement.onload = () => {
				button.innerHTML = "";
				button.appendChild(imgElement)
			}
		}
		return button;
	}
}