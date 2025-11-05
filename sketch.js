/* 🌈 Bubble Pop Game — 414730175 黃詩婷
 * 點擊泡泡得分、30 秒倒數、柔和背景 + 美化 HUD
 */

let gameState = 'start';
let bubbles = [];
let particles = [];
let seaCreatures = [];
let corals = [];
let turtles = [];
let starfish = [];
let floatingJellies = [];
let burstEffects = [];
let popSound;
let score = 0;
let timeLimit = 30 * 1000; // 30 秒
let startTime = 0;
let lastSpawn = 0;
let spawnInterval = 400; // 出現更頻繁
let audioUnlocked = false;
let ambientSpecks = [];
let causticLayers = [];
const CREATURE_SPEECH_DURATION = 140;

function preload() {
  soundFormats('mp3', 'wav');
  popSound = loadSound(
    'explosion.mp3',
    () => {
      popSound.setVolume(0.75);
      popSound.playMode('restart');
    },
    err => {
      console.error('Failed to load explosion.mp3', err);
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight).parent('game-container');
  textFont('Noto Sans TC, Microsoft JhengHei, sans-serif');
  initSeaCreatures();
  initCorals();
  initTurtles();
  initStarfish();
  initFloatingJellies();
  initAmbientSpecks();
  initCausticLayers();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initSeaCreatures();
  initCorals();
  initTurtles();
  initStarfish();
  initFloatingJellies();
  initAmbientSpecks();
  initCausticLayers();
}

function draw() {
  drawBackground();
  drawCorals();
  drawStarfish();
  drawSeaCreatures();
  drawTurtles();
  drawFloatingJellies();

  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'play') {
    runGame();
  } else if (gameState === 'end') {
    drawEndScreen();
  }
}

/* ---------------- 畫面階段 ---------------- */

function drawStartScreen() {
  drawTitle('Bubble Pop Game');
  drawSub('點擊圓圈得分，30 秒倒數，看看你能拿幾分！');
  drawButton(width / 2, height * 0.62, 220, 56, '開始遊戲', startGame);
}

function startGame() {
  bubbles = [];
  particles = [];
  burstEffects = [];
  score = 0;
  startTime = millis();
  lastSpawn = millis();
  gameState = 'play';
}

function runGame() {
  if (millis() - lastSpawn >= spawnInterval) {
    spawnBubble();
    lastSpawn = millis();
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.update();
    b.draw();
    if (b.dead) bubbles.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.dead) particles.splice(i, 1);
  }

  for (let i = burstEffects.length - 1; i >= 0; i--) {
    const b = burstEffects[i];
    b.update();
    b.draw();
    if (b.dead) burstEffects.splice(i, 1);
  }

  drawHUD();

  if (millis() - startTime >= timeLimit) gameState = 'end';
}

function drawEndScreen() {
  drawTitle('時間到！');
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(30);
  text(`你的分數：${score} 分`, width / 2, height * 0.48);

  drawButton(width / 2, height * 0.62, 220, 56, '再玩一次', startGame);
  drawButton(width / 2, height * 0.72, 220, 44, '回到首頁', () => (gameState = 'start'));
}

/* ---------------- 泡泡類 ---------------- */

