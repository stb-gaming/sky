(function () {
	"use strict";
	const canvas = document.getElementsByTagName("canvas")[0],
		context = canvas.getContext("2d"),
		snake = {
			body: [],
			length: 3,
			dir: 0,
			width: 20,
			speed: 5
		};

	let last = getTime();

	window.snake = snake;
	context.fillStyle = "pink";

	function getTime() {
		return (new Date()).getTime() / 1000;
	}

	function loop() {
		const now = getTime(),
			delta = now - last;

		if (delta >= 1 / snake.speed) {

			console.log(`FPS: ${1 / delta}, DT: ${delta}`);
			last = now;

			context.clearRect(0, 0, canvas.width, canvas.height);

			for (let i = snake.length * 2 - 2; i > -1; i -= 2) {
				snake.body[i] = snake.body[0] || 0;
				snake.body[i + 1] = snake.body[i + 1] || 0;

				//console.log([snake.body[i], snake.body[i + 1]], [snake.body[i - 2], snake.body[i - 1]]);
				if (i) {
					snake.body[i] = snake.body[i - 2];
					snake.body[i + 1] = snake.body[i - 1];
				} else {
					if (snake.dir & 2)
						snake.body[1] += snake.dir & 1 ? -1 : 1;
					else
						snake.body[0] += snake.dir & 1 ? -1 : 1;
				}

				context.beginPath();
				context.arc(snake.body[i] * snake.width, snake.body[i + 1] * snake.width, snake.width / 2, 0, 2 * Math.PI);
				context.closePath();
				context.fill();

			}
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

})();