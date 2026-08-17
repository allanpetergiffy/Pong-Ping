// Enhanced Pong Game with Superpowers and Advanced Features
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreboardLeft = document.getElementById('leftScore');
const scoreboardRight = document.getElementById('rightScore');
const levelDisplay = document.getElementById('levelDisplay');
const chargeBar = document.getElementById('chargeFill');
const chargeLabel = document.getElementById('chargeLabel');
const unlocksDisplay = document.getElementById('unlocks');
const comboDisplay = document.getElementById('combo');
const effectsDisplay = document.getElementById('effects');

const W = canvas.width;
const H = canvas.height;

// Paddle config
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PLAYER_SPEED = 6;
const SHIELD_RADIUS = 30;

// Ball config
const BALL_RADIUS = 9;
const BALL_START_SPEED = 5;
const BALL_SPEED_INCREMENT = 0.2;
const MAX_BALL_SPEED = 14;

// Game state
let leftScore = 0;
let rightScore = 0;
let level = 1;
let combo = 0;
let superCharge = 0;
const MAX_SUPER_CHARGE = 100;
let paused = false;
let playerUsingMouse = false;
let gameOver = false;

// Unlocked powers
let unlockedPowers = new Set(['shield']);

// Keyboard state
const keys = {
  ArrowUp: false,
  ArrowDown: false
};

// Paddles
const leftPaddle = {
  x: 20,
  y: (H - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  vy: 0,
  hasShield: false,
  shieldActive: false
};

const rightPaddle = {
  x: W - 20 - PADDLE_WIDTH,
  y: (H - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  vy: 0,
  hasShield: false,
  shieldActive: false
};

// Balls array (for multi-ball power-up)
let balls = [];
let powerUps = [];
let particles = [];
let projectiles = [];

// Ball constructor
function createBall(x, y, vx, vy, special = false) {
  return {
    x: x,
    y: y,
    r: special ? 6 : BALL_RADIUS,
    vx: vx,
    vy: vy,
    speed: Math.sqrt(vx * vx + vy * vy),
    isFire: false,
    bounces: 0,
    isSticky: false,
    originalSpeed: Math.sqrt(vx * vx + vy * vy)
  };
}

// Initialize with one ball
balls.push(createBall(W / 2, H / 2, BALL_START_SPEED, 0));

// Power-up types
const POWER_UP_TYPES = {
  FIRE: { name: 'fire', color: '#ef4444', icon: '🔥' },
  MULTI: { name: 'multi', color: '#f97316', icon: '⚡' },
  SHRINK: { name: 'shrink', color: '#06b6d4', icon: '📉' },
  TELEPORT: { name: 'teleport', color: '#a855f7', icon: '✨' },
  STICKY: { name: 'sticky', color: '#eab308', icon: '🍯' },
  REVERSE: { name: 'reverse', color: '#ec4899', icon: '🔄' },
  SLOW: { name: 'slow', color: '#3b82f6', icon: '🐌' }
};

const POWER_UP_COLORS = {
  'fire': '#ef4444',
  'multi': '#f97316',
  'shrink': '#06b6d4',
  'teleport': '#a855f7',
  'sticky': '#eab308',
  'reverse': '#ec4899',
  'slow': '#3b82f6'
};

let lastTime = 0;
let slowMoEffect = 0;

// CPU speed based on level
function getCPUSpeed() {
  return Math.min(4.2 + (level - 1) * 0.5, 8);
}

// Clamp helper
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Random in range
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Launch ball
function launchBall(direction = 1) {
  const angle = random(-Math.PI / 3, Math.PI / 3);
  const speed = BALL_START_SPEED + (level - 1) * 0.3;
  balls = [createBall(
    W / 2,
    H / 2,
    direction * speed * Math.cos(angle),
    speed * Math.sin(angle)
  )];
}

// Score point
function scorePoint(scoringSide) {
  if (scoringSide === 1) {
    rightScore++;
    combo = 0;
  } else {
    leftScore++;
    combo = 0;
  }
  
  scoreboardLeft.textContent = leftScore;
  scoreboardRight.textContent = rightScore;

  paused = true;
  setTimeout(() => {
    launchBall(scoringSide === 1 ? -1 : 1);
    paused = false;
  }, 700);
}

// Create power-up
function createPowerUp(x, y) {
  const types = Object.values(POWER_UP_TYPES);
  const randomType = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x: x,
    y: y,
    radius: 12,
    type: randomType.name,
    vx: random(-1.5, 1.5),
    vy: random(-1.5, 0.5),
    life: 8000 // 8 seconds
  });
}