class Bubble {
  constructor(x, y, r, col) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;
    this.vy = random(2.2, 3.6);
    this.vx = random(-0.5, 0.5);
    this.dead = false;
    this.popped = false;
    this.fade = 255;
    this.popProgress = 0;
  }

  update() {
    if (!this.popped) {
      this.y -= this.vy;
      this.x += this.vx;
      if (this.y + this.r < -20) this.dead = true;
    } else {
      this.popProgress += 0.08;
      this.fade = max(0, 255 * (1 - this.popProgress * 1.1));
      if (this.popProgress >= 1) this.dead = true;
    }
  }

  draw() {
    push();
    translate(this.x, this.y);

    if (!this.popped) {
      const baseCol = color(this.col);
      baseCol.setAlpha(this.fade);

      // layered body for subtle gradient
      noStroke();
      const layers = 8;
      for (let i = 0; i < layers; i++) {
        const t = i / (layers - 1 || 1);
        const inner = lerpColor(color(255, 255, 255, this.fade * 0.35), baseCol, t);
        fill(inner);
        circle(0, 0, this.r * 2 * (1 - t * 0.16));
      }

      // outer sheen ring
      noFill();
      stroke(255, 255, 255, this.fade * 0.6);
      strokeWeight(max(1, this.r * 0.08));
      circle(0, 0, this.r * 2);

      // square highlights
      rectMode(CENTER);
      noStroke();
      fill(255, 255, 255, this.fade * 0.6);
      push();
      rotate(-PI / 10);
      translate(this.r * 0.32, -this.r * 0.38);
      const highlightSize = this.r * 0.36;
      rect(0, 0, highlightSize, highlightSize, highlightSize * 0.25);
      pop();

      push();
      rotate(-PI / 12);
      translate(this.r * 0.22, -this.r * 0.08);
      const tinyHighlight = this.r * 0.18;
      fill(255, 255, 255, this.fade * 0.45);
      rect(0, 0, tinyHighlight, tinyHighlight, tinyHighlight * 0.2);
      pop();
    } else {
      this.drawBurst();
    }

    pop();
  }

  drawBurst() {
    const progress = constrain(this.popProgress, 0, 1);
    const baseCol = color(this.col);
    const alpha = this.fade;
    const ringRadius = this.r * (1 + progress * 1.6);

    // inner flash
    noStroke();
    fill(red(baseCol), green(baseCol), blue(baseCol), alpha * 0.45);
    circle(0, 0, ringRadius * 1.1);
    fill(255, 255, 255, alpha * 0.6);
    circle(0, 0, this.r * (0.65 + progress * 0.4));

    // shockwave rings
    noFill();
    stroke(255, 255, 255, alpha * 0.8);
    strokeWeight(max(2, this.r * 0.1 * (1 - progress * 0.5)));
    circle(0, 0, ringRadius * 2);
    stroke(red(baseCol), green(baseCol), blue(baseCol), alpha * 0.6);
    strokeWeight(max(1.5, this.r * 0.06));
    circle(0, 0, ringRadius * 2.4);

    // burst spikes
    const spikes = 10;
    stroke(255, 255, 255, alpha * 0.85);
    strokeWeight(max(2, this.r * 0.08 * (1 - progress * 0.4)));
    for (let i = 0; i < spikes; i++) {
      const angle = (TWO_PI / spikes) * i + progress * 2.5;
      const inner = this.r * 0.2;
      const outer = ringRadius * (1.2 + sin(progress * 6 + i) * 0.06);
      line(cos(angle) * inner, sin(angle) * inner, cos(angle) * outer, sin(angle) * outer);
    }

    // small sparkles
    noStroke();
    const sparkles = 12;
    for (let i = 0; i < sparkles; i++) {
      const angle = (TWO_PI / sparkles) * i + progress * 1.5;
      const dist = ringRadius * (0.55 + 0.35 * sin(progress * 3 + i));
      const size = max(2, this.r * 0.12 * (1 - progress) + 2);
      fill(255, 255, 255, alpha * 0.7);
      circle(cos(angle) * dist, sin(angle) * dist, size);
    }
  }

  hit(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r;
  }

  pop() {
    if (this.popped) return;
    this.popped = true;
    this.popProgress = 0;
    score++;
    this.fade = 255;
    playExplosionSound();
    for (let i = 0; i < 18; i++) {
      particles.push(new Particle(this.x, this.y, this.col));
    }
    burstEffects.push(new BurstEffect(this.x, this.y, this.col, this.r));
  }
}

/* ---------------- 粒子特效 ---------------- */

class Particle {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.vx = random(-3, 3);
    this.vy = random(-3, 3);
    this.life = 40;
    this.size = random(2, 5);
    const col = color(c);
    this.c = color(red(col), green(col), blue(col), 230);
    this.dead = false;
    this.angle = random(TWO_PI);
    this.spin = random(-0.08, 0.08);
    this.shape = random() < 0.45 ? 'square' : 'circle';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.angle += this.spin;
    if (this.life <= 0) this.dead = true;
  }
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(red(this.c), green(this.c), blue(this.c), map(this.life, 0, 40, 0, alpha(this.c)));
    if (this.shape === 'square') {
      rectMode(CENTER);
      const side = this.size * 1.6;
      rect(0, 0, side, side, side * 0.3);
    } else {
      circle(0, 0, this.size * 1.4);
    }
    pop();
  }
}

class BurstEffect {
  constructor(x, y, col, baseRadius) {
    this.x = x;
    this.y = y;
    this.life = 0;
    this.maxLife = 22;
    this.baseRadius = baseRadius || 40;
    const c = color(col);
    this.innerCol = color(red(c), green(c), blue(c), 220);
    this.outerCol = color(red(c), green(c), blue(c), 120);
    this.dead = false;
    this.fragments = [];
    const fragmentCount = 8;
    for (let i = 0; i < fragmentCount; i++) {
      this.fragments.push({
        angle: random(TWO_PI),
        width: random(0.06, 0.12),
        spread: random(0.7, 1.35),
        delay: random(0, 0.18),
        rot: random(-0.5, 0.5),
      });
    }
    this.sparkles = [];
    for (let i = 0; i < 14; i++) {
      this.sparkles.push({
        angle: random(TWO_PI),
        radius: random(0.2, 1.2),
        speed: random(0.6, 1.2),
        size: random(6, 14),
        delay: random(0, 0.3),
      });
    }
  }

  update() {
    this.life++;
    if (this.life >= this.maxLife) this.dead = true;
  }

