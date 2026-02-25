// ============================================================
//  COLORS shared between canvas effects
// ============================================================

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
  '#fdcb6e', '#6c5ce7', '#00b894', '#e17055'
];

// ============================================================
//  PARTICLES BACKGROUND (floating dots)
// ============================================================

const PARTICLE_COUNT = 50;

function erstellePartikel() {
  const particle = document.createElement('div');
  particle.style.position = 'absolute';
  const size = Math.random() * 3 + 'px';
  particle.style.width = size;
  particle.style.height = size;
  particle.style.background = 'var(--accent-primary)';
  particle.style.borderRadius = '50%';
  particle.style.left = Math.random() * 100 + '%';
  particle.style.top = Math.random() * 100 + '%';
  particle.style.animation = `float ${Math.random() * 10 + 5}s ease-in-out infinite`;
  particle.style.animationDelay = Math.random() * 5 + 's';
  return particle;
}

function initPartikel() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    container.appendChild(erstellePartikel());
  }
}

// ============================================================
//  BACKGROUND CANVAS — animated grid squares
// ============================================================

const GRID_SIZE = 20;
const SQUARE_SIZE = 15;
const TRAIL_INTERVAL = 80;

// Trail-Quadrat Klasse
class TrailSquare {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 15 + 10;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.opacity = 1;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.shrinkSpeed = Math.random() * 0.3 + 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.size -= this.shrinkSpeed;
    this.opacity -= 0.015;
    this.rotation += this.rotationSpeed;
    return this.size > 0 && this.opacity > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

// Canvas-Manager Klasse
class CanvasManager {
  constructor(bgCanvas, trailCanvas) {
    this.bgCanvas = bgCanvas;
    this.trailCanvas = trailCanvas;
    this.bgCtx = bgCanvas.getContext('2d');
    this.trailCtx = trailCanvas.getContext('2d');

    this.gridCells = [];
    this.trailSquares = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.lastTrailTime = 0;
    this.lastTime = performance.now();

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.initGrid();
    this.setupEventListeners();
    this.startActivation();
    this.animate(performance.now());
  }

  resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.bgCanvas.width = w;
    this.bgCanvas.height = h;
    this.trailCanvas.width = w;
    this.trailCanvas.height = h;
  }

  initGrid() {
    const cols = Math.ceil(this.bgCanvas.width / GRID_SIZE);
    const rows = Math.ceil(this.bgCanvas.height / GRID_SIZE);
    this.gridCells = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.gridCells.push({
          col, row,
          x: col * GRID_SIZE + GRID_SIZE / 2,
          y: row * GRID_SIZE + GRID_SIZE / 2,
          active: false,
          opacity: 0,
          color: null,
          fadeIn: false,
          life: 0,
          maxLife: 0
        });
      }
    }
  }

  activateRandomCell() {
    const inactiveCells = this.gridCells.filter(cell => !cell.active);
    if (inactiveCells.length > 0) {
      const cell = inactiveCells[Math.floor(Math.random() * inactiveCells.length)];
      cell.active = true;
      cell.opacity = 0;
      cell.fadeIn = true;
      cell.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      cell.life = 0;
      cell.maxLife = Math.random() * 2000 + 1500;
    }
  }

  updateGridCells(deltaTime) {
    this.gridCells.forEach(cell => {
      if (!cell.active) return;
      cell.life += deltaTime;

      if (cell.fadeIn && cell.opacity < 0.7) {
        cell.opacity += 0.02;
        if (cell.opacity >= 0.7) cell.fadeIn = false;
      } else if (!cell.fadeIn) {
        cell.opacity -= 0.01;
      }

      if (cell.opacity <= 0 || cell.life >= cell.maxLife) {
        cell.active = false;
        cell.opacity = 0;
      }
    });
  }

  drawGridCells() {
    this.gridCells.forEach(cell => {
      if (!cell.active || cell.opacity <= 0) return;
      this.bgCtx.globalAlpha = cell.opacity;
      this.bgCtx.fillStyle = cell.color;
      this.bgCtx.fillRect(
        cell.x - SQUARE_SIZE / 2,
        cell.y - SQUARE_SIZE / 2,
        SQUARE_SIZE,
        SQUARE_SIZE
      );
    });
    this.bgCtx.globalAlpha = 1;
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.initGrid();
    });
  }

  startActivation() {
    setInterval(() => {
      const numToActivate = Math.random() > 0.5 ? 2 : 1;
      for (let i = 0; i < numToActivate; i++) {
        this.activateRandomCell();
      }
    }, 100);
  }

  animate(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

    this.updateGridCells(deltaTime);
    this.drawGridCells();

    if (currentTime - this.lastTrailTime > TRAIL_INTERVAL) {
      this.trailSquares.push(new TrailSquare(this.mouseX, this.mouseY));
      this.lastTrailTime = currentTime;
    }

    for (let i = this.trailSquares.length - 1; i >= 0; i--) {
      const square = this.trailSquares[i];
      if (!square.update()) {
        this.trailSquares.splice(i, 1);
      } else {
        square.draw(this.trailCtx);
      }
    }

    requestAnimationFrame((time) => this.animate(time));
  }
}

function initHintergrundCanvas() {
  const bgCanvas = document.getElementById('backgroundCanvas');
  const trailCanvas = document.getElementById('trailCanvas');

  if (!bgCanvas || !trailCanvas) {
    console.warn('Canvas-Elemente nicht gefunden');
    return;
  }

  new CanvasManager(bgCanvas, trailCanvas);
}

// ============================================================
//  INIT
// ============================================================

initPartikel();
initHintergrundCanvas();