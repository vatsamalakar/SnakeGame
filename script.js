const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const grid = 25;
const size = canvas.width / grid;

const menu = document.getElementById("menu");
const restartButton = document.getElementById("restart");
const menuTitle = document.getElementById("menu-title");
const menuMessage = document.getElementById("menu-message");
const startButton = document.getElementById("start-button");
const dialog = document.getElementById("instructions-dialog");

let snake;
let dir;
let food;
let obstacles;
let score;
let level;
let speed;
let interval;
let state = "menu";
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;

document.getElementById("high").textContent = highScore;
drawIdleBoard();

// Reset every value before a new round.
function startGame() {
  clearInterval(interval);
  menu.classList.add("is-hidden");
  restartButton.style.display = "none";

  snake = [{ x: 10, y: 10 }];
  dir = { x: 1, y: 0 };
  obstacles = [];
  score = 0;
  level = 1;
  speed = 150;
  state = "play";
  food = spawn();

  updateHUD();
  draw();
  interval = setInterval(update, speed);
}

// Show the latest score values on screen.
function updateHUD() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("high").textContent = highScore;
}

// Stop the snake from turning backward.
function setDirection(next) {
  const isOpposite = next.x === -dir.x && next.y === -dir.y;

  if (state !== "play" || isOpposite) {
    return;
  }

  dir = next;
}

// Read arrow keys while the game is open.
document.addEventListener("keydown", (event) => {
  const moves = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (moves[key]) {
    event.preventDefault();
    setDirection(moves[key]);
  }
});

let startX;
let startY;

// Save where a finger first touches board.
canvas.addEventListener("touchstart", (event) => {
  startX = event.touches[0].clientX;
  startY = event.touches[0].clientY;
}, { passive: true });

// Turn the snake after a clear swipe.
canvas.addEventListener("touchend", (event) => {
  const dx = event.changedTouches[0].clientX - startX;
  const dy = event.changedTouches[0].clientY - startY;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
    return;
  }

  const next = Math.abs(dx) > Math.abs(dy)
    ? { x: Math.sign(dx), y: 0 }
    : { x: 0, y: Math.sign(dy) };

  setDirection(next);
}, { passive: true });

// Connect each phone button to one direction.
document.querySelectorAll("[data-direction]").forEach((button) => {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  button.addEventListener("click", () => {
    setDirection(directions[button.dataset.direction]);
  });
});

// Move snake one square and check collisions.
function update() {
  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y,
  };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= grid || head.y >= grid;
  const hitSnake = snake.some((part) => part.x === head.x && part.y === head.y);
  const hitObstacle = obstacles.some((item) => item.x === head.x && item.y === head.y);

  if (hitWall || hitSnake || hitObstacle) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
    }

    // Raise the challenge after every three points.
    if (score % 3 === 0) {
      level++;
      speed = Math.max(65, speed - 10);
      obstacles.push(spawn());
      clearInterval(interval);
      interval = setInterval(update, speed);
    }

    food = spawn();
    updateHUD();
  } else {
    snake.pop();
  }

  draw();
}

// Paint the blue checkerboard behind every game.
function drawBoard() {
  for (let x = 0; x < grid; x++) {
    for (let y = 0; y < grid; y++) {
      ctx.fillStyle = (x + y) % 2 ? "#173451" : "#1b3b5b";
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
}

// Draw obstacles, food, and all snake parts.
function draw() {
  drawBoard();

  obstacles.forEach((item) => {
    ctx.fillStyle = "#786487";
    ctx.fillRect(item.x * size + 3, item.y * size + 3, size - 6, size - 6);
  });

  ctx.fillStyle = "#ff6677";
  ctx.beginPath();
  ctx.arc(food.x * size + size / 2, food.y * size + size / 2, size * 0.31, 0, Math.PI * 2);
  ctx.fill();

  snake.forEach((part, index) => {
    ctx.fillStyle = index ? "#53cb82" : "#9cffb7";
    ctx.fillRect(part.x * size + 2, part.y * size + 2, size - 4, size - 4);
  });
}

// Show an empty board before the game starts.
function drawIdleBoard() {
  drawBoard();
}

// Find a square not used by game pieces.
function spawn() {
  const occupied = [...(snake || []), ...(obstacles || []), food].filter(Boolean);
  let position;

  do {
    position = {
      x: Math.floor(Math.random() * grid),
      y: Math.floor(Math.random() * grid),
    };
  } while (occupied.some((item) => item.x === position.x && item.y === position.y));

  return position;
}

// Show the final score after a collision.
function gameOver() {
  clearInterval(interval);
  state = "gameover";
  menuTitle.textContent = "Game over";
  menuMessage.textContent = score === highScore && score > 0
    ? `You scored ${score}. That is your best score!`
    : `You scored ${score}. Give it another go.`;
  startButton.innerHTML = 'Play again <span aria-hidden="true">&rarr;</span>';
  menu.classList.remove("is-hidden");
  restartButton.style.display = "inline-block";
}

function openInstructions() {
  dialog.showModal();
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
document.getElementById("instructions-button").addEventListener("click", openInstructions);
document.getElementById("menu-instructions").addEventListener("click", openInstructions);
document.getElementById("close-instructions").addEventListener("click", () => dialog.close());
document.getElementById("got-it").addEventListener("click", () => dialog.close());