  draw() {
    push();
    translate(this.x, this.y);
    const progress = this.life / this.maxLife;
    const ease = 1 - pow(1 - progress, 3); // ease out cubic
    const radius = this.baseRadius * (1 + ease * 1.8);
    const alpha = lerp(220, 0, progress);

    blendMode(ADD);
    noStroke();
    fill(red(this.innerCol), green(this.innerCol), blue(this.innerCol), alpha * 0.4);
    circle(0, 0, radius * 1.4);

    fill(255, 255, 255, alpha * 0.15);
    circle(0, 0, radius * 0.9);

    blendMode(BLEND);
    noFill();
    stroke(red(this.innerCol), green(this.innerCol), blue(this.innerCol), alpha);
    strokeWeight(3.4);
    circle(0, 0, radius * 2);

    stroke(red(this.outerCol), green(this.outerCol), blue(this.outerCol), alpha * 0.65);
    strokeWeight(2);
    circle(0, 0, radius * 2.65);

    const shardCount = 6;
    stroke(255, 255, 255, alpha * 0.85);
    strokeWeight(2.2);
    for (let i = 0; i < shardCount; i++) {
      const angle = (TWO_PI / shardCount) * i + progress * 0.6;
      const len = radius * 0.95;
      line(
        cos(angle) * radius * 0.55,
        sin(angle) * radius * 0.55,
        cos(angle) * len,
        sin(angle) * len
      );
    }

    noStroke();
    for (const frag of this.fragments) {
      const localProgress = constrain((progress - frag.delay) / (1 - frag.delay || 1), 0, 1);
      if (localProgress <= 0) continue;
      const flare = localProgress * (1.6 - localProgress);
      const length = this.baseRadius * (0.6 + flare * 2.1 * frag.spread);
      const base = this.baseRadius * 0.28;
      const thickness = base * frag.width * (1 - localProgress * 0.6);
      push();
      rotate(frag.angle + flare * frag.rot * 0.8);
      translate(radius * 0.15 * localProgress, 0);
      fill(
        red(this.innerCol),
        green(this.innerCol),
        blue(this.innerCol),
        alpha * (0.45 + 0.55 * (1 - localProgress))
      );
      beginShape();
      vertex(base * 0.1, -thickness);
      vertex(length, 0);
      vertex(base * 0.1, thickness);
      endShape(CLOSE);
      fill(255, 255, 255, alpha * 0.5);
      ellipse(length * 0.94, 0, thickness * 0.85, thickness * 0.46);
      pop();
    }

    drawingContext.save();
    drawingContext.shadowColor = `rgba(${255}, ${255}, ${255}, ${alpha / 255})`;
    drawingContext.shadowBlur = 20;
    noStroke();
    fill(255, 255, 255, alpha * 0.45);
    circle(0, 0, radius * 0.45);
    drawingContext.restore();

    for (const spark of this.sparkles) {
      const localProgress = constrain((progress - spark.delay) / (1 - spark.delay || 1), 0, 1);
      if (localProgress <= 0) continue;
      const dist = this.baseRadius * 0.5 + radius * spark.radius * localProgress * spark.speed;
      const size = spark.size * (1 - localProgress * 0.7);
      const px = cos(spark.angle + progress * 1.2) * dist;
      const py = sin(spark.angle + progress * 1.2) * dist;
      fill(255, 255, 255, alpha * (0.6 - localProgress * 0.4));
      circle(px, py, size);
    }

    blendMode(ADD);
    fill(255, 255, 255, alpha * 0.22);
    circle(0, 0, radius * 0.75);
    blendMode(BLEND);
    pop();
  }
}

/* ---------------- 海洋生物 ---------------- */

class SeaCreature {
  constructor(type) {
    this.type = type;
    this.offset = random(TWO_PI);
    this.speechTimer = 0;
    this.speechDuration = CREATURE_SPEECH_DURATION;
    this.reset(true);
  }

  reset(initial = false) {
    this.scale = random(0.8, 1.6);
    this.baseSpeed = random(0.4, 0.95);
    this.y = random(height * 0.22, height * 0.88);
    this.x = initial ? random(width) : -random(60, 220);
    this.offset = random(TWO_PI);
    this.color = random([
      color(120, 190, 255, 110),
      color(90, 210, 240, 100),
      color(150, 220, 255, 120),
      color(80, 170, 230, 105),
    ]);
    this.speechTimer = 0;
  }

  update(state) {
    const pace = state === 'play' ? 0.6 : 1;
    this.x += (this.baseSpeed + this.scale * 0.3) * pace * 1.9;
    this.y += sin(frameCount * 0.01 + this.offset) * 0.4;
    if (this.x > width + 160) this.reset();
    if (this.speechTimer > 0) this.speechTimer--;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(this.scale);
    noStroke();
    const c = this.color;

    if (this.type === 'fish') {
      push();
      rotate(radians(2));
      fill(red(c), green(c), blue(c), alpha(c));
      ellipse(0, 0, 54, 28);
      triangle(-24, 0, -40, -12, -40, 12);
      fill(255, 255, 255, 120);
      ellipse(18, -4, 8, 8);
      fill(40, 70, 120, 160);
      ellipse(20, -4, 3.5, 3.5);
      pop();
    } else {
      // jellyfish
      fill(red(c), green(c), blue(c), alpha(c));
      arc(0, -6, 44, 38, PI, TWO_PI, CHORD);
      fill(red(c), green(c), blue(c), alpha(c) * 0.7);
      rectMode(CENTER);
      rect(0, 4, 38, 12, 6);
      stroke(red(c), green(c), blue(c), alpha(c) * 0.6);
      strokeWeight(2);
      noFill();
      for (let i = -1; i <= 1; i++) {
        const wave = sin(frameCount * 0.04 + this.offset + i) * 6;
        bezier(
          i * 8,
          10,
          i * 8 + wave * 0.6,
          22,
          i * 8 - wave * 0.4,
          34,
          i * 8 + wave * 0.2,
          44
        );
      }
    }
    this.drawSpeech();
    pop();
  }

  hit(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const radius = (this.type === 'fish' ? 34 : 32) * this.scale;
    return dx * dx + dy * dy <= radius * radius;
  }

  triggerSpeech() {
    this.speechTimer = this.speechDuration;
  }

