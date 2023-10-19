(function () {
	"use strict";



	const canvas = document.getElementsByTagName("canvas")[0],
		context = canvas.getContext("2d"),
		GAME_STATES={
			DEMO:0,
			LOADING:1,
			ALIVE:2,
			DEAD:3,
		},
		SNAKE_DIR={
			LEFT:0 + 1,
			RIGHT:0 + 0,
			UP:2 + 1,
			DOWN:2 + 0
		},
		snake = {
			state: GAME_STATES.DEMO,
			body: [],
			length: 3,
			lastDir:0,
			dir: 0,
			width: 20,
			speed: 10,
			bodySprite: new Image(),
			bodySpriteLoaded: false
		},
		playingArea=[
			Math.floor(canvas.width/snake.width),
			Math.floor(canvas.height/snake.width)
		],
		star={
			pos:[playingArea[0]/2-1,playingArea[1]/2]
		}

	let last = getTime(),now,delta;
	window.snake = snake

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
		if(snake.state===GAME_STATES.DEMO) {
			star.pos = [playingArea[0]/2-1,playingArea[1]/2]
			return
		}
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
		if(snake.state!==GAME_STATES.ALIVE) return;
		const snakeX = snake.body[0],snakeY = snake.body[1];

		for(let i = 4; i<snake.body.length;i+=2) {
			let x = snake.body[i],
			y = snake.body[i+1];
			if(snakeX===x&&snakeY===y) {
				snake.state = GAME_STATES.DEAD
				console.debug("DEAD");
				setTimeout(()=>{
					snake.length = 3
					snake.state = GAME_STATES.DEMO
					placeStar();
				},2000)
				return;
			}
		}

		if(snakeX==star.pos[0]&&star.pos[1]==snakeY) {
			console.debug("WIN!");
			snake.length++;
			placeStar();
		}
	}

	function checkSnake() {
		if(snake.body.length <2|| (typeof snake.body[0]==='undefined '&&typeof snake.body[1]==='undefined')) {
			snake.body = [playingArea[0]/2-4,playingArea[1]/2-3]
		}
	}

	function gameText(text,center) {
		const textElement = document.getElementById("gametext")|| document.createElement("p")
		textElement.innerText = text;
		textElement.id = "gametext"
		if(center) textElement.classList.add("center")
		canvas.parentElement.appendChild(textElement)
	}

	function deleteGameText() {
		document.getElementById("gametext")?.remove()
	}

	function updateScore() {
		const textElement = document.getElementById("scoretext")|| document.createElement("p");
		let s =  snake.length;
		s = (s<100?"0":"")+(s<10?"0":"")+s;
		textElement.innerText = "SCORE: " + s;
		textElement.id = "scoretext";
		canvas.parentElement.appendChild(textElement)
	}

	function snakeTick() {
		checkSnake();
		updateScore();
		if (delta >= 1 / snake.speed) {
			console.debug(`FPS: ${1 / delta}, DT: ${delta}`);
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
					snake.lastDir = snake.dir;
				}


				renderBody(snake.body[i] * snake.width, snake.body[i + 1] * snake.width,snake.width);

			}
			renderStar();

			checkCollisions();
		}
	}

	function changeDir(dir) {
		const dirCheck = snake.lastDir >>1;
		if(dirCheck!==dir>>1) snake.dir = dir
	}

	function loop() {
		now = getTime();
			delta = now - last;

		switch (snake.state) {
			case GAME_STATES.DEMO:
				gameText("Press any ARROW key to Start")
				snakeTick();
				if(snake.body[0]>star.pos[0]+3) {
					changeDir(SNAKE_DIR.DOWN)
				}
				if(snake.body[0]<star.pos[0]-3) {
					changeDir(SNAKE_DIR.UP)
				}
				if(snake.body[1]>star.pos[1]+3) {
					changeDir(SNAKE_DIR.LEFT)
				}
				if(snake.body[1]<star.pos[1]-3) {
					changeDir(SNAKE_DIR.RIGHT)
				}

				break;
			case GAME_STATES.ALIVE:
				snakeTick()
				
				break;
			case GAME_STATES.DEAD:
					context.fillStyle = "white"
					context.fillRect(0, 0, canvas.width, canvas.height);

					gameText("YOU DIED")

			default:
				context.fillStyle = "white"
				context.fillRect(0, 0, canvas.width, canvas.height);

				break;
		}


		requestAnimationFrame(loop);
	}

	window.addEventListener('keydown', e => {
		e.preventDefault();
		if(snake.state === GAME_STATES.DEMO) {
			snake.state=GAME_STATES.LOADING;

			gameText("GET READY",true)
			setTimeout(()=>{
				gameText("GO",true)
			},1000)
			setTimeout(()=>{
				deleteGameText();
				snake.state = GAME_STATES.ALIVE
			},1500)
		}
		if(snake.state !== GAME_STATES.ALIVE) return

		switch (e.code) {
			case "ArrowLeft":
				changeDir(SNAKE_DIR.LEFT)
				break;
			case "ArrowRight":
				changeDir(SNAKE_DIR.RIGHT)
				break;
			case "ArrowUp":
				changeDir(SNAKE_DIR.UP)
				break;
			case "ArrowDown":
				changeDir(SNAKE_DIR.DOWN)
				break;

			default:
				break;
		}
	});
	
	placeStar();
	gameText("Press any ARROW key to Start")
	loop();

})();