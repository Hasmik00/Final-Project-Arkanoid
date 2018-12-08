var arkanoid;

window.addEventListener("load", function () {
    // create canvas 
    let canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.cursor = "none";
    // add canvas to game area
    let gameArea = document.getElementById("gameArea");
    if (gameArea) {
        gameArea.appendChild(canvas);
    }
    // check is browser supports canvas
    if (canvas.getContext) {
        let context = canvas.getContext("2d");
        // get status bar
        let statusBar = document.getElementById('statusBar');
        // init and run game engine
        arkanoid = new Arcanoid(canvas, context, statusBar);
        arkanoid.init();
       
        renderGame();
    } else {
        alert("Sorry, but your browser doesn't support a canvas.");
    }
});

function renderGame() {
    arkanoid.render();
    this.requestAnimationFrame(renderGame);
}

const Arcanoid = function (canvas, context, statusBar) {
    const BRICK_WIDTH = 80;
    const BRICK_HEIGHT = 25;
    const BRICK_COLISION_SCORE = 100;
    const BRICKS_COUNT_IN_ROW = 5;
    const BRICK_TYPES = [1, 2, 3, 4, 5];
 
    const BALL_RADIUS = 10;
    const BALL_DEFAULT_SPEED = 3;
    const BALL_MAX_SPEED = 6;

    const PADDLE_WIDTH = 80;
    const PADDLE_HEIGHT = 10;
    const PADDLE_SPEED = 1;

    const MAX_LEVEL = 4;

    // game objects
    this.bricks = [];
    this.ball = new Ball(canvas.width / 2 - BALL_RADIUS, canvas.height - PADDLE_HEIGHT - BALL_RADIUS, BALL_RADIUS, BallDirections.NONE, BALL_DEFAULT_SPEED);
    this.paddle = new Paddle(canvas.width / 2 - PADDLE_WIDTH / 2, canvas.height - PADDLE_HEIGHT - 5, PADDLE_WIDTH, PADDLE_HEIGHT);

    // sound objects
    this.bounceBrickSound = new Sound("./resources/bounce.wav", 1, false);
    this.bouncePaddleSound = new Sound("./resources/bouncePaddle.wav", 1, false);
    this.gameOverSound = new Sound("./resources/gameOver.wav", 1, false);
    this.levelUp = new Sound("./resources/levelUp.mp3", 1, false);
    this.gameFail = new Sound("./resources/gameFail.wav", 1, false);
    this.gameWinSound = new Sound("./resources/youWin.mp3", 1, false);
    this.gameSound = new Sound("./resources/gameTheme.wav", 0.05, true);
   
    // game controls
    this.level = 0;
    this.score = 0;
    this.lives = 10;
    this.statusBar = statusBar;
    this.gameOver = false;
    this.gameWin = false;
    this.gamePaused = false;

    this.init = function () {
        this.level = 1;
        this.lives = 30;
        this.score = 0;
        this.gameOver = false;
        this.gameWin = false;
        this.gamePaused = false;
        this.ball.dir = BallDirections.NONE;
        this.ball.speed = BALL_DEFAULT_SPEED;
        this.initLevel();
    };

    this.initLevel = function () {
        this.initBricks(8, this.level + 1, BRICK_WIDTH, BRICK_HEIGHT);
    };

    // initialize the briks wall
    this.initBricks = function (column, row, brick_width, brick_height ) {
        this.bricks.length = 0; //clear bricks array
        for (var i = 0; i < row; i++) {
            this.bricks[i] = [];
            let rndPositions = Helpers.getRandomPositions(0, column, BRICKS_COUNT_IN_ROW);
            for (var j = 0; j < column; j++) {
                if (rndPositions.includes(j)) {
                    this.bricks[i][j] = new Brick(j * brick_width, i * brick_height, brick_width, brick_height, Helpers.getRandomFromArray(BRICK_TYPES));
                }
            }
        }
    };

    // render game objects
    this.render = function () {
        // clear objects
        context.clearRect(0, 0, canvas.width, canvas.height);
        // stop theme sound
        this.bounceBrickSound.stop();
        // check updates and draw
        this.update();
        this.draw();
    };

    // draw objects
    this.draw = function () {
        // set canvas background to black
        context.fillStyle = 'rgb(239,222,222)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        // draw objects
        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        // draw text: "Pause"
        if (this.gamePaused && !this.gameWin && !this.gameOver) {
            context.fillStyle = 'rgb(180,103,103)';
            context.font = 'bold 20px Arial';
            context.fillText('Pause', canvas.width / 2 - 40, canvas.height / 2);
        }
        // draw text: "Game Over" 
        if (this.gameOver) {
            context.fillStyle = 'rgb(180,103,103)';
            context.font = 'bold 20px Arial';
            context.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2);
        }
        // draw text: "You Win"
        if (this.gameWin) {
            context.fillStyle = 'rgb(180,103,103)';
            context.font = 'bold 20px Arial';
            context.fillText('You Win', canvas.width / 2 - 40, canvas.height / 2);
        }
        // update game score
        this.updateStatus();
    };

    // draw briks wall
    this.drawBricks = function () {
        context.beginPath();
        for (var i = 0; i < this.bricks.length; i++) {
            for (var j = 0; j < this.bricks[i].length; j++) {
                if (this.bricks[i][j] && this.bricks[i][j].lives > 0) {
                    gradient = context.createLinearGradient(this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].x + this.bricks[i][j].width, this.bricks[i][j].y + this.bricks[i][j].height);
                    switch (this.bricks[i][j].lives) {
                        case 1: gradient.addColorStop(0, 'rgb(150,139,137)'); gradient.addColorStop(1, 'rgb(189,174,173)'); context.fillStyle = gradient; break;
                        case 2: gradient.addColorStop(0, 'rgb(224,154,87)'); gradient.addColorStop(1, 'rgb(236,204,156)'); context.fillStyle = gradient; break;
                        case 3: gradient.addColorStop(0, 'rgb(138,117,108)'); gradient.addColorStop(1, 'rgb(234,200,175)'); context.fillStyle = gradient; break; 
                        case 4: gradient.addColorStop(0, 'rgb(187,108,88)'); gradient.addColorStop(1, 'rgb(234,200,175)'); context.fillStyle = gradient; break; 
                        case 5: gradient.addColorStop(0, 'rgb(103,64,62)'); gradient.addColorStop(1, 'rgb(168,90,65)'); context.fillStyle = gradient; break;
                        default: gradient.addColorStop(0, 'rgb(103,64,62)'); gradient.addColorStop(1, 'rgb(168,90,65)'); context.fillStyle = gradient; break; 
                    }
                    context.fillRect(this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width - 2, this.bricks[i][j].height - 2);
                }
            }
        }
        context.closePath();
    };

    // draw ball 
    this.drawBall = function () {
        context.beginPath();
        let gradient = context.createRadialGradient(this.ball.x, this.ball.y, 1, this.ball.x, this.ball.y, this.ball.radius);
        gradient.addColorStop(0, 'rgb(250,246,218)');
        gradient.addColorStop(1, 'rgb(103,64,62)');
        context.arc(this.ball.x, this.ball.y, this.ball.radius, 0, 2 * Math.PI, false);
        context.fillStyle = gradient;
        context.fill();
        context.closePath();
    };

    // draw paddle
    this.drawPaddle = function () {
        context.beginPath();
        let gradient = context.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x + this.paddle.width, this.paddle.y + this.paddle.height);
        gradient.addColorStop(0, 'rgb(155,110,5)');
        gradient.addColorStop(1, '#E19F5D');
        context.fillStyle = gradient;
        context.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        context.closePath();
    };

    // check changes and update objects
    this.update = function () {
        if (this.gamePaused || this.gameWin || this.gameOver) return;

        // move ball object
        if (this.ball.dir & BallDirections.RIGHT) this.ball.x += this.ball.speed;
        else if (this.ball.dir & BallDirections.LEFT) this.ball.x -= this.ball.speed;

        if (this.ball.dir & BallDirections.UP) this.ball.y -= this.ball.speed;
        else if (this.ball.dir & BallDirections.DOWN) this.ball.y += this.ball.speed;

        // ball bounce from paddle
        if ((this.ball.x + this.ball.radius > this.paddle.x && this.ball.x - this.ball.radius < this.paddle.x + this.paddle.width) &&
            (this.ball.y + this.ball.radius > this.paddle.y)) {
            this.bouncePaddleSound.play();
            // increase ball speed
            if (this.ball.speed < BALL_MAX_SPEED) this.ball.speed += 0.25;
            // set ball direction
            if (this.ball.dir & BallDirections.DOWN) {
                this.ball.dir = this.ball.dir - BallDirections.DOWN + BallDirections.UP;
            } else if (this.ball.dir & BallDirections.UP) {
                this.ball.dir = this.ball.dir - BallDirections.UP + BallDirections.DOWN;
            }
        }

        // ball bounce from walls 
        // left
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.dir = this.ball.dir - BallDirections.LEFT + BallDirections.RIGHT;
        }
        // right
        if (this.ball.x + this.ball.radius > canvas.width) {
            this.ball.x = canvas.width - this.ball.radius;
            this.ball.dir = this.ball.dir - BallDirections.RIGHT + BallDirections.LEFT;
        }
        // top
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.dir = this.ball.dir - BallDirections.UP + BallDirections.DOWN;
        }

        // bottom - lost one life
        if (this.ball.y + this.ball.radius > canvas.height) {
            this.lives--;
            this.ball.speed = BALL_DEFAULT_SPEED;
            // game over
            if (this.lives === 0) {
                this.gameOverSound.play();
                this.gameSound.stop();
                this.gameOver = true;
            } else {
                // continue to play
                this.gameFail.play();
                this.ball.x = canvas.width / 2;
                this.ball.y = canvas.height / 2;
                this.ball.dir = BallDirections.NONE;
            }
        }

        if (this.ball.dir === BallDirections.NONE) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius * 2;
        }

        // ball bounce from bricks
        for (var i = 0; i < this.bricks.length; i++) {
            for (var j = 0; j < this.bricks[i].length; j++) {
                if (this.bricks[i][j] && this.bricks[i][j].lives > 0) {
                    // checking of collisions and update directions
                    if (this.ball.dir === BallDirections.LEFT + BallDirections.UP) {
                        if (this.isPointInRect(this.ball.x - this.ball.speed, this.ball.y - 0, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.x = this.bricks[i][j].x + this.bricks[i][j].width + this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.LEFT + BallDirections.RIGHT;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                        if (this.isPointInRect(this.ball.x - 0, this.ball.y - this.ball.speed, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.y = this.bricks[i][j].y + this.bricks[i][j].height + this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.UP + BallDirections.DOWN;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                    } else if (this.ball.dir === BallDirections.LEFT + BallDirections.DOWN) {
                        if (this.isPointInRect(this.ball.x - this.ball.speed, this.ball.y + 0, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.x = this.bricks[i][j].x + this.bricks[i][j].width + this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.LEFT + BallDirections.RIGHT;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                        if (this.isPointInRect(this.ball.x - 0, this.ball.y + this.ball.speed, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.y = this.bricks[i][j].y - this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.DOWN + BallDirections.UP;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                    } else if (this.ball.dir === BallDirections.RIGHT + BallDirections.UP) {
                        if (this.isPointInRect(this.ball.x + this.ball.speed, this.ball.y - 0, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.x = this.bricks[i][j].x - this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.RIGHT + BallDirections.LEFT;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                        if (this.isPointInRect(this.ball.x + 0, this.ball.y - this.ball.speed, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.y = this.bricks[i][j].y + this.bricks[i][j].height + this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.UP + BallDirections.DOWN;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                    } else if (this.ball.dir === BallDirections.RIGHT + BallDirections.DOWN) {
                        if (this.isPointInRect(this.ball.x + this.ball.speed, this.ball.y + 0, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.x = this.bricks[i][j].x - this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.RIGHT + BallDirections.LEFT;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                        if (this.isPointInRect(this.ball.x + 0, this.ball.y + this.ball.speed, this.bricks[i][j].x, this.bricks[i][j].y, this.bricks[i][j].width, this.bricks[i][j].height)) {
                            this.bounceBrickSound.play();
                            this.ball.y = this.bricks[i][j].y - this.ball.speed;
                            this.ball.dir = this.ball.dir - BallDirections.DOWN + BallDirections.UP;
                            this.bricks[i][j].lives--;
                            this.score += BRICK_COLISION_SCORE;
                            return;
                        }
                    }
                }
            }
        }

        // check is game win or level up
        let full_level_brick_lives = 0; // remaining lives counts 
        for (let i = 0; i < this.bricks.length; i++) {
            for (let j = 0; j < this.bricks[i].length; j++) {
                if (this.bricks[i][j]) {
                    full_level_brick_lives += this.bricks[i][j].lives;
                }
            }
        }

        if (full_level_brick_lives === 0) {
            this.level++;
            if (this.level < MAX_LEVEL) {
                // level up
                this.levelUp.play();
                this.ball.dir = BallDirections.NONE;
                this.initLevel(this.level);
            } else {
                // win
                this.gameWinSound.play();
                this.gameSound.stop();
                this.gameWin = true;
            }
        }
    };

    // update game info
    this.updateStatus = function () {
        const space = "&nbsp;";
        this.statusBar.innerHTML = "Level: " + this.level + space.repeat(7) +
                                   "Score: " + this.score + space.repeat(7) +
                                   "Lives: " + this.lives + space.repeat(7);
    };

    // check intersections for collision detection
    this.isPointInRect = function (x, y, rect_x, rect_y, rect_width, rect_height) {
        return (x > rect_x && x < rect_x + rect_width) && (y > rect_y && y < rect_y + rect_height);
    };

    // game pause
    this.togglePause = function () {
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.gameSound.stop();
        } else {
            if (!this.gameOver && !this.gameWin) {
                this.gameSound.play();
            }
        }
    };

    // controle paddle
    this.movePaddleLeft = function () {
        if (this.paddle.x > 0)
            this.paddle.x -= 10 * PADDLE_SPEED;
    };

    this.movePaddleRight = function () {
        if (this.paddle.x < canvas.width - this.paddle.width)
            this.paddle.x += 10 * PADDLE_SPEED;
    };

    this.setPaddlePos = function (x) {
        if (this.gamePaused || this.gameWin || this.gameOver) return;
        if (x < 0) x = 0;
        if (x > canvas.width - this.paddle.width) x = canvas.width - this.paddle.width;
        this.paddle.x = x;
    };

    // game start
    this.startGame = function () {
        if (this.gamePaused) return;
        if (this.ball.dir === BallDirections.NONE) {
            this.ball.dir = BallDirections.RIGHT + BallDirections.UP;
        }
        if (!this.gameOver && !this.gameWin) {
            this.gameSound.play();
        }
    };
};

// game objects definitions
const BallDirections = {
    NONE: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 4,
    DOWN: 8
};

const Brick = function (x, y, width, height, lives) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.lives = lives;
};

const Ball = function (x, y, radius, dir, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dir = dir;
    this.speed = speed;
};

const Paddle = function (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};

const Sound = function (src, volume, isLoop) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.loop = isLoop;
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    this.sound.volume = volume;
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    };
    this.stop = function () {
        this.sound.pause();
    };
};

// helper functions
const Helpers = {
    getRandomPositions: function (min, max, count) {
        var result = [];
        var bucket = [];
        for (let i = min; i < max; i++) {
            bucket.push(i);
        }

        for (let i = 0; i < count; i++) {
            result.push(bucket.splice(Math.floor(Math.random() * bucket.length), 1)[0]);
        }

        return result;
    },
    getRandomFromArray: function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
};

// registered even listeners and handler functions
// for game control
const KeyCodes = {
    ENTER: 13,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    A: 65,
    D: 68,
    S: 83,
    W: 87
};

document.addEventListener("keydown", function (event) {
    switch (event.keyCode) {
        case KeyCodes.SPACE:
            arkanoid.togglePause();
            break;
        case KeyCodes.UP:
        case KeyCodes.W:
            arkanoid.startGame();
            break;
        case KeyCodes.ENTER:
            arkanoid.start();
            renderGame();
            break;
        case KeyCodes.LEFT:
        case KeyCodes.A:
            arkanoid.movePaddleLeft();
            break;
        case KeyCodes.RIGHT:
        case KeyCodes.D:
            arkanoid.movePaddleRight();
            break;
        case KeyCodes.DOWN:
        case KeyCodes.S:
            break;
    }
});

document.addEventListener("mousemove", function (event) {
    arkanoid.setPaddlePos(event.pageX);
});

document.addEventListener("click", function (event) {
    arkanoid.startGame();
});

document.addEventListener("touchstart", function (event) {
    event.preventDefault();
    if (event.targetTouches.length > 1) {
        arkanoid.togglePause();
    } else {
        arkanoid.startGame();
    }
}, false);

document.addEventListener("touchend", function (event) {
    event.preventDefault();
    if (event.targetTouches.length > 1) {
        arkanoid.togglePause();
    }
}, false);

document.addEventListener("touchmove", function (event) {
    event.preventDefault();
    if (event.targetTouches.length === 1) {
        arkanoid.setPaddlePos(event.targetTouches[0].pageX);
    }
}, false);