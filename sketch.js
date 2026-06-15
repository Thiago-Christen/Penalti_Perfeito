
// ============================================================
// PÊNALTI PERFEITO
// Jogo em p5.js com menu inicial, tela de sobre, partida e game over.
// O código foi organizado em blocos para facilitar manutenção.
// ============================================================

// -------------------------
// Estado geral do jogo
// -------------------------
let gameState = "start"; // start, about, playing, gameover

let score = 0;
let bestScore = 0;
let lives = 3;
let phase = 1;
let gameOverReason = "";
let feedbackBanner;

// -------------------------
// Assets (imagens e áudio)
// -------------------------
let sprites = {};
let audio = {};
let bgArt = null;

// -------------------------
// Constantes de jogo
// -------------------------
const MAX_LIVES = 3;
const MAX_PHASE = 5;

const TEAM_MEMBERS = [
  "Thiago Soares",
  "Gabriel Quadros",
];

const COLORS = {
  panel: [10, 18, 30, 170],
  panel2: [255, 255, 255, 18],
  text: [255, 255, 255, 255],
};

// -------------------------
// Entidades principais
// -------------------------
const ball = {
  x: 0,
  y: 0,
  r: 16,
  vx: 0,
  vy: 0,
  moving: false,
};

const shot = {
  dragging: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
};

const keeper = {
  x: 0,
  y: 0,
  baseY: 0,
  dir: 1,
  speed: 2.8,
  minX: 0,
  maxX: 0,
  diveTimer: 0,
  diveDir: 1,
};

const player = {
  x: 0,
  y: 0,
  kickTimer: 0,
};

const field = {
  goalWidthBase: 320,
  goalHeight: 122,
};

// ============================================================
// Feedback temporário no topo da tela
// ============================================================
class FeedbackBanner {
  constructor() {
    this.text = "";
    this.timer = 0;
    this.kind = "info";
  }

  show(text, duration = 90, kind = "info") {
    this.text = text;
    this.timer = duration;
    this.kind = kind;
  }

  update() {
    if (this.timer > 0) {
      this.timer -= 1;
      if (this.timer < 0) this.timer = 0;
    }
  }

  draw() {
    if (this.timer <= 0 || !this.text) return;

    const alpha = map(this.timer, 0, 90, 0, 230, true);
    const panelW = min(620, width * 0.9);
    const panelH = 54;
    const x = width / 2 - panelW / 2;
    const y = 88;

    noStroke();
    fill(0, 0, 0, alpha * 0.45);
    rect(x + 6, y + 6, panelW, panelH, 18);

    const baseFill =
      this.kind === "good"
        ? color(40, 180, 100, alpha)
        : this.kind === "bad"
        ? color(220, 72, 76, alpha)
        : color(255, 255, 255, alpha * 0.95);

    fill(baseFill);
    rect(x, y, panelW, panelH, 18);

    fill(this.kind === "good" || this.kind === "bad" ? 255 : 35);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(18);
    text(this.text, width / 2, y + panelH / 2 + 1);
  }
}

// ============================================================
// Inicialização
// ============================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("Arial");

  loadAssetsAsync();
  createAudios();

  feedbackBanner = new FeedbackBanner();
  resetMatch();
}

// ============================================================
// Carregamento de imagens
// ============================================================
function loadAssetsAsync() {
  loadImage(
    "jogador.png",
    (img) => (sprites.playerIdle = img),
    () => (sprites.playerIdle = null)
  );

  loadImage(
    "jogador_chutando.png",
    (img) => (sprites.playerKick = img),
    () => (sprites.playerKick = null)
  );

  loadImage(
    "goleiro.png",
    (img) => (sprites.keeperIdle = img),
    () => (sprites.keeperIdle = null)
  );

  loadImage(
    "goleiro_pulando.png",
    (img) => (sprites.keeperDive = img),
    () => (sprites.keeperDive = null)
  );

  loadImage(
    "bola.png",
    (img) => (sprites.ball = img),
    () => (sprites.ball = null)
  );

  loadImage(
    "fifa-thumb.jpg",
    (img) => (bgArt = img),
    () => (bgArt = null)
  );
}

// ============================================================
// Áudios opcionais
// ============================================================
function createAudios() {
  // Se os arquivos existirem, os sons entram automaticamente.
  audio.kick = createOptionalAudio("assets/sounds/chute.mp3", false, 0.5);
  audio.goal = createOptionalAudio("assets/sounds/gol.mp3", false, 0.5);
  audio.save = createOptionalAudio("assets/sounds/defesa.mp3", false, 0.45);
  audio.lose = createOptionalAudio("assets/sounds/derrota.mp3", false, 0.6);
  audio.bg = createOptionalAudio("assets/sounds/fundo.mp3", true, 0.22);
}