// Spawn particles
function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      life: 600,
      color: color,
      size: random(2, 5)
    });
  }
}

// Activate power-up effect
function activatePowerUp(powerUp, isPlayer) {
  const paddle = isPlayer ? leftPaddle : rightPaddle;
  
  switch(powerUp.type) {
    case 'fire':
      balls.forEach(ball => ball.isFire = true);
      spawnParticles(paddle.x, paddle.y + paddle.height / 2, '#ef4444');
      break;
    case 'multi':
      const newBalls = [];
      balls.forEach(ball => {
        newBalls.push({
          ...ball,
          x: ball.x + random(-20, 20),
          y: ball.y + random(-20, 20)
        });
        newBalls.push({
          ...ball,
          x: ball.x + random(-20, 20),
          y: ball.y + random(-20, 20),
          vx: ball.vx * 0.8 + random(-1, 1),
          vy: ball.vy * 0.8 + random(-1, 1)
        });
      });
      balls = [...balls, ...newBalls];
      spawnParticles(paddle.x, paddle.y + paddle.height / 2, '#f97316', 12);
      break;
    case 'shrink':
      balls.forEach(ball => ball.r = Math.max(4, ball.r - 3));
      spawnParticles(paddle.x, paddle.y + paddle.height / 2, '#06b6d4');
      break;
    case 'sticky':
      balls.forEach(ball => ball.isSticky = true);
      spawnParticles(paddle.x, paddle.y + paddle.height / 2, '#eab308');
      break;
    case 'reverse':
      balls.forEach(ball => {
        ball.vx = -ball.vx;
        ball.vy = -ball.vy;
      });
      spawnParticles(paddle.x, paddle.y + paddle.height / 2, '#ec4899', 10);
      break;
    case 'slow':
      slowMoEffect = 3000; // 3 seconds
      spawnParticles(paddle.x, paddle.y + paddle.height / 2, '#3b82f6', 10);
      break;
  }
  
  unlockedPowers.add(powerUp.type);
}

// Check paddle collision
function checkPaddleCollision(paddle, ball) {
  const nearestX = clamp(ball.x, paddle.x, paddle.x + paddle.width);
  const nearestY = clamp(ball.y, paddle.y, paddle.y + paddle.height);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return (dx * dx + dy * dy) <= (ball.r * ball.r);
}

// Check power-up collision
function checkPowerUpCollision(paddle) {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const pu = powerUps[i];
    const dx = paddle.x + paddle.width / 2 - pu.x;
    const dy = paddle.y + paddle.height / 2 - pu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < paddle.width + pu.radius) {
      activatePowerUp(pu, paddle === leftPaddle);
      powerUps.splice(i, 1);
      combo++;
      superCharge = Math.min(superCharge + 15, MAX_SUPER_CHARGE);
      addEffect(`+${pu.type}`, paddle.x, paddle.y);
    }
  }
}

// Add effect text
function addEffect(text, x, y) {
  effectsDisplay.innerHTML += `<div class="effect-text" style="left:${x}px; top:${y}px">${text}</div>`;
  setTimeout(() => {
    const first = effectsDisplay.querySelector('.effect-text');
    if (first) first.remove();
  }, 1000);
}

// Ball wall collision
function handleBallWallCollision(ball) {
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.r >= H) {
    ball.y = H - ball.r;
    ball.vy = -ball.vy;
  }
}

// Ball paddle collision
function handleBallPaddleCollision(ball, paddle, isLeftPaddle) {
  if (!checkPaddleCollision(paddle, ball)) return;
  
  const shouldBounce = isLeftPaddle ? ball.vx < 0 : ball.vx > 0;
  if (!shouldBounce) return;
  
  // Position ball outside paddle
  if (isLeftPaddle) {
    ball.x = paddle.x + paddle.width + ball.r;
    ball.vx = Math.abs(ball.vx);
  } else {
    ball.x = paddle.x - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  
  // Angle based on hit position
  const relativeIntersectY = (paddle.y + paddle.height / 2) - ball.y;
  const normalized = relativeIntersectY / (paddle.height / 2);
  const bounceAngle = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, normalized * (Math.PI / 3)));
  
  const newSpeed = Math.min(ball.speed + BALL_SPEED_INCREMENT, MAX_BALL_SPEED + level);
  ball.speed = newSpeed;
  
  if (isLeftPaddle) {
    ball.vx = ball.speed * Math.cos(bounceAngle);
  } else {
    ball.vx = -ball.speed * Math.cos(bounceAngle);
  }
  ball.vy = -ball.speed * Math.sin(bounceAngle);
  
  ball.bounces++;
  combo++;
  superCharge = Math.min(superCharge + 5, MAX_SUPER_CHARGE);
  
  if (ball.bounces % 5 === 0) {
    createPowerUp(paddle.x, paddle.y + paddle.height / 2);
  }
}