  drawSpeech() {
    if (this.speechTimer <= 0) return;
    push();
    const bias = constrain((width / 2 - this.x) * 0.12, -30, 30);
    scale(1 / this.scale);
    drawSpeechBubbleForCreature('不要點我!', this.speechTimer, this.speechDuration, {
      offsetY: -54,
      bobIntensity: 6,
      width: 118,
      height: 42,
      xNudge: bias,
      pointerOffset: 8,
    });
    pop();
  }
}

class Coral {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width);
    this.scale = random(0.7, 1.3);
    this.height = random(height * 0.14, height * 0.24);
    this.offset = random(TWO_PI);
    this.branches = floor(random(3, 5));
    this.baseCol = random([
      color(255, 170, 180, 165),
      color(255, 150, 190, 170),
      color(255, 190, 170, 160),
      color(255, 160, 210, 165),
    ]);
    this.tipCol = lerpColor(this.baseCol, color(255, 245, 245, 180), 0.6);
  }

  draw() {
    push();
    translate(this.x, height);
    scale(this.scale);

    const h = this.height;
    const sway = sin(frameCount * 0.01 + this.offset) * 8;

    noStroke();
    fill(red(this.baseCol), green(this.baseCol), blue(this.baseCol), alpha(this.baseCol));

    beginShape();
    vertex(-18, 0);
    bezierVertex(-22 + sway * 0.3, -h * 0.2, -18 + sway * 0.5, -h * 0.6, -6 + sway * 0.4, -h);
    bezierVertex(4 + sway * 0.4, -h * 0.8, 2 + sway * 0.3, -h * 0.4, 12 + sway * 0.2, -h * 0.18);
    bezierVertex(18 + sway * 0.1, -h * 0.08, 14 + sway * 0.06, -h * 0.02, 20 + sway * 0.05, 0);
    endShape(CLOSE);

    for (let i = 0; i < this.branches; i++) {
      const branchHeight = h * lerp(0.55, 0.95, i / max(1, this.branches - 1));
      const xOffset = lerp(-12, 10, i / max(1, this.branches - 1));
      const branchSway = sin(frameCount * 0.012 + this.offset + i) * 10;

      beginShape();
      vertex(xOffset, -branchHeight * 0.35);
      bezierVertex(
        xOffset + branchSway * 0.08,
        -branchHeight * 0.6,
        xOffset + branchSway * 0.38,
        -branchHeight * 0.9,
        xOffset + branchSway * 0.52,
        -branchHeight
      );
      bezierVertex(
        xOffset + branchSway * 0.24,
        -branchHeight * 0.84,
        xOffset + branchSway * 0.12,
        -branchHeight * 0.55,
        xOffset + branchSway * 0.06,
        -branchHeight * 0.28
      );
      endShape(CLOSE);

      fill(red(this.tipCol), green(this.tipCol), blue(this.tipCol), alpha(this.tipCol));
      ellipse(xOffset + branchSway * 0.45, -branchHeight, 16, 16);
      fill(red(this.baseCol), green(this.baseCol), blue(this.baseCol), alpha(this.baseCol) * 0.6);
      ellipse(xOffset + branchSway * 0.34, -branchHeight * 0.78, 12, 12);
      fill(red(this.baseCol), green(this.baseCol), blue(this.baseCol), alpha(this.baseCol) * 0.35);
      ellipse(xOffset + branchSway * 0.22, -branchHeight * 0.52, 10, 10);
    }

    fill(red(this.baseCol), green(this.baseCol), blue(this.baseCol), alpha(this.baseCol) * 0.8);
    ellipse(-6, -h * 0.62, 14, 16);

    fill(20, 40, 60, 70);
    ellipse(0, 4, 60, 18);
    pop();
  }
}

class FloatingJelly {
  constructor() {
    this.offset = random(TWO_PI);
    this.speechTimer = 0;
    this.speechDuration = CREATURE_SPEECH_DURATION;
    this.reset(true);
  }

  reset(initial = false) {
    this.scale = random(0.7, 1.4);
    this.speed = random(0.3, 0.6);
    this.drift = random(-0.3, 0.3);
    this.x = random(width);
    this.y = initial ? random(height * 0.25, height * 0.9) : height + random(40, 180);
    this.offset = random(TWO_PI);
    this.color = random([
      color(150, 220, 255, 120),
      color(120, 210, 255, 110),
      color(170, 230, 255, 130),
    ]);
    this.speechTimer = 0;
  }

  update(state) {
    const pace = state === 'play' ? 1.2 : 1;
    this.y -= this.speed * pace;
    this.x += sin(frameCount * 0.01 + this.offset) * 0.6 + this.drift * 0.2;
    if (this.y < -120) this.reset();
    if (this.speechTimer > 0) this.speechTimer--;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(this.scale);
    const c = this.color;

    noStroke();
    fill(red(c), green(c), blue(c), alpha(c));
    arc(0, -10, 50, 40, PI, TWO_PI, CHORD);
    fill(red(c), green(c), blue(c), alpha(c) * 0.65);
    rectMode(CENTER);
    rect(0, 4, 42, 14, 8);

    stroke(red(c), green(c), blue(c), alpha(c) * 0.7);
    strokeWeight(2);
    noFill();
    for (let i = -1; i <= 1; i++) {
      const wave = sin(frameCount * 0.05 + this.offset + i) * 6;
      bezier(
        i * 9,
        10,
        i * 9 + wave * 0.4,
        24,
        i * 9 - wave * 0.5,
        36,
        i * 9 + wave * 0.3,
        50
      );
    }
    this.drawSpeech();
    pop();
  }