// ============================================================
// Redimensionamento da janela
// ============================================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  syncLayout();
  resetBall();
}

// ============================================================
// Layout base da partida
// ============================================================
function syncLayout() {
  const goal = getGoalRect();

  keeper.y = goal.y + goal.h * 0.74;
  keeper.baseY = keeper.y;
  keeper.minX = goal.x + 26;
  keeper.maxX = goal.x + goal.w - 26;
  keeper.x = constrain(keeper.x || width / 2, keeper.minX, keeper.maxX);

  player.x = width / 2;
  player.y = height - 60;
}

// ============================================================
// Progressão de fase
// ============================================================
function getPhaseFromScore(currentScore) {
  return min(MAX_PHASE, floor(currentScore / 3) + 1);
}

function getPhaseLabel(p) {
  if (p === 1) return "Aquecimento";
  if (p === 2) return "Atento";
  if (p === 3) return "Pressão";
  if (p === 4) return "Decisão";
  return "Final";
}

// ============================================================
// Reset geral da partida
// ============================================================
function resetMatch() {
  score = 0;
  lives = MAX_LIVES;
  phase = 1;
  gameOverReason = "";
  gameState = "start";

  keeper.dir = random([1, -1]);
  keeper.speed = 2.8;
  keeper.x = width / 2;
  keeper.diveTimer = 0;

  feedbackBanner.show("Prepare-se para a cobrança!", 120, "info");

  syncLayout();
  resetBall();
}

// ============================================================
// Reset da bola para a posição inicial
// ============================================================
function resetBall() {
  ball.x = width / 2;
  ball.y = height - 96;
  ball.vx = 0;
  ball.vy = 0;
  ball.moving = false;

  shot.dragging = false;
  shot.startX = ball.x;
  shot.startY = ball.y;
  shot.endX = ball.x;
  shot.endY = ball.y;
}

// ============================================================
// Fluxo do jogo
// ============================================================
function startPlaying() {
  gameState = "playing";
  score = 0;
  lives = MAX_LIVES;
  phase = 1;
  gameOverReason = "";

  keeper.dir = random([1, -1]);
  keeper.speed = 2.8;
  keeper.x = width / 2;
  keeper.diveTimer = 0;

  feedbackBanner.show("Jogo iniciado!", 90, "good");

  syncLayout();
  resetBall();
  playOptionalAudio(audio.bg, true);
}

function openAbout() {
  gameState = "about";
  feedbackBanner.show("Sobre o projeto", 90, "info");
}

function backToMenu() {
  gameState = "start";
  stopOptionalAudio(audio.bg);
  feedbackBanner.show("Menu inicial", 70, "info");
}

// ============================================================
// Loop principal
// ============================================================
function draw() {
  clear();
  updateTimers();
  feedbackBanner.update();

  if (gameState === "start") {
    drawStartScreen();
    feedbackBanner.draw();
    return;
  }

  if (gameState === "about") {
    drawScene();
    drawAboutOverlay();
    feedbackBanner.draw();
    return;
  }

  if (gameState === "playing") {
    drawScene();
    updateKeeper();
    updateBall();
    drawAimGuide();
    drawHud();
    drawInstructions();
    feedbackBanner.draw();
    return;
  }

  if (gameState === "gameover") {
    drawScene();
    updateKeeper();
    drawGameOverOverlay();
    feedbackBanner.draw();
  }
}

function updateTimers() {
  if (player.kickTimer > 0) player.kickTimer -= 1;
  if (keeper.diveTimer > 0) keeper.diveTimer -= 1;
}

// ============================================================
// Menu inicial
// ============================================================
function drawStartScreen() {
  drawStartBackdrop();
  drawHeroHeader();
  drawStartPanel();
}

function drawStartBackdrop() {
  if (bgArt) {
    drawImageCover(bgArt, 0, 0, width, height);
  } else {
    drawSky();
    drawCrowdBand();
    drawFieldGrass();
    drawFieldLines();
    drawGoal();
  }

  // Camadas extras para destacar os elementos do menu.
  noStroke();
  fill(0, 0, 0, 118);
  rect(0, 0, width, height);

  fill(255, 255, 255, 16);
  ellipse(width * 0.18, height * 0.16, 220, 220);
  ellipse(width * 0.86, height * 0.2, 140, 140);
  ellipse(width * 0.84, height * 0.78, 200, 200);
}

function drawHeroHeader() {
  const cx = width / 2;
  const top = height * 0.13;

  drawBadgeTitle(cx, top);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(58, width * 0.064));
  text("Pênalti Perfeito", cx, top + 82);

  textStyle(NORMAL);
  textSize(min(21, width * 0.024));
  fill(255, 255, 255, 232);
  text("Arraste a bola, engane o goleiro e marque o máximo de gols", cx, top + 122);

  const chipsY = top + 162;
  const chipGap = min(180, width * 0.16);
}

