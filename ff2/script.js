const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let fish = { x: canvas.width / 2, y: canvas.height / 2, size: 40 }; // Player is 🐠
let food = [];
let score = 0;

// Track mouse movement
let isPointerLocked = false;

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

// Change sardine's direction randomly
function scheduleDirectionChanges(sardine) {
    setInterval(() => {
        if (Date.now() - sardine.lastDirectionChange >= 5000) {
            sardine.dx = (Math.random() - 0.5) * 2; // Random horizontal direction
            sardine.dy = (Math.random() - 0.5) * 2; // Random vertical direction
            sardine.lastDirectionChange = Date.now(); // Update the last change time
        }
    }, Math.random() * 2000 + 1000); // Change every 1-3 seconds after the initial 5 seconds
}

// Draw the player fish (🐠)
function drawFish() {
    ctx.font = `${fish.size}px Arial`;
    ctx.fillText("🐠", fish.x - fish.size / 2, fish.y + fish.size / 3);
}

// Draw sardines (🐟) with mirroring effect
function drawFood() {
    ctx.font = "20px Arial";
    food.forEach(item => {
        ctx.save(); // Save the current canvas state

        // Apply mirroring effect if moving right
        if (item.dx > 0) {
            ctx.translate(item.x + item.size / 2, item.y - item.size / 2);
            ctx.scale(-1, 1); // Flip horizontally
            ctx.translate(-(item.x + item.size / 2), -(item.y - item.size / 2));
        }

        ctx.fillText("🐟", item.x - item.size / 2, item.y + item.size / 2);

        ctx.restore(); // Restore the canvas state
    });
}

// Update positions of sardines
function update() {
    food.forEach((item, index) => {
        item.x += item.dx;
        item.y += item.dy;

        // Remove sardines that leave the screen
        if (
            item.x < -50 || // Left
            item.x > canvas.width + 50 || // Right
            item.y < -50 || // Top
            item.y > canvas.height + 50 // Bottom
        ) {
            food.splice(index, 1); // Remove sardine from the array
        }
    });

    // Collision detection
    food.forEach((item, index) => {
        let dx = fish.x - item.x;
        let dy = fish.y - item.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < fish.size / 2 + item.size / 2) {
            food.splice(index, 1); // Remove sardine from the array
            score++;
        }
    });

    document.getElementById("score").innerText = `Score: ${score}`;
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
        fish.x += e.movementX;
        fish.y += e.movementY;

        // Prevent the fish from leaving the canvas
        fish.x = Math.max(fish.size / 2, Math.min(canvas.width - fish.size / 2, fish.x));
        fish.y = Math.max(fish.size / 2, Math.min(canvas.height - fish.size / 2, fish.y));
    }
});

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFish();
    drawFood();
    update();
    requestAnimationFrame(gameLoop);
}

// Start game
setInterval(generateFood, 1000); // Generate a new sardine every second
gameLoop();