  hit(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const radius = 30 * this.scale;
    return dx * dx + dy * dy <= radius * radius;
  }

  triggerSpeech() {
    this.speechTimer = this.speechDuration;
  }

  drawSpeech() {
    if (this.speechTimer <= 0) return;
    push();
    const bias = constrain((width / 2 - this.x) * 0.12, -36, 36);
    scale(1 / this.scale);
    drawSpeechBubbleForCreature('不要點我!', this.speechTimer, this.speechDuration, {
      offsetY: -66,
      bobIntensity: 8,
      width: 126,
      height: 44,
      xNudge: bias,
      pointerOffset: -6,
    });
    pop();
  }
}

class Turtle {
  constructor() {
    this.offset = random(TWO_PI);
    this.speechTimer = 0;
    this.speechDuration = CREATURE_SPEECH_DURATION;
    this.reset(true);
  }

  reset(initial = false) {
    this.scale = random(0.75, 1.15);
    this.speed = random(0.4, 0.75);
    this.y = random(height * 0.35, height * 0.7);
    this.x = initial ? random(width) : -random(120, 260);
    this.offset = random(TWO_PI);
    this.shellCol = random([
      color(90, 150, 180, 180),
      color(100, 170, 190, 180),
      color(80, 160, 175, 180),
    ]);
    this.skinCol = color(190, 220, 210, 200);
    this.patternCol = color(220, 240, 230, 160);
    this.speechTimer = 0;
  }

  update(state) {
    const pace = state === 'play' ? 0.75 : 1;
    this.x += this.speed * pace * 2.2;
    this.y += sin(frameCount * 0.006 + this.offset) * 0.7;
    if (this.x > width + 220) this.reset();
    if (this.speechTimer > 0) this.speechTimer--;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(this.scale);
    rotate(sin(frameCount * 0.005 + this.offset) * 0.05);

    noStroke();
    fill(this.shellCol);
    ellipse(0, 0, 120, 90);

    fill(this.patternCol);
    for (let i = -1; i <= 1; i++) {
      ellipse(i * 32, -12, 30, 24);
      ellipse(i * 32, 16, 26, 22);
    }
    ellipse(0, 0, 40, 32);

    fill(this.skinCol);
    ellipse(60, -4, 30, 24); // head
    ellipse(-50, -40, 28, 24); // rear fin top
    ellipse(-46, 38, 28, 24); // rear fin bottom

    push();
    rotate(-0.4);
    ellipse(36, -42, 40, 22);
    pop();
    push();
    rotate(0.45);
    ellipse(36, 42, 40, 22);
    pop();

    fill(60, 80, 90, 220);
    ellipse(68, -8, 6, 6);
    this.drawSpeech();
    pop();
  }

  hit(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const radius = 60 * this.scale;
    return dx * dx + dy * dy <= radius * radius;
  }

  triggerSpeech() {
    this.speechTimer = this.speechDuration;
  }

  drawSpeech() {
    if (this.speechTimer <= 0) return;
    push();
    const bias = constrain((width / 2 - this.x) * 0.1, -40, 40);
    scale(1 / this.scale);
    drawSpeechBubbleForCreature('不要點我!', this.speechTimer, this.speechDuration, {
      offsetY: -110,
      bobIntensity: 5,
      width: 140,
      height: 48,
      xNudge: bias,
      pointerOffset: 0,
      pointerSize: 22,
      textSize: 19,
    });
    pop();
  }
}

class Starfish {
  constructor() {
    this.offset = random(TWO_PI);
    this.reset();
  }

  reset() {
    this.x = random(width);
    this.y = height - random(24, 60);
    this.scale = random(0.55, 1.05);
    this.rotation = random(TWO_PI);
    this.col = random([
      color(255, 170, 120, 180),
      color(255, 150, 130, 180),
      color(255, 200, 150, 170),
    ]);
    this.speechTimer = 0;
    this.speechDuration = CREATURE_SPEECH_DURATION;
  }

  draw() {
    push();
    translate(this.x, this.y + sin(frameCount * 0.02 + this.offset) * 1.2);
    scale(this.scale);
    rotate(this.rotation + sin(frameCount * 0.01 + this.offset) * 0.1);
    if (this.speechTimer > 0) this.speechTimer--;

    noStroke();
    fill(this.col);

    beginShape();
    const arms = 5;
    const inner = 14;
    const outer = 34;
    for (let i = 0; i < arms * 2; i++) {
      const angle = PI / arms * i;
      const r = i % 2 === 0 ? outer : inner;
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);

    fill(255, 220, 200, 140);
    ellipse(0, 0, 18, 18);
    this.drawSpeech();
    pop();
  }

  hit(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const radius = 34 * this.scale;
    return dx * dx + dy * dy <= radius * radius;
  }

  triggerSpeech() {
    this.speechTimer = this.speechDuration;
  }

  drawSpeech() {
    if (this.speechTimer <= 0) return;
    push();
    const bias = constrain((width / 2 - this.x) * 0.12, -34, 34);
    scale(1 / this.scale);
    drawSpeechBubbleForCreature('不要點我!', this.speechTimer, this.speechDuration, {
      offsetY: -58,
      bobIntensity: 3,
      width: 110,
      height: 36,
      xNudge: bias,
      pointerOffset: 0,
      pointerSize: 16,
      textSize: 16,
    });
    pop();
  }
}