function drawBadgeTitle(cx, cy) {
  push();
  pop();
}

function drawStartPanel() {
  const layout = getStartLayout();
  const { x, y, w, h } = layout.panel;

  drawGlassPanel(x, y, w, h, 28, 0.95);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(22);
  text("Como jogar", x + 28, y + 22);

  textStyle(NORMAL);
  textSize(17);
  fill(255, 255, 255, 230);
  text(
    "Clique na bola, arraste para cima e solte.\n" +
      "Quanto maior o arrasto, maior a força.\n" +
      "A cada 3 gols, você sobe de fase e o goleiro fica mais rápido.",
    x + 28,
    y + 58
  );

  const cards = layout.cards;
  drawInfoCard(cards[0].x, cards[0].y, cards[0].w, cards[0].h, "Pontuação", "Marque gols e aumente o placar", "⭐");
  drawInfoCard(cards[1].x, cards[1].y, cards[1].w, cards[1].h, "Vidas", "Perdeu um lance? um coração some", "❤");
  drawInfoCard(cards[2].x, cards[2].y, cards[2].w, cards[2].h, "Fase", "O ritmo sobe conforme você avança", "⬆");

  drawButton(layout.startBtn.x, layout.startBtn.y, layout.startBtn.w, layout.startBtn.h, "JOGAR");
  drawButton(layout.aboutBtn.x, layout.aboutBtn.y, layout.aboutBtn.w, layout.aboutBtn.h, "SOBRE", true);

}

function getStartLayout() {
  const panelW = min(900, width * 0.92);
  const panelH = min(360, height * 0.44);
  const x = width / 2 - panelW / 2;
  const y = height * 0.53 - panelH / 2;

  const cardY = y + 150;
  const cardW = (panelW - 74) / 3;
  const cardH = 88;

  return {
    panel: { x, y, w: panelW, h: panelH },
    cards: [
      { x: x + 20, y: cardY, w: cardW, h: cardH },
      { x: x + 24 + cardW, y: cardY, w: cardW, h: cardH },
      { x: x + 28 + cardW * 2, y: cardY, w: cardW, h: cardH },
    ],
    startBtn: { x: x + panelW / 2 - 140, y: y + panelH - 54, w: 280, h: 42 },
    aboutBtn: { x: x + panelW / 2 - 140, y: y + panelH - 102, w: 280, h: 34 },
  };
}

function drawInfoCard(x, y, w, h, title, subtitle, icon) {
  drawGlassPanel(x, y, w, h, 18, 0.9);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(20);
  text(icon, x + 16, y + 12);

  textSize(16);
  text(title, x + 48, y + 14);

  textStyle(NORMAL);
  textSize(12);
  fill(255, 255, 255, 205);
  text(subtitle, x + 16, y + 44, w - 32, h - 44);
}

// ============================================================
// Overlays do jogo
// ============================================================
function drawAboutOverlay() {
  drawDarkOverlay();

  const panelW = min(760, width * 0.9);
  const panelH = min(310, height * 0.56);
  const x = width / 2 - panelW / 2;
  const y = height / 2 - panelH / 2;

  drawGlassPanel(x, y, panelW, panelH, 28, 0.95);

  fill(255);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("SOBRE", width / 2, y + 20);

  textStyle(NORMAL);
  textSize(18);
  fill(255, 255, 255, 235);
  text(
    "Jogo casual desenvolvido em JavaScript com p5.js.\nO objetivo é marcar gols, subir de fase e sobreviver com suas vidas.",
    width / 2,
    y + 66
  );

  textStyle(BOLD);
  textSize(18);
  text("Participantes", width / 2, y + 136);

  textStyle(NORMAL);
  textSize(17);
  text(TEAM_MEMBERS.join("\n"), width / 2, y + 166);

  textSize(13);
  fill(255, 255, 255, 195);
  text("Imagens e Sons: jogador, chute, goleiro, defesa e bola.", width / 2, y + panelH - 80);

  drawButton(width / 2 - 140, y + panelH - 54, 280, 42, "VOLTAR");
}

function drawGameOverOverlay() {
  drawDarkOverlay();

  const panelW = min(680, width * 0.9);
  const panelH = min(292, height * 0.5);
  const x = width / 2 - panelW / 2;
  const y = height / 2 - panelH / 2;

  drawGlassPanel(x, y, panelW, panelH, 28, 0.98);

  fill(255);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(34);
  text("GAME OVER", width / 2, y + 20);

  textStyle(NORMAL);
  textSize(18);
  fill(255, 255, 255, 235);
  text(gameOverReason, width / 2, y + 76);
  text(`Placar final: ${score}`, width / 2, y + 112);
  text(`Fase alcançada: ${getPhaseFromScore(score)} — ${getPhaseLabel(getPhaseFromScore(score))}`, width / 2, y + 140);
  text(`Recorde da sessão: ${max(bestScore, score)}`, width / 2, y + 168);

  drawLivesRow(width / 2 - 44, y + 198, 3, 20, false);

  drawButton(width / 2 - 140, y + panelH - 54, 280, 42, "JOGAR NOVAMENTE");
}