// Shield collision check
function checkShieldCollision(paddle, ball) {
  if (!paddle.shieldActive) return false;
  
  const shieldX = paddle.x + (paddle === leftPaddle ? paddle.width : 0);
  const shieldY = paddle.y + paddle.height / 2;
  
  const dx = ball.x - shieldX;
  const dy = ball.y - shieldY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < SHIELD_RADIUS + ball.r) {
    // Reflect ball away
    const angle = Math.atan2(dy, dx);
    ball.vx = Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
    spawnParticles(ball.x, ball.y, '#fbbf24', 6);
    return true;
  }
  return false;
}

// Update game
function update(dt) {
  if (paused) return;
  
  // Apply slow-mo
  if (slowMoEffect > 0) {
    dt *= 0.3;
    slowMoEffect -= 16;
  }
  
  // Player movement
  if (keys.ArrowUp) {
    leftPaddle.y -= PLAYER_SPEED;
  }
  if (keys.ArrowDown) {
    leftPaddle.y += PLAYER_SPEED;
  }
  leftPaddle.y = clamp(leftPaddle.y, 0, H - leftPaddle.height);
  
  // CPU AI with predictive movement
  const cpuCenter = rightPaddle.y + rightPaddle.height / 2;
  let targetY = cpuCenter;
  
  // Find nearest ball and track it with prediction
  let nearestBall = balls[0];
  let minDist = Infinity;
  balls.forEach(ball => {
    if (Math.abs(ball.x - W/2) < minDist) {
      minDist = Math.abs(ball.x - W/2);
      nearestBall = ball;
    }
  });
  
  if (nearestBall) {
    // Predict ball position
    let predictedY = nearestBall.y;
    if (nearestBall.vx > 0) {
      const timeToReach = (W - 100 - nearestBall.x) / nearestBall.vx;
      predictedY = nearestBall.y + nearestBall.vy * timeToReach;
    }
    
    targetY = clamp(predictedY, 0, H);
  }
  
  const cpuSpeed = getCPUSpeed();
  const diff = targetY - cpuCenter;
  if (Math.abs(diff) > 8) {
    rightPaddle.y += Math.sign(diff) * cpuSpeed;
  }
  rightPaddle.y = clamp(rightPaddle.y, 0, H - rightPaddle.height);
  
  // Update balls
  const ballsToRemove = [];
  balls.forEach((ball, idx) => {
    ball.x += ball.vx * (slowMoEffect > 0 ? 0.3 : 1);
    ball.y += ball.vy * (slowMoEffect > 0 ? 0.3 : 1);
    
    handleBallWallCollision(ball);
    
    // Check shields first
    if (!checkShieldCollision(leftPaddle, ball)) {
      handleBallPaddleCollision(ball, leftPaddle, true);
    }
    if (!checkShieldCollision(rightPaddle, ball)) {
      handleBallPaddleCollision(ball, rightPaddle, false);
    }
    
    // Scoring
    if (ball.x + ball.r < 0) {
      rightScore++;
      scoreboardRight.textContent = rightScore;
      ballsToRemove.push(idx);
    } else if (ball.x - ball.r > W) {
      leftScore++;
      scoreboardLeft.textContent = leftScore;
      ballsToRemove.push(idx);
    }
  });
  
  // Remove scored balls
  ballsToRemove.reverse().forEach(idx => balls.splice(idx, 1));
  if (balls.length === 0) {
    launchBall();
  }
  
  // Update power-ups
  powerUps.forEach(pu => {
    pu.x += pu.vx;
    pu.y += pu.vy;
    pu.vy += 0.15; // gravity
    pu.life -= dt;
    
    // Clamp to canvas
    if (pu.x - pu.radius < 0 || pu.x + pu.radius > W) pu.vx *= -0.8;
    if (pu.y - pu.radius < 0) pu.vy *= -0.8;
    if (pu.y + pu.radius > H) pu.y = H - pu.radius;
  });
  
  powerUps = powerUps.filter(pu => pu.life > 0);
  
  // Update particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;
  });
  particles = particles.filter(p => p.life > 0);
  
  // Check power-up collection
  checkPowerUpCollision(leftPaddle);
  checkPowerUpCollision(rightPaddle);
  
  // Level up logic
  const totalScore = leftScore + rightScore;
  const newLevel = Math.floor(totalScore / 5) + 1;
  if (newLevel > level) {
    level = newLevel;
    rightPaddle.hasShield = true;
    rightPaddle.shieldActive = true;
    createPowerUp(W / 2, H / 2);
  }
  
  levelDisplay.textContent = `Level: ${level}`;
  comboDisplay.textContent = `Combo: ${combo}`;
}