/* ---------------- 泡泡生成 ---------------- */

function spawnBubble() {
  const r = random(34, 68);
  const x = random(r, width - r);
  const y = height + r + random(10, 100);
  const palette = ['#5E9BFF', '#67C0FF', '#7AD6FF', '#6F8CFF', '#55B5F7', '#88E0F2'];
  const col = random(palette);
  bubbles.push(new Bubble(x, y, r, col));
}

function ensureAudioUnlocked() {
  if (audioUnlocked) return;
  if (typeof getAudioContext === 'function') {
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'running') {
      ctx.resume()
        .then(() => {
          audioUnlocked = true;
        })
        .catch(() => {});
    }
    if (ctx && ctx.state === 'running') {
      audioUnlocked = true;
    }
  }
  if (!audioUnlocked && typeof userStartAudio === 'function') {
    userStartAudio();
  }
  if (typeof getAudioContext === 'function') {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      audioUnlocked = true;
    }
  }
}

function playExplosionSound() {
  if (!popSound || !popSound.isLoaded()) return;

  const playNow = () => {
    if (typeof popSound.stop === 'function' && typeof popSound.isPlaying === 'function' && popSound.isPlaying()) {
      popSound.stop();
    }
    if (typeof popSound.rate === 'function') {
      popSound.rate(random(0.95, 1.05));
    }
    popSound.play();
  };

  ensureAudioUnlocked();

  if (typeof getAudioContext === 'function') {
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'running') {
      ctx.resume()
        .then(() => {
          audioUnlocked = true;
          playNow();
        })
        .catch(() => {
          if (typeof userStartAudio === 'function') {
            userStartAudio();
          }
          const resumedCtx = typeof getAudioContext === 'function' ? getAudioContext() : null;
          if (resumedCtx && resumedCtx.state === 'running') {
            audioUnlocked = true;
            playNow();
          }
        });
      return;
    }
  }

  playNow();
}

/* ---------------- 互動 ---------------- */

function mousePressed() {
  ensureAudioUnlocked();
  handleCreaturePress(mouseX, mouseY);
  if (gameState === 'start' || gameState === 'end') return;
  handleBubblePress(mouseX, mouseY);
}

function mouseReleased() {
  if (!drawButton._areas) return;
  const areas = drawButton._areas.slice();
  drawButton._areas = [];
  for (const a of areas) {
    if (mouseX >= a.x && mouseX <= a.x + a.w && mouseY >= a.y && mouseY <= a.y + a.h) {
      a.onClick && a.onClick();
      break;
    }
  }
}

function touchStarted() {
  ensureAudioUnlocked();
  handleCreaturePress(mouseX, mouseY);
  if (gameState === 'start' || gameState === 'end') return;
  handleBubblePress(mouseX, mouseY);
  return false;
}

function handleBubblePress(mx, my) {
  if (gameState !== 'play') return;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (bubbles[i].hit(mx, my) && !bubbles[i].popped) {
      bubbles[i].pop();
      break;
    }
  }
}

function handleCreaturePress(mx, my) {
  let triggered = false;
  for (const creature of seaCreatures) {
    if (creature.hit(mx, my)) {
      creature.triggerSpeech();
      triggered = true;
    }
  }
  for (const turtle of turtles) {
    if (turtle.hit(mx, my)) {
      turtle.triggerSpeech();
      triggered = true;
    }
  }
  for (const star of starfish) {
    if (star.hit(mx, my)) {
      star.triggerSpeech();
      triggered = true;
    }
  }
  for (const jelly of floatingJellies) {
    if (jelly.hit(mx, my)) {
      jelly.triggerSpeech();
      triggered = true;
    }
  }
  return triggered;
}

/* ---------------- UI 元件 ---------------- */

function drawHUD() {
  push();
  const hudW = min(width * 0.75, 520);
  const hudH = 86;
  const hudX = width / 2 - hudW / 2;
  const hudY = 18;
  const padding = 22;

  // Glassmorphism style panel
  noStroke();
  fill(255, 255, 255, 54);
  rect(hudX, hudY, hudW, hudH, 20);
  stroke(255, 255, 255, 110);
  noFill();
  rect(hudX, hudY, hudW, hudH, 20);

  const elapsed = millis() - startTime;
  const left = max(0, timeLimit - elapsed);
  const sec = ceil(left / 1000);

  const barW = hudW - padding * 2;
  const ratio = constrain(left / timeLimit, 0, 1);

  fill(28, 80, 150, 210);
  textSize(22);
  textAlign(LEFT, CENTER);
  text('414730175', hudX + padding, hudY + hudH / 2);

  textAlign(RIGHT, CENTER);
  text(`分數：${score}`, hudX + hudW - padding, hudY + hudH / 2);

  fill(46, 116, 200, 220);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(`剩餘：${sec} 秒`, width / 2, hudY + hudH / 2);

  // progress bar beneath panel
  noStroke();
  fill(255, 255, 255, 46);
  rect(width / 2 - barW / 2, hudY + hudH + 12, barW, 10, 8);

  fill('#4DA8FF');
  rect(width / 2 - barW / 2, hudY + hudH + 12, barW * ratio, 10, 8);
  pop();
}