// ============================================================
// Botões
// ============================================================
function drawButton(x, y, w, h, label, secondary = false) {
  const over = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;

  noStroke();
  fill(over ? color(255, 204, 0) : secondary ? color(255, 255, 255, 34) : color(255, 215, 90));
  rect(x, y, w, h, 18);

  fill(secondary ? 255 : 35);
  textAlign(CENTER, CENTER);
  textSize(17);
  textStyle(BOLD);
  text(label, x + w / 2, y + h / 2 + 1);
}

function getStartButtonRect() {
  return getStartLayout().startBtn;
}

function getAboutButtonRect() {
  return getStartLayout().aboutBtn;
}

function getBackButtonRect() {
  const panelW = min(760, width * 0.9);
  const panelH = min(310, height * 0.56);
  const y = height / 2 - panelH / 2;
  return {
    x: width / 2 - 140,
    y: y + panelH - 54,
    w: 280,
    h: 42,
  };
}

function getRestartButtonRect() {
  const panelW = min(680, width * 0.9);
  const panelH = min(292, height * 0.5);
  const y = height / 2 - panelH / 2;
  return {
    x: width / 2 - 140,
    y: y + panelH - 54,
    w: 280,
    h: 42,
  };
}

// ============================================================
// Cenário
// ============================================================
function drawScene() {
  drawSky();
  drawCrowdBand();
  drawFieldGrass();
  drawFieldLines();
  drawGoal();
  drawKeeper();
  drawBall();
  drawPlayer(); // jogador sempre por cima da bola
}

function drawSky() {
  noStroke();

  for (let y = 0; y < height; y += 6) {
    const t = y / height;
    fill(lerpColor(color(17, 53, 76), color(6, 26, 37), t));
    rect(0, y, width, 6);
  }

  fill(255, 255, 255, 10);
  ellipse(width * 0.18, height * 0.15, 190, 190);
  ellipse(width * 0.82, height * 0.12, 130, 130);
}

function drawCrowdBand() {
  const bandH = max(70, height * 0.12);

  noStroke();
  fill(0, 0, 0, 40);
  rect(0, 0, width, bandH);

  for (let i = 0; i < 40; i++) {
    const x = (i / 40) * width + (i % 2) * 10;
    const wave = sin(frameCount * 0.04 + i * 0.65);
    const h = map(wave, -1, 1, 12, 28);

    fill(255, 255, 255, 22);
    rect(x, bandH - h - 8, 6, h, 3);

    fill(255, 215, 0, 18);
    ellipse(x + 3, bandH - h - 14, 8, 8);
  }
}

function drawFieldGrass() {
  const horizon = height * 0.18;

  noStroke();
  fill(14, 130, 68);
  rect(0, horizon, width, height - horizon);

  const stripes = 11;
  for (let i = 0; i < stripes; i++) {
    const x = (width / stripes) * i;
    fill(i % 2 === 0 ? color(27, 154, 81, 115) : color(0, 0, 0, 0));
    rect(x, horizon, width / stripes, height - horizon);
  }

  fill(0, 0, 0, 18);
  rect(0, horizon, width, height - horizon);

  fill(255, 255, 255, 12);
  ellipse(width / 2, height * 0.72, width * 0.55, height * 0.42);
}

function drawFieldLines() {
  const goal = getGoalRect();
  const lineColor = color(255, 255, 255, 210);

  stroke(lineColor);
  strokeWeight(3);
  noFill();

  const areaW = min(width * 0.46, 520);
  const areaH = min(height * 0.36, 290);
  const areaX = width / 2 - areaW / 2;
  const areaY = height - areaH - 38;
  rect(areaX, areaY, areaW, areaH, 16);

  const sixY = goal.y + 12;
  const sixH = goal.h - 12;
  const sixW = min(areaW * 0.46, goal.w + 58);
  rect(width / 2 - sixW / 2, sixY, sixW, sixH, 14);

  noStroke();
  fill(255);
  circle(width / 2, height - 154, 8);

  noFill();
  stroke(255, 255, 255, 120);
  strokeWeight(2);
  arc(width / 2, height - 154, 150, 150, PI, TWO_PI);

  stroke(255, 255, 255, 40);
  line(width / 2, height, width / 2, goal.y + goal.h);
}

