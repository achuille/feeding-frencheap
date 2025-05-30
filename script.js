const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreElement = document.getElementById("final-score");
const playAgainButton = document.getElementById("play-again-button");

canvas.width = 800;
canvas.height = 600;

let gameState = 'start'; // 'start', 'playing', 'gameOver'
let fish = { x: canvas.width / 2, y: canvas.height / 2, size: 40, dx: 0 };
let food = [];
let score = 0;
let foodInterval;

// Player growth variables
let foodToGrow = 5; // Initial food count needed to grow
let foodEatenSinceLastGrowth = 0;
const growthAmount = 5; // How much size increases
const maxFishSize = 80; // Maximum player fish size
const growthFactor = 1.2; // Factor to increase foodToGrow after each growth

// Image assets
const playerImage = new Image();
playerImage.src = "assets/player_fish.png";
const foodImage = new Image();
foodImage.src = "assets/food_fish.png";
const enemyImage = new Image();
enemyImage.src = "assets/enemy_fish.png";
const speedPowerUpImage = new Image();
speedPowerUpImage.src = "assets/powerup_speed.png";

let particles = [];
let enemies = [];
let enemyInterval;
let powerUps = [];
let powerUpInterval;

// Power-up state
let speedMultiplier = 1.0;
let isSpeedBoostActive = false;
let speedBoostTimerId = null;

// Track mouse movement
let isPointerLocked = false;

function initGame() {
    // Reset game variables
    // Reset game variables
    fish = { x: canvas.width / 2, y: canvas.height / 2, size: 40, dx: 0 };
    food = [];
    particles = [];
    enemies = [];
    powerUps = []; // Clear power-ups
    score = 0;
    foodEatenSinceLastGrowth = 0;
    foodToGrow = 5;
    scoreElement.innerText = `Score: ${score}`;
    isPointerLocked = false;

    // Reset power-up states
    speedMultiplier = 1.0;
    isSpeedBoostActive = false;
    if (speedBoostTimerId) clearTimeout(speedBoostTimerId);
    speedBoostTimerId = null;

    // Show game elements
    canvas.style.display = 'block';
    scoreElement.style.display = 'block';

    // Hide start screen
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none'; // Ensure game over screen is also hidden

    // Start game processes
    if (foodInterval) clearInterval(foodInterval);
    foodInterval = setInterval(generateFood, 1000);
    
    if (enemyInterval) clearInterval(enemyInterval);
    enemyInterval = setInterval(generateEnemy, 7000);

    if (powerUpInterval) clearInterval(powerUpInterval); // Clear existing powerUp interval
    powerUpInterval = setInterval(generatePowerUp, 15000); // Start generating power-ups

    // Request pointer lock when canvas is displayed and game starts
    // canvas.requestPointerLock(); // Moved to canvas click listener for better UX

    if (gameState !== 'playing') { 
        gameState = 'playing';
        // gameLoop is already started
    }
}

startButton.addEventListener('click', initGame);
playAgainButton.addEventListener('click', initGame);

function showGameOverScreen() {
    gameState = 'gameOver';
    finalScoreElement.innerText = `Your Score: ${score}`;
    
    canvas.style.display = 'none';
    scoreElement.style.display = 'none';
    gameOverScreen.style.display = 'flex';
    
    clearInterval(foodInterval);
    clearInterval(enemyInterval);
    clearInterval(powerUpInterval); // Stop power-up generation

    if (speedBoostTimerId) clearTimeout(speedBoostTimerId); // Clear active speed boost timer
    speedMultiplier = 1.0; // Reset speed multiplier
    isSpeedBoostActive = false; // Reset speed boost active state
    speedBoostTimerId = null;

    if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
    }
    isPointerLocked = false;
}

// Generate Power-Up
function generatePowerUp() {
    if (Math.random() < 0.1) { // Adjust probability as needed (e.g., 10% chance per interval)
        const powerUpSize = 25;
        powerUps.push({
            x: Math.random() * (canvas.width - powerUpSize),
            y: -powerUpSize, // Start off-screen at the top
            size: powerUpSize,
            type: 'speedBoost',
            dx: 0,
            dy: 0.5 + Math.random() * 0.5 // Drifts downwards slowly
        });
    }
}