function drawTitle(t) {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(min(width, height) * 0.1);
  text(t, width / 2, height * 0.34);
}

function drawSub(t) {
  fill(240);
  textAlign(CENTER, CENTER);
  textSize(24);
  text(t, width / 2, height * 0.46);
}

function drawButton(cx, cy, w, h, label, onClick) {
  if (!drawButton._areas) drawButton._areas = [];
  const hover = mouseX >= cx - w/2 && mouseX <= cx + w/2 &&
                mouseY >= cy - h/2 && mouseY <= cy + h/2;
  push();
  rectMode(CENTER);
  noStroke();
  fill(hover ? '#3E6DFF' : '#4F88FF');
  rect(cx, cy, w, h, 14);
  fill(255, 255, 255, 48);
  rect(cx, cy - h * 0.18, w * 0.86, h * 0.34, 10);
  pop();

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text(label, cx, cy + 1);
  drawButton._areas.push({x: cx-w/2, y: cy-h/2, w, h, onClick});
}

/* ---------------- 背景漸層 ---------------- */

function drawBackground() {
  push();
  const topCol = color('#101C3C');
  const bottomCol = color('#3BA8F5');
  for (let y = 0; y < height; y++) {
    const inter = map(y, 0, height, 0, 1);
    const c = lerpColor(topCol, bottomCol, inter);
    stroke(c);
    line(0, y, width, y);
  }
  drawLightShafts();
  drawCaustics();
  drawAmbientSpecks();

  const isStart = gameState === 'start';
  if (isStart) {
    noStroke();
    blendMode(ADD);
    const drift = frameCount * 0.003;
    for (let i = 0; i < 4; i++) {
      const px = width * noise(i * 0.9, drift);
      const py = height * noise(12 + i * 0.9, drift);
      const size = width * 0.16 + noise(30 + i, drift) * width * 0.12;
      fill(190, 220, 255, 16);
      ellipse(px - width * 0.12, py - height * 0.24, size, size);
      fill(130, 200, 255, 10);
      ellipse(width - px * 0.55, height - py * 0.35, size * 0.72, size * 0.72);
    }
    blendMode(BLEND);
  }

  drawSurfaceGlow(isStart);
  drawVignetteOverlay();
  pop();
}

function drawLightShafts() {
  push();
  blendMode(SCREEN);
  noStroke();
  for (let i = 0; i < 3; i++) {
    const offset = frameCount * 0.015 + i * 40;
    const beamCenter = width * (0.18 + i * 0.28) + sin(offset * 0.04) * width * 0.08;
    const beamWidth = width * (0.16 + 0.04 * sin(offset * 0.03 + i));
    const topY = -height * 0.1;
    const bottomY = height * 0.75 + sin(offset * 0.01) * height * 0.05;
    const alpha = 26 + 12 * sin(offset * 0.05 + i);
    const colorShift = 220 + i * 10;
    fill(colorShift, 240, 255, alpha);
    beginShape();
    vertex(beamCenter - beamWidth * 0.28, topY);
    vertex(beamCenter + beamWidth * 0.28, topY);
    vertex(beamCenter + beamWidth, bottomY);
    vertex(beamCenter - beamWidth, bottomY);
    endShape(CLOSE);
  }
  pop();
}

function drawCaustics() {
  if (!causticLayers.length) return;
  push();
  blendMode(ADD);
  noFill();
  for (let i = 0; i < causticLayers.length; i++) {
    const layer = causticLayers[i];
    const hue = 180 + i * 12;
    stroke(hue, 235, 255, 18 + i * 8);
    strokeWeight(1.1 + i * 0.4);
    beginShape();
    for (let x = -120; x <= width + 120; x += 18) {
      const noiseInput = layer.offsetX + x * 0.0016 * layer.scale;
      const time = layer.offsetY + frameCount * layer.speed;
      const noiseVal = noise(noiseInput, time);
      const wave = sin(x * 0.004 + frameCount * 0.02 * layer.scale) * 18 * layer.scale;
      const baseY = height * layer.baseLine;
      const y = baseY + noiseVal * height * layer.amplitude + wave;
      vertex(x, y);
    }
    endShape();
  }
  pop();
}

function drawAmbientSpecks() {
  if (!ambientSpecks.length) return;
  push();
  noStroke();
  for (const speck of ambientSpecks) {
    speck.y -= speck.speed;
    speck.x += cos(frameCount * 0.01 + speck.drift) * 0.15;
    if (speck.y < -speck.size) {
      speck.y = height + speck.size + random(height * 0.1);
      speck.x = random(width);
    }
    if (speck.x < -speck.size) speck.x = width + speck.size;
    if (speck.x > width + speck.size) speck.x = -speck.size;
    const pulse = map(sin(frameCount * 0.03 + speck.drift), -1, 1, 0.25, 0.9);
    fill(200, 240, 255, speck.alpha * pulse);
    circle(speck.x, speck.y, speck.size * 1.8);
    fill(255, 255, 255, speck.alpha * pulse * 0.75);
    circle(speck.x, speck.y, speck.size);
  }
  pop();
}