function drawGoal() {
  const goal = getGoalRect();
  const x = goal.x;
  const y = goal.y;
  const w = goal.w;
  const h = goal.h;

  noStroke();
  fill(0, 0, 0, 35);
  rect(x - 6, y + 8, w + 12, 12, 8);

  stroke(255, 255, 255, 55);
  strokeWeight(1);
  for (let i = 0; i <= 12; i++) {
    const nx = map(i, 0, 12, x, x + w);
    line(nx, y, nx, y + h);
  }
  for (let i = 0; i <= 8; i++) {
    const ny = map(i, 0, 8, y, y + h);
    line(x, ny, x + w, ny);
  }

  stroke(255);
  strokeWeight(7);
  line(x, y, x, y + h);
  line(x + w, y, x + w, y + h);
  line(x, y, x + w, y);

  stroke(255, 255, 255, 70);
  strokeWeight(12);
  line(x, y + 4, x + w, y + 4);
}

// ============================================================
// Goleiro
// ============================================================
function updateKeeper() {
  syncLayout();

  const phaseSpeed = 2.1 + phase * 0.85;
  keeper.speed = phaseSpeed;
  keeper.x += keeper.dir * keeper.speed;

  if (keeper.x >= keeper.maxX) {
    keeper.x = keeper.maxX;
    keeper.dir = -1;
  } else if (keeper.x <= keeper.minX) {
    keeper.x = keeper.minX;
    keeper.dir = 1;
  }
}

function drawKeeper() {
  const goal = getGoalRect();
  const x = keeper.x;
  const y = keeper.y;

  noStroke();
  fill(0, 0, 0, 28);
  ellipse(x, y + 42, 84, 18);

  const baseW = min(150, width * 0.12);
  const baseH = baseW;
  const diveW = baseW * 1.18;
  const diveH = baseH * 0.82;

  if (keeper.diveTimer > 0) {
    const diveProgress = map(keeper.diveTimer, 0, 24, 1, 0, true);
    const shiftX = keeper.diveDir * lerp(0, 18, diveProgress);
    const shiftY = lerp(0, 8, diveProgress);

    push();
    translate(x + shiftX, y + shiftY);
    imageMode(CENTER);

    if (keeper.diveDir < 0) {
      scale(-1, 1);
    }

    if (sprites.keeperDive) {
      image(sprites.keeperDive, 0, 0, diveW, diveH);
    } else {
      drawKeeperFallback(true, diveW, diveH);
    }
    pop();
    return;
  }

  push();
  translate(x, y + 4);
  imageMode(CENTER);

  if (sprites.keeperIdle) {
    image(sprites.keeperIdle, 0, 0, baseW, baseH);
  } else {
    drawKeeperFallback(false, baseW, baseH);
  }

  pop();

  noStroke();
  fill(255, 255, 255, 8);
  ellipse(goal.x + goal.w / 2, goal.y + goal.h, goal.w * 0.56, 12);
}

function drawKeeperFallback(diving, w, h) {
  noStroke();
  fill(diving ? color(250, 250, 250) : color(230, 230, 230));
  rectMode(CENTER);
  rect(0, 0, w * 0.5, h * 0.9, 12);
  circle(0, -h * 0.32, h * 0.28);
  rect(0, h * 0.16, w * 0.26, h * 0.42, 10);
  rect(diving ? -w * 0.24 : -w * 0.16, h * 0.05, w * 0.52, h * 0.14, 8);
  rect(diving ? w * 0.24 : w * 0.16, h * 0.05, w * 0.52, h * 0.14, 8);
  rectMode(CORNER);
}

// ============================================================
// Jogador
// ============================================================
function drawPlayer() {
  const baseW = min(182, width * 0.18);
  const baseH = baseW;

  noStroke();
  fill(0, 0, 0, 34);
  ellipse(player.x, player.y + 52, 110, 24);

  push();
  translate(player.x, player.y);
  imageMode(CENTER);

  if (player.kickTimer > 0) {
    const t = map(player.kickTimer, 0, 12, 0, 1, true);
    const offsetX = lerp(10, 0, t);
    const offsetY = lerp(-4, 0, t);

    if (sprites.playerKick) {
      image(sprites.playerKick, offsetX, offsetY, baseW * 1.05, baseH * 1.05);
    } else {
      drawPlayerFallback(true, offsetX, offsetY, baseW, baseH);
    }
  } else if (sprites.playerIdle) {
    image(sprites.playerIdle, 0, 0, baseW, baseH);
  } else {
    drawPlayerFallback(false, 0, 0, baseW, baseH);
  }

  pop();
}

