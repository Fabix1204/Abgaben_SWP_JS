let game = {
    canvas: document.getElementById("field"),
    start() {
        console.log(this.canvas);
        this.context = this.canvas.getContext("2d");
        this.clear();
        this.interval = setInterval(redraw, 20);
        this.intervalNewEnemy = setInterval(newEnemy, 600);
        this.intervalNewBonus = setInterval(newBonus, 15000); // Spawn bonus every 15 seconds
        this.player = new sprite(30, 30, 10, 120, "/img/face-monkey.png");
        this.enemies = [];
        this.bonus = null;
        this.keys = { left: false, up: false, right: false, down: false }; // Track multiple key presses
        this.startTime = Date.now();
        this.time = 0;
        this.Score = 0;

        window.addEventListener('keydown', (e) => {
            switch (e.keyCode) {
                case 37: // left arrow
                    this.keys.left = true;
                    break;
                case 38: // up arrow
                    this.keys.up = true;
                    break;
                case 39: // right arrow
                    this.keys.right = true;
                    break;
                case 40: // down arrow
                    this.keys.down = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.keyCode) {
                case 37: // left arrow
                    this.keys.left = false;
                    break;
                case 38: // up arrow
                    this.keys.up = false;
                    break;
                case 39: // right arrow
                    this.keys.right = false;
                    break;
                case 40: // down arrow
                    this.keys.down = false;
                    break;
            }
        });
    },
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    updateTime() {
        let currentTime = Date.now();
        let elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
        if (elapsedTime > this.time) {
            this.time = elapsedTime;
            this.Score += 1;
        }
    },
    // Prevents player from moving outside the canvas bounds
    preventOutOfBounds() {
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) this.player.x = this.canvas.width - this.player.width;
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > this.canvas.height) this.player.y = this.canvas.height - this.player.height;
    }
}

function start() {
    console.log("Game started");
    game.start();
}

// Sprite constructor
function sprite(width, height, x, y, imageSrc) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.image = new Image(); // Create a new image object
    this.image.src = imageSrc; // Load the image

    this.redraw = function() {
        ctx = game.context;
        if (this.image.complete) {
            // Draw the image if it is loaded
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}

function redraw() {
    game.clear();
    game.updateTime();

    // Player movement (allows diagonal movement)
    if (game.keys.left) game.player.x -= 3;
    if (game.keys.up) game.player.y -= 3;
    if (game.keys.right) game.player.x += 3;
    if (game.keys.down) game.player.y += 3;

    // Prevent player from moving outside the canvas
    game.preventOutOfBounds();

    // Redraw player
    game.player.redraw();

    // Move and redraw enemies
    game.enemies.forEach((e) => {
        let yDelta = Math.floor(Math.random() * 11) - 5; // Random vertical movement
        e.x -= 1; // Move left
        e.y += yDelta;
        e.redraw();
    });

    // Move and redraw bonus (if it exists)
    if (game.bonus) {
        game.bonus.x -= 1; // Move left
        game.bonus.redraw();
    }

    // Check for collisions with enemies and bonuses
    checkCollision();
    checkBonusCollision();

    // Display time and score on the canvas
    game.context.font = "20px Arial";
    game.context.fillStyle = "black";
    game.context.fillText("Time: " + game.time + "s", 10, 20);
    game.context.fillText("Score: " + game.Score, 10, 40);
}

function newEnemy() {
    let y = Math.floor(Math.random() * (game.canvas.height - 30)); // Adjust for canvas height
    let e = new sprite(30, 30, game.canvas.width, y, "/img/face-devilish.png");
    game.enemies.push(e);
}

function newBonus() {
    let y = Math.floor(Math.random() * (game.canvas.height - 30));
    let b = new sprite(30, 30, game.canvas.width, y, "/img/face-cool.png");
    game.bonus = b;
}

function checkCollision() {
    game.enemies.forEach((e) => {
        if (game.player.x < e.x + e.width &&
            game.player.x + game.player.width > e.x &&
            game.player.y < e.y + e.height &&
            game.player.y + game.player.height > e.y) {
            console.log("collision with enemy");
            stopGame();
        }
    });
}

function checkBonusCollision() {
    if (game.bonus &&
        game.player.x < game.bonus.x + game.bonus.width &&
        game.player.x + game.player.width > game.bonus.x &&
        game.player.y < game.bonus.y + game.bonus.height &&
        game.player.y + game.player.height > game.bonus.y) {
        console.log("Bonus collected!");
        game.Score += 10;
        game.bonus = null;
    }
}

function stopGame() {
    clearInterval(game.interval);
    clearInterval(game.intervalNewEnemy);
    clearInterval(game.intervalNewBonus);
    console.log("Game stopped");
    alert("Game over");
}