function drawSurfaceGlow(isStart) {
  push();
  noStroke();
  const topOpacity = isStart ? 22 : 14;
  for (let i = 0; i < 3; i++) {
    const opacity = topOpacity - i * 4;
    if (opacity <= 0) continue;
    fill(255, 255, 255, opacity);
    const heightFactor = 0.08 + i * 0.04;
    rect(0, -height * heightFactor * 0.35, width, height * heightFactor);
  }

  const shimmerY = height * 0.62 + sin(frameCount * 0.01) * height * 0.02;
  fill(255, 255, 255, 8);
  ellipse(width * 0.48, shimmerY, width * 0.8, height * 0.18);
  pop();
}

function drawVignetteOverlay() {
  push();
  drawingContext.save();
  const cx = width / 2;
  const cy = height * 0.68;
  const innerRadius = max(width, height) * 0.3;
  const outerRadius = max(width, height) * 0.95;
  const vignette = drawingContext.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(4, 12, 28, 0.78)');
  drawingContext.fillStyle = vignette;
  drawingContext.fillRect(0, 0, width, height);
  drawingContext.restore();
  pop();
}

function drawSpeechBubbleForCreature(message, timer, duration, options = {}) {
  const {
    offsetY = -54,
    width: bubbleW = 120,
    height: bubbleH = 40,
    xNudge = 0,
    bobIntensity = 6,
    pointerOffset = 0,
    pointerSize = 18,
    textSize: bubbleTextSize = 18,
  } = options;

  if (timer <= 0 || duration <= 0) return;
  const progress = 1 - timer / duration;
  const appear = constrain(progress * 1.6, 0, 1);
  const disappear = constrain((1 - progress) * 1.6, 0, 1);
  const alpha = min(appear, disappear);
  if (alpha <= 0) return;

  const bob = sin(progress * PI) * bobIntensity;
  const yPos = offsetY + bob;

  push();
  noStroke();
  rectMode(CENTER);

  fill(0, 0, 0, 70 * alpha);
  ellipse(xNudge + pointerOffset * 0.45, yPos + bubbleH * 0.46 + pointerSize * 0.4, bubbleW * 0.52, 14);

  fill(12, 34, 64, 120 * alpha);
  rect(xNudge, yPos + 6, bubbleW + 22, bubbleH + 24, 26);

  fill(24, 86, 160, 200 * alpha);
  rect(xNudge, yPos, bubbleW, bubbleH, 18);

  fill(24, 86, 160, 200 * alpha);
  beginShape();
  const halfPointer = pointerSize * 0.72;
  vertex(xNudge + pointerOffset - halfPointer, yPos + bubbleH * 0.5);
  vertex(xNudge + pointerOffset, yPos + bubbleH * 0.5 + pointerSize);
  vertex(xNudge + pointerOffset + halfPointer, yPos + bubbleH * 0.5);
  endShape(CLOSE);

  fill(255, 255, 255, 240 * alpha);
  textAlign(CENTER, CENTER);
  textSize(bubbleTextSize);
  text(message, xNudge, yPos - 2);

  pop();
}

function initAmbientSpecks() {
  ambientSpecks = [];
  const area = max(width * height, 1);
  const count = constrain(floor(area / 9500), 80, 220);
  for (let i = 0; i < count; i++) {
    ambientSpecks.push({
      x: random(width),
      y: random(height),
      size: random(2, 4.4),
      speed: random(0.35, 0.9),
      alpha: random(40, 110),
      drift: random(TWO_PI),
    });
  }
}

function initCausticLayers() {
  causticLayers = [];
  const layerCount = 3;
  for (let i = 0; i < layerCount; i++) {
    causticLayers.push({
      scale: random(0.7, 1.2),
      speed: random(0.0006, 0.0012),
      baseLine: random(0.18 + i * 0.08, 0.32 + i * 0.08),
      amplitude: random(0.08, 0.14),
      offsetX: random(1000),
      offsetY: random(1000),
    });
  }
}

function initSeaCreatures() {
  seaCreatures = [];
  const count = max(5, floor(width / 320));
  for (let i = 0; i < count; i++) {
    const type = random() < 0.65 ? 'fish' : 'jelly';
    seaCreatures.push(new SeaCreature(type));
  }
}

function drawSeaCreatures() {
  for (const creature of seaCreatures) {
    creature.update(gameState);
    creature.draw();
  }
}

function initFloatingJellies() {
  floatingJellies = [];
  const count = max(3, floor(width / 360));
  for (let i = 0; i < count; i++) {
    floatingJellies.push(new FloatingJelly());
  }
}

function drawFloatingJellies() {
  for (const jelly of floatingJellies) {
    jelly.update(gameState);
    jelly.draw();
  }
}

function initCorals() {
  corals = [];
  const count = max(5, floor(width / 300));
  for (let i = 0; i < count; i++) {
    corals.push(new Coral());
  }
}

function drawCorals() {
  for (const coral of corals) {
    coral.draw();
  }
}

function initTurtles() {
  turtles = [];
  const count = max(2, floor(width / 520));
  for (let i = 0; i < count; i++) {
    turtles.push(new Turtle());
  }
}

function drawTurtles() {
  for (const turtle of turtles) {
    turtle.update(gameState);
    turtle.draw();
  }
}

function initStarfish() {
  starfish = [];
  const count = max(4, floor(width / 320));
  for (let i = 0; i < count; i++) {
    starfish.push(new Starfish());
  }
}

function drawStarfish() {
  for (const star of starfish) {
    star.draw();
  }
}