function drawPlayerFallback(kicking, ox, oy, w, h) {
  push();
  translate(ox, oy);
  noStroke();
  fill(255, 255, 255);
  circle(0, -h * 0.28, h * 0.28);
  rectMode(CENTER);
  rect(0, 0, w * 0.35, h * 0.55, 12);
  rect(kicking ? w * 0.12 : 0, h * 0.2, w * 0.18, h * 0.42, 8);
  rect(kicking ? -w * 0.2 : -w * 0.12, h * 0.2, w * 0.18, h * 0.42, 8);
  rect(kicking ? w * 0.2 : -w * 0.18, -h * 0.02, w * 0.36, h * 0.12, 8);
  rectMode(CORNER);
  pop();
}

// ============================================================
// Bola e mira
// ============================================================
function drawBall() {
  // Quando a bola não está em movimento, ela volta para a marca da cobrança.
  if (!ball.moving && gameState !== "gameover" && gameState !== "start" && gameState !== "about" && !shot.dragging) {
    ball.x = width / 2;
    ball.y = height - 96;
  }

  noStroke();
  fill(0, 0, 0, 36);
  ellipse(ball.x + 6, ball.y + 10, ball.r * 2.0, ball.r * 0.7);

  push();
  translate(ball.x, ball.y);
  imageMode(CENTER);

  if (sprites.ball) {
    image(sprites.ball, 0, 0, 40, 40);
  } else {
    fill(255);
    circle(0, 0, 32);
    fill(40);
    circle(0, 0, 10);
  }

  pop();
}

function drawAimGuide() {
  if (!shot.dragging || gameState !== "playing") return;

  const dx = shot.endX - shot.startX;
  const dy = shot.endY - shot.startY;
  const distDrag = constrain(Math.sqrt(dx * dx + dy * dy), 0, 180);
  const p = map(distDrag, 0, 180, 0, 1);

  stroke(255, 255, 255, 220);
  strokeWeight(4);
  line(shot.startX, shot.startY, shot.endX, shot.endY);

  noStroke();
  fill(255, 255, 255, 220);
  circle(shot.endX, shot.endY, 12);

  const barW = 220;
  const barH = 14;
  const x = 24;
  const y = height - 40;

  fill(0, 0, 0, 95);
  rect(x, y, barW, barH, 999);
  fill(255, 215, 90);
  rect(x, y, barW * p, barH, 999);

  fill(255);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(14);
  text("FORÇA DO CHUTE", x, y - 12);
}

// ============================================================
// HUD da partida
// ============================================================
function drawHud() {
  const currentPhase = getPhaseFromScore(score);
  const layout = getHudLayout();

  // Painel esquerdo: placar, fase e vidas.
  drawGlassPanel(layout.left.x, layout.left.y, layout.left.w, layout.left.h, 22, 0.94);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(24);
  text("Pênalti Perfeito", layout.left.x + 18, layout.left.y + 14);

  textStyle(NORMAL);
  textSize(18);
  text(`Gols: ${score}`, layout.left.x + 18, layout.left.y + 48);
  text(`Fase: ${currentPhase} — ${getPhaseLabel(currentPhase)}`, layout.left.x + 18, layout.left.y + 72);

  textSize(14);
  fill(255, 255, 255, 205);
  text("Vidas", layout.left.x + 18, layout.left.y + 98);
  drawLivesRow(layout.left.x + 80, layout.left.y + 110, lives, 20, true);

  // Painel central: status rápido da fase.
  drawGlassPanel(layout.center.x, layout.center.y, layout.center.w, layout.center.h, 22, 0.94);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(18);
  text(`Fase atual`, layout.center.x + layout.center.w / 2, layout.center.y + 20);

  textSize(24);
  text(`Nível ${currentPhase}`, layout.center.x + layout.center.w / 2, layout.center.y + 50);

  textStyle(NORMAL);
  textSize(13);
  fill(255, 255, 255, 215);
  text(getPhaseLabel(currentPhase), layout.center.x + layout.center.w / 2, layout.center.y + 74);

  fill(255, 255, 255, 24);
  rect(layout.center.x + 18, layout.center.y + 95, layout.center.w - 36, 10, 999);
  fill(255, 215, 90);
  rect(layout.center.x + 18, layout.center.y + 95, (layout.center.w - 36) * map(score % 3, 0, 3, 0, 1, true), 10, 999);

  // Painel direito: controles.
  drawGlassPanel(layout.right.x, layout.right.y, layout.right.w, layout.right.h, 22, 0.94);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text("Controles", layout.right.x + 18, layout.right.y + 16);

  textStyle(NORMAL);
  textSize(14);
  fill(255, 255, 255, 220);
  text("Clique na bola e arraste para cima.", layout.right.x + 18, layout.right.y + 46, layout.right.w - 36);
  text("Solte para chutar com força e direção.", layout.right.x + 18, layout.right.y + 68, layout.right.w - 36);
  text("Acertar os cantos ajuda a superar o goleiro.", layout.right.x + 18, layout.right.y + 90, layout.right.w - 36);
}