// Generate random sardines (🐟) spawning outside the screen
function generateFood() {
    const spawnSide = Math.floor(Math.random() * 4); // 0 = top, 1 = right, 2 = bottom, 3 = left
    let x, y, dx, dy;

    switch (spawnSide) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -30;
            dx = (Math.random() - 0.5) * 2;
            dy = 1 + Math.random(); // Moves down
            break;
        case 1: // Right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            dx = -(1 + Math.random()); // Moves left
            dy = (Math.random() - 0.5) * 2;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            dx = (Math.random() - 0.5) * 2;
            dy = -(1 + Math.random()); // Moves up
            break;
        case 3: // Left
            x = -30;
            y = Math.random() * canvas.height;
            dx = 1 + Math.random(); // Moves right
            dy = (Math.random() - 0.5) * 2;
            break;
    }

    const sardine = {
        x,
        y,
        size: 20,
        dx,
        dy,
        lastDirectionChange: Date.now() // Track when the sardine was spawned
    };

    food.push(sardine);

    // Schedule random direction changes after 5 seconds
    setTimeout(() => scheduleDirectionChanges(sardine), 5000);
}

// Generate Enemy Fish
function generateEnemy() {
    const spawnSide = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const enemySize = 60; // Fixed size for initial enemies

    switch (spawnSide) {
        case 0: x = Math.random() * canvas.width; y = -enemySize; dx = (Math.random() - 0.5) * 1.5; dy = 0.5 + Math.random() * 0.5; break;
        case 1: x = canvas.width + enemySize; y = Math.random() * canvas.height; dx = -(0.5 + Math.random() * 0.5); dy = (Math.random() - 0.5) * 1.5; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + enemySize; dx = (Math.random() - 0.5) * 1.5; dy = -(0.5 + Math.random() * 0.5); break;
        case 3: x = -enemySize; y = Math.random() * canvas.height; dx = 0.5 + Math.random() * 0.5; dy = (Math.random() - 0.5) * 1.5; break;
    }

    enemies.push({ x, y, size: enemySize, dx, dy, lastDirectionChange: Date.now() });
    // Enemies can also have scheduledDirectionChanges if desired, for now, they move more predictably
}


// Change direction randomly (can be used for enemies too if more complex movement is desired)
function scheduleDirectionChanges(entity) { // Made generic for food or enemy
    setInterval(() => {
        if (Date.now() - entity.lastDirectionChange >= 5000) {
            entity.dx = (Math.random() - 0.5) * 2; 
            entity.dy = (Math.random() - 0.5) * 2; 
            entity.lastDirectionChange = Date.now(); 
        }
    }, Math.random() * 2000 + 1000); 
}

// Draw the player fish
function drawFish() {
    // No mirroring for player fish for now
    ctx.drawImage(playerImage, fish.x - fish.size / 2, fish.y - fish.size / 2, fish.size, fish.size);
}

// Draw sardines with mirroring effect
function drawFood() {
    food.forEach(item => {
        ctx.save(); 
        // Assuming food sprite faces right by default, flip if moving left
        if (item.dx < 0) { 
            ctx.translate(item.x + item.size / 2, item.y - item.size /2); 
            ctx.scale(-1, 1); 
            ctx.translate(-(item.x + item.size / 2), -(item.y - item.size /2)); 
        }
        ctx.drawImage(foodImage, item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
        ctx.restore(); 
    });
}

// Draw Enemy Fish
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        // Assuming enemy sprite faces right by default, flip if moving left
        if (enemy.dx < 0) {
            ctx.translate(enemy.x + enemy.size / 2, enemy.y - enemy.size / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(enemy.x + enemy.size / 2), -(enemy.y - enemy.size / 2));
        }
        ctx.drawImage(enemyImage, enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
        ctx.restore();
    });
}

