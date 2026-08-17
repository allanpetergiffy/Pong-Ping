// Simple Pong game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreboardLeft = document.getElementById('leftScore');
const scoreboardRight = document.getElementById('rightScore');

const W = canvas.width;
const H = canvas.height;

// Paddle config
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PLAYER_SPEED = 6;
const CPU_SPEED = 4.2;

// Ball config
const BALL_RADIUS = 9;
const BALL_START_SPEED = 5;
const BALL_SPEED_INCREMENT = 0.2;
const MAX_BALL_SPEED = 14;

let leftScore = 0;
let rightScore = 0;

const leftPaddle = {
  x: 20,
  y: (H - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  vy: 0
};

const rightPaddle = {
  x: W - 20 - PADDLE_WIDTH,
  y: (H - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  vy: 0
};

const ball = {
  x: W / 2,
  y: H / 2,
  r: BALL_RADIUS,
  vx: BALL_START_SPEED,
  vy: 0,
  speed: BALL_START_SPEED
};

let lastTime = 0;
let paused = false;
let playerUsingMouse = false;

// Keyboard state
const keys = {
  ArrowUp: false,
  ArrowDown: false
};

// Launch ball in a random vertical direction; direction param: 1 means right, -1 means left
function launchBall(direction = (Math.random() < 0.5 ? -1 : 1)) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = BALL_START_SPEED;
  ball.vx = direction * ball.speed;
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // -30 to +30 degrees
  ball.vy = ball.speed * Math.sin(angle);
}

// Clamp helper
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Reset and give point to side (1 = right scored, -1 = left scored)
function scorePoint(scoringSide) {
  if (scoringSide === 1) rightScore++;
  else leftScore++;
  scoreboardLeft.textContent = leftScore;
  scoreboardRight.textContent = rightScore;

  // Brief pause then restart towards the side that was scored on (so the other player receives)
  paused = true;
  setTimeout(() => {
    launchBall(scoringSide === 1 ? -1 : 1);
    paused = false;
  }, 700);
}

// Collision detection between ball and a paddle (rectangle)
function checkPaddleCollision(paddle) {
  // Find nearest point on rectangle to circle center
  const nearestX = clamp(ball.x, paddle.x, paddle.x + paddle.width);
  const nearestY = clamp(ball.y, paddle.y, paddle.y + paddle.height);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return (dx * dx + dy * dy) <= (ball.r * ball.r);
}

// Game update
function update(dt) {
  if (paused) return;

  // Player keyboard movement
  if (keys.ArrowUp) {
    leftPaddle.y -= PLAYER_SPEED;
  }
  if (keys.ArrowDown) {
    leftPaddle.y += PLAYER_SPEED;
  }

  // Keep paddles on screen
  leftPaddle.y = clamp(leftPaddle.y, 0, H - leftPaddle.height);

  // Simple CPU AI: follow the ball with a maximum speed
  const cpuCenter = rightPaddle.y + rightPaddle.height / 2;
  if (ball.y < cpuCenter - 6) {
    rightPaddle.y -= CPU_SPEED;
  } else if (ball.y > cpuCenter + 6) {
    rightPaddle.y += CPU_SPEED;
  }
  rightPaddle.y = clamp(rightPaddle.y, 0, H - rightPaddle.height);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collision (top/bottom)
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.r >= H) {
    ball.y = H - ball.r;
    ball.vy = -ball.vy;
  }

  // Paddle collisions
  if (ball.vx < 0 && checkPaddleCollision(leftPaddle)) {
    // Hit left paddle
    ball.x = leftPaddle.x + leftPaddle.width + ball.r; // push out
    ball.vx = Math.abs(ball.vx); // ensure to the right

    // Add angle depending on where it hits the paddle
    const relativeIntersectY = (leftPaddle.y + leftPaddle.height / 2) - ball.y;
    const normalized = relativeIntersectY / (leftPaddle.height / 2);
    const bounceAngle = normalized * (Math.PI / 3); // up to 60 degrees
    const newSpeed = Math.min(ball.speed + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
    ball.speed = newSpeed;
    ball.vx = ball.speed * Math.cos(bounceAngle);
    ball.vy = -ball.speed * Math.sin(bounceAngle);
  } else if (ball.vx > 0 && checkPaddleCollision(rightPaddle)) {
    // Hit right paddle
    ball.x = rightPaddle.x - ball.r; // push out
    ball.vx = -Math.abs(ball.vx);

    const relativeIntersectY = (rightPaddle.y + rightPaddle.height / 2) - ball.y;
    const normalized = relativeIntersectY / (rightPaddle.height / 2);
    const bounceAngle = normalized * (Math.PI / 3);
    const newSpeed = Math.min(ball.speed + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
    ball.speed = newSpeed;
    ball.vx = -ball.speed * Math.cos(bounceAngle);
    ball.vy = -ball.speed * Math.sin(bounceAngle);
  }

  // Scoring: ball passed left or right edge
  if (ball.x + ball.r < 0) {
    scorePoint(1); // right scores
  } else if (ball.x - ball.r > W) {
    scorePoint(-1); // left scores
  }
}

// Drawing
function draw() {
  // Clear
  ctx.clearRect(0, 0, W, H);

  // Middle dashed line
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const dashH = 16;
  const gap = 12;
  for (let y = 10; y < H; y += dashH + gap) {
    ctx.fillRect(W / 2 - 2, y, 4, dashH);
  }

  // Paddles
  ctx.fillStyle = '#e6eef6';
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  // Ball
  ctx.beginPath();
  ctx.fillStyle = '#22d3ee';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Optionally show paused text
  if (paused) {
    ctx.fillStyle = 'rgba(230,238,246,0.9)';
    ctx.font = '20px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Paused', W / 2, 40);
  }
}

// Main loop
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 16.6667; // ~60fps baseline
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  leftPaddle.y = clamp(mouseY - leftPaddle.height / 2, 0, H - leftPaddle.height);
  playerUsingMouse = true;
});

canvas.addEventListener('mouseleave', () => {
  playerUsingMouse = false;
});

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar') {
    // toggle pause
    paused = !paused;
    e.preventDefault();
    return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = true;
    e.preventDefault(); // prevent scrolling
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = false;
    e.preventDefault();
  }
});

// Start
launchBall(); // start with random direction
scoreboardLeft.textContent = leftScore;
scoreboardRight.textContent = rightScore;
requestAnimationFrame(loop);