function getHudLayout() {
  const topY = 20;
  const leftW = min(330, width * 0.34);
  const centerW = min(240, width * 0.25);
  const rightW = min(350, width * 0.34);

  return {
    left: { x: 20, y: topY, w: leftW, h: 132 },
    center: { x: width / 2 - centerW / 2, y: topY, w: centerW, h: 132 },
    right: { x: width - rightW - 20, y: topY, w: rightW, h: 132 },
  };
}

function drawInstructions() {
  const boxW = min(760, width * 0.92);
  const boxH = 34;
  const x = width / 2 - boxW / 2;
  const y = height - 48;

  drawGlassPanel(x, y, boxW, boxH, 18, 0.8);
  fill(255, 255, 255, 235);
  textAlign(CENTER, CENTER);
  textSize(15);
  text("Arraste a bola para definir direção e força. Vidas, fase e placar ficam sempre visíveis.", width / 2, y + boxH / 2 + 1);
}

// ============================================================
// Vidas / corações
// ============================================================
function drawLivesRow(x, y, count, size, showOutline = false) {
  const gap = size + 6;
  for (let i = 0; i < MAX_LIVES; i++) {
    drawHeart(x + i * gap, y, size, i < count, showOutline);
  }
}

function drawHeart(cx, cy, size, filled, showOutline) {
  push();
  translate(cx, cy);
  noStroke();

  if (filled) {
    fill(255, 76, 92);
  } else {
    fill(255, 255, 255, 48);
  }

  beginShape();
  vertex(0, size * 0.42);
  bezierVertex(-size * 0.9, -size * 0.08, -size * 0.7, -size * 1.0, 0, -size * 0.4);
  bezierVertex(size * 0.7, -size * 1.0, size * 0.9, -size * 0.08, 0, size * 0.42);
  endShape(CLOSE);

  if (showOutline) {
    noFill();
    stroke(255, 255, 255, 120);
    strokeWeight(1.5);
    beginShape();
    vertex(0, size * 0.42);
    bezierVertex(-size * 0.9, -size * 0.08, -size * 0.7, -size * 1.0, 0, -size * 0.4);
    bezierVertex(size * 0.7, -size * 1.0, size * 0.9, -size * 0.08, 0, size * 0.42);
    endShape(CLOSE);
  }

  pop();
}

// ============================================================
// Painéis e utilitários visuais
// ============================================================
function drawGlassPanel(x, y, w, h, radius = 24, opacityScale = 1) {
  noStroke();
  fill(0, 0, 0, 120 * opacityScale);
  rect(x + 8, y + 10, w, h, radius);

  fill(255, 255, 255, 20 * opacityScale);
  rect(x, y, w, h, radius);

  fill(255, 255, 255, 9 * opacityScale);
  rect(x + 2, y + 2, w - 4, 20, radius);
}

function drawDarkOverlay() {
  noStroke();
  fill(0, 0, 0, 132);
  rect(0, 0, width, height);
}

function drawImageCover(img, x, y, w, h) {
  if (!img) return;

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  image(img, x, y, w, h, sx, sy, sw, sh);
}

// ============================================================
// Área do gol
// ============================================================
function getGoalRect() {
  const phaseWidth = clamp(330 - (phase - 1) * 18, 220, min(330, width * 0.36));
  const h = min(field.goalHeight, max(96, height * 0.16));

  return {
    x: width / 2 - phaseWidth / 2,
    y: 100,
    w: phaseWidth,
    h,
  };
}

// ============================================================
// Lógica da bola
// ============================================================
function updateBall() {
  if (!ball.moving) return;

  ball.x += ball.vx;
  ball.y += ball.vy;

  const goal = getGoalRect();
  const keeperY = keeper.y;
  const keeperW = 70;
  const keeperH = 84;

  const nearKeeperY = ball.y + ball.r >= keeperY - keeperH / 2 && ball.y - ball.r <= keeperY + keeperH / 2;
  const keeperHit =
    ball.x + ball.r >= keeper.x - keeperW / 2 &&
    ball.x - ball.r <= keeper.x + keeperW / 2 &&
    nearKeeperY;

  if (keeperHit) {
    triggerKeeperDive(ball.x < keeper.x ? -1 : 1);
    playOptionalAudio(audio.save);
    resolveShotOutcome("O goleiro defendeu!", "bad");
    return;
  }

  const crossingGoalLine = ball.y - ball.r <= goal.y + goal.h;

  if (crossingGoalLine) {
    const insidePosts = ball.x > goal.x + ball.r && ball.x < goal.x + goal.w - ball.r;

    if (insidePosts) {
      score += 1;
      bestScore = max(bestScore, score);

      const newPhase = getPhaseFromScore(score);
      playOptionalAudio(audio.goal);

      if (newPhase !== phase) {
        phase = newPhase;
        feedbackBanner.show(`Fase ${phase} — ${getPhaseLabel(phase)}`, 100, "good");
      } else {
        feedbackBanner.show("GOL!", 60, "good");
      }

      resetBall();
      return;
    }

    resolveShotOutcome("Você errou o chute!", "bad");
    return;
  }

  if (ball.y < -40 || ball.x < -60 || ball.x > width + 60) {
    resolveShotOutcome("A bola saiu do campo!", "bad");
  }
}