// Draw PowerUps
function drawPowerUps() {
    powerUps.forEach(p => {
        if (p.type === 'speedBoost') {
            ctx.drawImage(speedPowerUpImage, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
    });
}

// Update game objects
function update() {
    // Update food positions and remove if off-screen
    food.forEach((item, index) => {
        item.x += item.dx;
        item.y += item.dy;
        if (item.x < -50 || item.x > canvas.width + 50 || item.y < -50 || item.y > canvas.height + 50) {
            food.splice(index, 1);
        }
    });

    // Update enemy positions and remove if off-screen
    enemies.forEach((enemy, index) => {
        enemy.x += enemy.dx;
        enemy.y += enemy.dy;
        if (enemy.x < -enemy.size * 2 || enemy.x > canvas.width + enemy.size * 2 || enemy.y < -enemy.size * 2 || enemy.y > canvas.height + enemy.size * 2) { 
            enemies.splice(index, 1);
        }
    });

    // Update power-up positions and remove if off-screen
    powerUps.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        // Despawn if it goes below the canvas
        if (p.y > canvas.height + p.size) {
            powerUps.splice(index, 1);
        }
    });

    // Collision detection: Player with Food
    food.forEach((item, index) => {
        let dx = fish.x - item.x;
        let dy = fish.y - item.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < fish.size / 2 + item.size / 2) {
            // Create particle effect on eating food
            for (let i = 0; i < 5; i++) { // Create 5 particles
                particles.push({
                    x: item.x,
                    y: item.y,
                    size: Math.random() * 3 + 2, // Random size between 2 and 5
                    color: 'rgba(255, 255, 255, 0.8)', // White with some transparency
                    alpha: 1,
                    vx: (Math.random() - 0.5) * 2, // Random horizontal velocity
                    vy: (Math.random() * -1) - 1 // Random upward velocity
                });
            }
            food.splice(index, 1); // Remove sardine from the array
            score++;
            foodEatenSinceLastGrowth++;

            if (foodEatenSinceLastGrowth >= foodToGrow) {
                if (fish.size < maxFishSize) {
                    fish.size += growthAmount;
                    foodEatenSinceLastGrowth = 0;
                    foodToGrow = Math.floor(foodToGrow * growthFactor);
                }
            }
        }
    });

    // Collision detection: Player with Enemies
    enemies.forEach((enemy, index) => {
        if (gameState !== 'playing') return; // Don't process enemy collision if game is over
        let dx = fish.x - enemy.x;
        let dy = fish.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < fish.size / 2 + enemy.size / 2) {
            if (fish.size < enemy.size) {
                showGameOverScreen();
            } else {
                // Optional: Player eats enemy (for future enhancement)
                // enemies.splice(index, 1);
                // score += 10; // Or some other score value for enemies
            }
        }
    });

    scoreElement.innerText = `Score: ${score}`; 

    // Remove temporary game over trigger based on score
    // if (score >= 5) { 
    //     showGameOverScreen();
    // }

    // Collision detection: Player with PowerUps
    powerUps.forEach((p, index) => {
        let dx = fish.x - p.x;
        let dy = fish.y - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < fish.size / 2 + p.size / 2) {
            if (p.type === 'speedBoost') {
                if (isSpeedBoostActive && speedBoostTimerId) {
                    clearTimeout(speedBoostTimerId); // Clear existing timer
                }
                isSpeedBoostActive = true;
                speedMultiplier = 1.5; // Increase speed
                speedBoostTimerId = setTimeout(() => {
                    speedMultiplier = 1.0; // Reset speed
                    isSpeedBoostActive = false;
                    speedBoostTimerId = null;
                }, 7000); // Power-up duration: 7 seconds
            }
            powerUps.splice(index, 1); // Remove power-up
        }
    });
}

// Lock the pointer inside the canvas
canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

// Listen for pointer lock changes
document.addEventListener("pointerlockchange", () => {
    isPointerLocked = document.pointerLockElement === canvas;
});

// Move fish with relative mouse movement
document.addEventListener("mousemove", e => {
    if (isPointerLocked) {
        fish.dx = e.movementX; 
        fish.x += e.movementX * speedMultiplier; // Apply speed multiplier
        fish.y += e.movementY * speedMultiplier; // Apply speed multiplier

        // Prevent the fish from leaving the canvas
        fish.x = Math.max(fish.size / 2, Math.min(canvas.width - fish.size / 2, fish.x));
        fish.y = Math.max(fish.size / 2, Math.min(canvas.height - fish.size / 2, fish.y));
    }
});

// Game loop
function gameLoop() {
    if (gameState !== 'playing') {
        requestAnimationFrame(gameLoop); // Keep checking state but don't run game logic
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFish();
    drawFood();
    drawEnemies(); 
    drawPowerUps(); // Draw power-ups
    drawParticles(); 
    update();
    updateParticles(); // Update particles
    requestAnimationFrame(gameLoop);
}

// Particle drawing function
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1; // Reset global alpha
}

// Particle update function
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02; // Fade out

        if (p.alpha <= 0) {
            particles.splice(i, 1); // Remove faded particles
        }
    }
}

// Initial call to start the game loop (which will manage itself based on gameState)
gameLoop();