// Draw shield
function drawShield(paddle) {
  if (!paddle.shieldActive) return;
  
  const shieldX = paddle.x + (paddle === leftPaddle ? paddle.width : 0);
  const shieldY = paddle.y + paddle.height / 2;
  
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(shieldX, shieldY, SHIELD_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Draw ball
function drawBall(ball) {
  if (ball.isFire) {
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
  } else {
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
  }
  
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Draw
function draw() {
  // Clear
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, W, H);
  
  // Middle dashed line
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const dashH = 16;
  const gap = 12;
  for (let y = 10; y < H; y += dashH + gap) {
    ctx.fillRect(W / 2 - 2, y, 4, dashH);
  }
  
  // Draw power-ups
  powerUps.forEach(pu => {
    ctx.fillStyle = POWER_UP_COLORS[pu.type];
    ctx.globalAlpha = Math.max(0, pu.life / 2000);
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw icon
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWER_UP_TYPES[Object.keys(POWER_UP_TYPES).find(k => POWER_UP_TYPES[k].name === pu.type)].icon, pu.x, pu.y);
    ctx.globalAlpha = 1;
  });
  
  // Draw particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / 600);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  // Paddles
  ctx.fillStyle = '#e6eef6';
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
  
  // Draw shields
  drawShield(leftPaddle);
  drawShield(rightPaddle);
  
  // Balls
  balls.forEach(ball => drawBall(ball));
  
  // Paused text
  if (paused) {
    ctx.fillStyle = 'rgba(230,238,246,0.9)';
    ctx.font = '20px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Paused', W / 2, 40);
  }
  
  // Slow-mo indicator
  if (slowMoEffect > 0) {
    ctx.fillStyle = 'rgba(59,130,246,0.3)';
    ctx.fillRect(0, 0, W, H);
  }
}

// Main loop
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 16.6667;
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

canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const touchY = e.touches[0].clientY - rect.top;
  leftPaddle.y = clamp(touchY - leftPaddle.height / 2, 0, H - leftPaddle.height);
  e.preventDefault();
});

// Handle Super activation
function activateSuper() {
  if (superCharge < MAX_SUPER_CHARGE) return;
  
  superCharge = 0;
  leftPaddle.shieldActive = true;
  setTimeout(() => {
    leftPaddle.shieldActive = false;
  }, 3000);
  
  spawnParticles(leftPaddle.x, leftPaddle.y + leftPaddle.height / 2, '#fbbf24', 15);
}

document.getElementById('btnActivateSuper').addEventListener('click', activateSuper);

// Keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    paused = !paused;
    e.preventDefault();
  }
  if (e.key === 'x' || e.key === 'X') {
    activateSuper();
    e.preventDefault();
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = false;
    e.preventDefault();
  }
});

// Pause button
document.getElementById('btnPause').addEventListener('click', () => {
  paused = !paused;
});

// Restart button
document.getElementById('btnRestart').addEventListener('click', () => {
  leftScore = 0;
  rightScore = 0;
  level = 1;
  combo = 0;
  superCharge = 0;
  balls = [];
  powerUps = [];
  particles = [];
  launchBall();
  scoreboardLeft.textContent = '0';
  scoreboardRight.textContent = '0';
  levelDisplay.textContent = 'Level: 1';
  paused = false;
});

// Update UI
function updateUI() {
  chargeBar.style.width = (superCharge / MAX_SUPER_CHARGE * 100) + '%';
  chargeLabel.textContent = `Charge: ${Math.floor(superCharge)}%`;
  
  const powersArray = Array.from(unlockedPowers).join(', ');
  unlocksDisplay.textContent = `Unlocked: ${powersArray}`;
}

setInterval(updateUI, 100);

// Start game
launchBall();
scoreboardLeft.textContent = leftScore;
scoreboardRight.textContent = rightScore;
requestAnimationFrame(loop);