function triggerKeeperDive(direction) {
  keeper.diveDir = direction >= 0 ? 1 : -1;
  keeper.diveTimer = 24;
}

function resolveShotOutcome(message, kind) {
  bestScore = max(bestScore, score);

  if (lives > 1) {
    lives -= 1;
    feedbackBanner.show(`${message}  -1 vida`, 110, kind);
    resetBall();
    return;
  }

  lives = 0;
  triggerGameOver(message);
}

function triggerGameOver(reason) {
  gameOverReason = reason;
  bestScore = max(bestScore, score);
  gameState = "gameover";
  ball.moving = false;
  stopOptionalAudio(audio.bg);
  playOptionalAudio(audio.lose);
  feedbackBanner.show("Fim de jogo", 120, "bad");
}

// ============================================================
// Entrada do usuário
// ============================================================
function mousePressed() {
  if (gameState === "start") {
    const btnStart = getStartButtonRect();
    const btnAbout = getAboutButtonRect();

    if (clickedButton(btnStart.x, btnStart.y, btnStart.w, btnStart.h)) startPlaying();
    if (clickedButton(btnAbout.x, btnAbout.y, btnAbout.w, btnAbout.h)) openAbout();
    return;
  }

  if (gameState === "about") {
    const back = getBackButtonRect();
    if (clickedButton(back.x, back.y, back.w, back.h)) backToMenu();
    return;
  }

  if (gameState === "gameover") {
    const btn = getRestartButtonRect();
    if (clickedButton(btn.x, btn.y, btn.w, btn.h)) startPlaying();
    return;
  }

  if (gameState !== "playing") return;

  const d = dist(mouseX, mouseY, ball.x, ball.y);
  if (d <= 48 && !ball.moving) {
    shot.dragging = true;
    shot.startX = ball.x;
    shot.startY = ball.y;
    shot.endX = mouseX;
    shot.endY = mouseY;
  }
}

function mouseDragged() {
  if (gameState === "playing" && shot.dragging) {
    const goal = getGoalRect();
    shot.endX = constrain(mouseX, goal.x - 150, goal.x + goal.w + 150);
    shot.endY = constrain(mouseY, goal.y - 120, height - 40);
  }
}

function mouseReleased() {
  if (gameState !== "playing" || !shot.dragging) return;

  shot.dragging = false;

  const dx = shot.endX - shot.startX;
  const dy = shot.endY - shot.startY;
  const dragDist = constrain(Math.sqrt(dx * dx + dy * dy), 0, 180);

  if (dragDist < 18 || dy > -4) return;

  const direction = createVector(dx, dy).normalize();
  const speed = map(dragDist, 18, 180, 11, 18);
  direction.mult(speed);

  ball.vx = direction.x;
  ball.vy = direction.y;
  ball.moving = true;
  player.kickTimer = 12;
  playOptionalAudio(audio.kick);
}

function keyPressed() {
  if (key === "Escape" && gameState === "about") {
    backToMenu();
    return;
  }

  if ((key === " " || keyCode === ENTER) && (gameState === "start" || gameState === "gameover")) {
    startPlaying();
  }

  if (key === "A" || key === "a") {
    if (gameState === "start") openAbout();
  }
}

function clickedButton(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

// ============================================================
// Utilitários gerais
// ============================================================
function clamp(value, minValue, maxValue) {
  return max(minValue, min(value, maxValue));
}

function createOptionalAudio(src, loop = false, volume = 0.5) {
  const el = new Audio();
  el.preload = "auto";
  el.loop = loop;
  el.volume = volume;
  el.src = src;
  el.addEventListener("error", () => {
    el._failed = true;
  });
  return el;
}

function playOptionalAudio(el, restart = true) {
  if (!el) return;

  try {
    if (restart) {
      el.pause();
      el.currentTime = 0;
    }

    const result = el.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch (err) {
    // Silencioso: o jogo continua mesmo sem os arquivos de áudio.
  }
}

function stopOptionalAudio(el) {
  if (!el) return;

  try {
    el.pause();
    el.currentTime = 0;
  } catch (err) {
    // ignore
  }
}
