(function () {
	"use strict";

	const addEvt = window.addEventListener,gameEvents = {}

	window.addEventListener = function (...args) {
		const eventTypes = ["keydown", "keyup"];

		if (eventTypes.includes(args[0])) {
			if (!gameEvents.hasOwnProperty(args[0])) {

				console.log(...args);
				gameEvents[args[0]] = args[1];
			}
		} else {
			addEvt(...args);
		}
	};


	const canvas = document.getElementsByTagName("canvas")[0],
		context = canvas.getContext("2d"),
		GAME_STATES={
			ALIVE:0,
			DEAD:1,
		},
		snake = {
			state: GAME_STATES.ALIVE,
			body: [],
			length: 3,
			dir: 0,
			width: 20,
			speed: 5,
			bodySprite: new Image(),
			bodySpriteLoaded: false
		},
		playingArea=[
			Math.floor(canvas.width/snake.width),
			Math.floor(canvas.height/snake.width)
		],
		star={
			pos:[0,0]
		}

	let last = getTime();

	snake.bodySprite.onload = ()=>{
		snake.bodySpriteLoaded = true;
	}
	snake.bodySprite.src = "https://stb-gaming.github.io/sky-games-images/SKY%20Games/nogame.png"

	function getTime() {
		return (new Date()).getTime() / 1000;
	}
	function renderBody(x,y,d) {
		if(snake.bodySpriteLoaded) {
			context.drawImage(snake.bodySprite,x,y,d,d)
		} else {
				context.beginPath();
				context.arc(x, y, d / 2, 0, 2 * Math.PI);
				context.closePath();

				context.fillStyle = "pink";
				context.fill();
		}
	}


	function placeStar() {
		function underSnake(sx,sy){
			for(let i = 2; i<snake.body.length;i+=2) {
				let x = snake.body[i],
				y = snake.body[i+1];
				if(sx===x&&sy===y) {
					return true
				}
			}
		}
		do {
			star.pos[0] = Math.floor(Math.random()*playingArea[0]);
			star.pos[1] = Math.floor(Math.random()*playingArea[1]);
			
		} while (underSnake(star.pos[0],star.pos[1]));
	}


	function renderStar() {
		context.fillStyle = "orange";
		context.fillRect(star.pos[0]*snake.width,star.pos[1]*snake.width,snake.width,snake.width);
	}

	function checkCollisions() {
		const snakeX = snake.body[0],snakeY = snake.body[1];

		for(let i = 2; i<snake.body.length;i+=2) {
			let x = snake.body[i],
			y = snake.body[i+1];
			if(snakeX===x&&snakeY===y) {
				snake.state = GAME_STATES.DEAD
				console.log("DEAD");
				return;
			}
		}

		if(snakeX==star.pos[0]&&star.pos[1]==snakeY) {
			console.log("WIN!");
			snake.length++;
			placeStar();
		}
	}

	function loop() {
		const now = getTime(),
			delta = now - last;

		switch (snake.state) {
			case GAME_STATES.ALIVE:
				if (delta >= 1 / snake.speed) {
					//console.log(`FPS: ${1 / delta}, DT: ${delta}`);
					last = now;

					context.fillStyle = "white"
					context.fillRect(0, 0, canvas.width, canvas.height);

					for (let i = snake.length * 2 - 2; i > -1; i -= 2) {
						snake.body[i] = snake.body[0] || 0;
						snake.body[i + 1] = snake.body[i + 1] || 0;

						if (i) {
							snake.body[i] = snake.body[i - 2];
							snake.body[i + 1] = snake.body[i - 1];
						} else {
							if (snake.dir & 2)
								snake.body[1] += snake.dir & 1 ? -1 : 1;
							else
								snake.body[0] += snake.dir & 1 ? -1 : 1;
						}


						renderBody(snake.body[i] * snake.width, snake.body[i + 1] * snake.width,snake.width);

					}
					renderStar();

					checkCollisions();
				}
				break;
			default:

				break;
		}


		requestAnimationFrame(loop);
	}

	window.addEventListener('keydown', e => {
		e.preventDefault();

		switch (e.code) {
			case "ArrowLeft":
				snake.dir = 0 + 1;
				break;
			case "ArrowRight":
				snake.dir = 0 + 0;
				break;
			case "ArrowUp":
				snake.dir = 2 + 1;
				break;
			case "ArrowDown":
				snake.dir = 2 + 0;
				break;

			default:
				break;
		}
	});

	loop();

	setupTouchEvents();
	addGamepadEvents();
	addKeyboardEvents();
	connectToGame();

})();