const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// ==================== MESSAGE STAT MODEL ====================
const msgStatSchema = new mongoose.Schema({
  threadID: { type: String, required: true },
  userID: { type: String, required: true },
  userName: { type: String, default: "Unknown" },
  total: { type: Number, default: 0 },
  text: { type: Number, default: 0 },
  image: { type: Number, default: 0 },
  video: { type: Number, default: 0 },
  voice: { type: Number, default: 0 },
  sticker: { type: Number, default: 0 },
  emoji: { type: Number, default: 0 },
  file: { type: Number, default: 0 },
  lastMessageAt: Number
});
msgStatSchema.index({ threadID: 1, userID: 1 }, { unique: true });
msgStatSchema.index({ threadID: 1, total: -1 });

const MessageStat = mongoose.models.DiabloMessageStat || mongoose.model("DiabloMessageStat", msgStatSchema);

// ==================== HELPERS ====================
function fmt(num) {
  num = Number(num) || 0;
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
  return num.toLocaleString();
}

function isEmojiOnly(str) {
  if (!str || typeof str !== "string") return false;
  const cleaned = str.replace(/\s+/g, "");
  if (!cleaned) return false;
  return /^[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]+$/u.test(cleaned);
}

function isStickerOnly(str) {
  if (!str || typeof str !== "string") return false;
  const cleaned = str.replace(/\s+/g, "");
  if (!cleaned || cleaned.length > 8) return false;
  return /^[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}]+$/u.test(cleaned);
}

async function loadAvatar(uid) {
  try {
    const url = `https://graph.facebook.com/${uid}/picture?height=400&width=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 6000 });
    return await loadImage(Buffer.from(res.data));
  } catch (e) {
    return null;
  }
}

function drawCircular(ctx, img, cx, cy, r) {
  if (!img) {
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ==================== DECORATION SHAPES (Canvas) ====================
function drawBubble(ctx, x, y, r, alpha = 0.15, color = "#a855f7") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Highlight
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawBalloon(ctx, x, y, r, alpha = 0.2, color = "#ec4899") {
  ctx.save();
  ctx.globalAlpha = alpha;
  // Balloon body (ellipse)
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // String
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.quadraticCurveTo(x + 5, y + r + 15, x, y + r + 30);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Highlight
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.18, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = alpha * 0.6;
  ctx.fill();
  ctx.restore();
}

function drawFlower(ctx, x, y, r, alpha = 0.18, color = "#f472b6") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  // 5 petals
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const px = x + Math.cos(angle) * r * 0.7;
    const py = y + Math.sin(angle) * r * 0.7;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.45, r * 0.6, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  // Center
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, x, y, r, alpha = 0.2, color = "#f43f5e") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.3);
  ctx.bezierCurveTo(x, y, x - r, y, x - r, y + r * 0.5);
  ctx.bezierCurveTo(x - r, y + r, x, y + r * 1.3, x, y + r * 1.5);
  ctx.bezierCurveTo(x, y + r * 1.3, x + r, y + r, x + r, y + r * 0.5);
  ctx.bezierCurveTo(x + r, y, x, y, x, y + r * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx, x, y, r, alpha = 0.3, color = "#fbbf24") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.25, y - r * 0.25);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.25, y + r * 0.25);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.25, y + r * 0.25);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.25, y - r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, x, y, r, alpha = 0.25, color = "#fbbf24") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = x + Math.cos(outerAngle) * r;
    const oy = y + Math.sin(outerAngle) * r;
    const ix = x + Math.cos(innerAngle) * r * 0.4;
    const iy = y + Math.sin(innerAngle) * r * 0.4;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ==================== BACKGROUND + DECORATIONS ====================
function drawGalaxyBg(ctx, W, H) {
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W);
  bgGrad.addColorStop(0, "#2a0a3e");
  bgGrad.addColorStop(0.5, "#1a0528");
  bgGrad.addColorStop(1, "#08000f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const neb1 = ctx.createRadialGradient(W * 0.3, H * 0.2, 50, W * 0.3, H * 0.2, 400);
  neb1.addColorStop(0, "rgba(150, 30, 180, 0.22)");
  neb1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, W, H);

  const neb2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 50, W * 0.8, H * 0.7, 400);
  neb2.addColorStop(0, "rgba(200, 50, 150, 0.18)");
  neb2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 180; i++) {
    const x = (i * 137.5 + 50) % W;
    const y = (i * 213.7 + 30) % H;
    const r = 0.5 + (i % 3) * 0.5;
    const a = 0.2 + (i % 5) * 0.12;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDecorations(ctx, W, H, seed = 1) {
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // â˜… 12-15 DECORATIONS LAYERED â€” Option B â˜…
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // ===== BIG SHAPES (background layer) =====
  drawBalloon(ctx, W * 0.1, H * 0.15, 42, 0.10, "#ec4899");
  drawBalloon(ctx, W * 0.92, H * 0.22, 38, 0.10, "#a855f7");
  drawBubble(ctx, W * 0.05, H * 0.55, 55, 0.08, "#a855f7");
  drawBubble(ctx, W * 0.95, H * 0.75, 65, 0.08, "#ec4899");

  drawFlower(ctx, W * 0.85, H * 0.1, 38, 0.12, "#f472b6");
  drawFlower(ctx, W * 0.15, H * 0.85, 42, 0.12, "#c084fc");

  drawHeart(ctx, W * 0.5, H * 0.05, 30, 0.12, "#f43f5e");
  drawHeart(ctx, W * 0.05, H * 0.05, 26, 0.10, "#f43f5e");
  drawHeart(ctx, W * 0.95, H * 0.5, 26, 0.10, "#a855f7");

  // ===== MEDIUM SHAPES =====
  drawStar(ctx, W * 0.25, H * 0.08, 22, 0.18, "#fbbf24");
  drawStar(ctx, W * 0.75, H * 0.92, 22, 0.18, "#fbbf24");
  drawSparkle(ctx, W * 0.08, H * 0.35, 18, 0.25, "#fbbf24");
  drawSparkle(ctx, W * 0.92, H * 0.35, 18, 0.25, "#fbbf24");
  drawSparkle(ctx, W * 0.5, H * 0.95, 16, 0.20, "#c084fc");

  // ===== SMALL SPARKLES (foreground overlay) =====
  drawSparkle(ctx, W * 0.18, H * 0.30, 10, 0.30);
  drawSparkle(ctx, W * 0.82, H * 0.60, 10, 0.30);
  drawSparkle(ctx, W * 0.35, H * 0.90, 10, 0.30);
  drawSparkle(ctx, W * 0.65, H * 0.15, 10, 0.30);
  drawStar(ctx, W * 0.42, H * 0.5, 10, 0.20);
  drawStar(ctx, W * 0.58, H * 0.78, 10, 0.20);

  // Corner flourishes
  drawFlower(ctx, 40, 40, 22, 0.15, "#a855f7");
  drawFlower(ctx, W - 40, H - 40, 22, 0.15, "#ec4899");
}

// ==================== PERSONAL CARD ====================
async function createPersonalCard({ userID, userName, stats, groupName }) {
  const W = 900, H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  drawGalaxyBg(ctx, W, H);

  // ===== HEADER =====
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 20;
  ctx.font = "bold 40px 'Segoe UI', sans-serif";
  ctx.fillText("ðŸ“Š MESSAGE STATS", W / 2, 62);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 20px 'Segoe UI', sans-serif";
  ctx.fillText(groupName, W / 2, 95);

  // Divider
  const lineGrad = ctx.createLinearGradient(150, 0, W - 150, 0);
  lineGrad.addColorStop(0, "rgba(168,85,247,0)");
  lineGrad.addColorStop(0.5, "#a855f7");
  lineGrad.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(150, 115, W - 300, 2);

  // ===== AVATAR =====
  const avatar = await loadAvatar(userID);
  const avY = 215;
  const avR = 85;

  // Glow ring
  ctx.save();
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 40;
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, avY, avR + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawCircular(ctx, avatar, W / 2, avY, avR);

  // Inner border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, avY, avR, 0, Math.PI * 2);
  ctx.stroke();

  // ===== NAME =====
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 10;
  ctx.font = "bold 38px 'Segoe UI', sans-serif";
  const name = userName.length > 22 ? userName.slice(0, 22) + "â€¦" : userName;
  ctx.fillText(name, W / 2, avY + avR + 55);
  ctx.shadowBlur = 0;

  // ===== BREAKDOWN BOX =====
  const boxX = 60;
  const boxY = 400;
  const boxW = W - 120;
  const boxH = 290;

  // Box bg
  ctx.fillStyle = "rgba(20,5,35,0.9)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(168,85,247,0.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.stroke();

  // Title
  ctx.textAlign = "left";
  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 26px 'Segoe UI', sans-serif";
  ctx.fillText("ðŸ“ˆ BREAKDOWN", boxX + 35, boxY + 45);

  // Divider
  ctx.fillStyle = "rgba(168,85,247,0.3)";
  ctx.fillRect(boxX + 35, boxY + 60, boxW - 70, 1.5);

  // Categories
  const cats = [
    { label: "ðŸ“ Total Messages", value: stats.total,    color: "#a855f7" },
    { label: "ðŸ˜€ Emoji",          value: stats.emoji,    color: "#ec4899" },
    { label: "ðŸŽ¨ Sticker",        value: stats.sticker,  color: "#c084fc" },
    { label: "ðŸ–¼ï¸ Media",          value: stats.image + stats.video, color: "#4ade80" },
    { label: "ðŸŽ¤ Voice",          value: stats.voice,    color: "#fbbf24" },
    { label: "ðŸ“Ž File",           value: stats.file,     color: "#60a5fa" }
  ];

  for (let i = 0; i < cats.length; i++) {
    const y = boxY + 105 + i * 32;
    const cat = cats[i];

    // Label
    ctx.textAlign = "left";
    ctx.fillStyle = cat.color;
    ctx.font = "bold 22px 'Segoe UI', sans-serif";
    ctx.fillText(cat.label, boxX + 35, y);

    // Value
    ctx.textAlign = "right";
    const valText = cat.value === 0 ? "chipa baj" : fmt(cat.value);
    ctx.fillStyle = cat.value === 0 ? "#64748b" : "#ffffff";
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    ctx.fillText(valText, boxX + boxW - 35, y);
  }

  // ===== DECORATIONS (foreground) =====
  drawDecorations(ctx, W, H);

  // ===== WATERMARK =====
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(168,85,247,0.6)";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.fillText("Â© DI_ABLO", 30, H - 20);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cardPath = path.join(cacheDir, `topmsg_my_${Date.now()}.png`);
  await fs.writeFile(cardPath, canvas.toBuffer("image/png"));
  return cardPath;
}

// ==================== LEADERBOARD CARD ====================
async function createLeaderboardCard({ stats, page, totalPages, groupName, startRank }) {
  const ROW_H = 80;
  const HEADER_H = 130;
  const FOOTER_H = 90;
  const W = 950;
  const H = HEADER_H + stats.length * ROW_H + FOOTER_H;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  drawGalaxyBg(ctx, W, H);

  // ===== HEADER =====
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 25;
  ctx.font = "bold 44px 'Segoe UI', sans-serif";
  ctx.fillText("ðŸ† TOP MESSAGES", W / 2, 70);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText(groupName, W / 2, 105);

  // Divider
  const lineGrad = ctx.createLinearGradient(150, 0, W - 150, 0);
  lineGrad.addColorStop(0, "rgba(168,85,247,0)");
  lineGrad.addColorStop(0.5, "#a855f7");
  lineGrad.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(150, 120, W - 300, 2);

  // ===== PRE-LOAD AVATARS =====
  const avatars = {};
  await Promise.all(stats.map(async (s) => {
    avatars[s.userID] = await loadAvatar(s.userID);
  }));

  const maxTotal = Math.max(...stats.map(s => s.total), 1);

  // ===== ROWS =====
  for (let i = 0; i < stats.length; i++) {
    const u = stats[i];
    const rank = startRank + i;
    const rowY = HEADER_H + i * ROW_H;
    const rowX = 40;
    const rowW = W - 80;
    const rowH = ROW_H - 12;

    // Row bg
    const isTop3 = rank <= 3;
    const rowGrad = ctx.createLinearGradient(rowX, 0, rowX + rowW, 0);
    if (rank === 1) {
      rowGrad.addColorStop(0, "rgba(251,191,36,0.25)");
      rowGrad.addColorStop(1, "rgba(251,191,36,0.05)");
    } else if (rank === 2) {
      rowGrad.addColorStop(0, "rgba(226,232,240,0.20)");
      rowGrad.addColorStop(1, "rgba(226,232,240,0.05)");
    } else if (rank === 3) {
      rowGrad.addColorStop(0, "rgba(251,146,60,0.20)");
      rowGrad.addColorStop(1, "rgba(251,146,60,0.05)");
    } else {
      rowGrad.addColorStop(0, "rgba(20,5,35,0.8)");
      rowGrad.addColorStop(1, "rgba(20,5,35,0.6)");
    }
    ctx.fillStyle = rowGrad;
    roundRect(ctx, rowX, rowY, rowW, rowH, 14);
    ctx.fill();

    // Border
    let borderColor = "rgba(168,85,247,0.3)";
    if (rank === 1) borderColor = "#fbbf24";
    else if (rank === 2) borderColor = "#e2e8f0";
    else if (rank === 3) borderColor = "#fb923c";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isTop3 ? 2.5 : 1.5;
    roundRect(ctx, rowX, rowY, rowW, rowH, 14);
    ctx.stroke();

    // Rank
    ctx.textAlign = "left";
    ctx.fillStyle = isTop3 ? borderColor : "#a855f7";
    if (isTop3) {
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = 15;
    }
    ctx.font = "bold 32px 'Segoe UI', sans-serif";
    ctx.fillText(`#${rank}`, rowX + 30, rowY + 48);
    ctx.shadowBlur = 0;

    // Avatar
    const avX = rowX + 115;
    const avY = rowY + 34;
    const avR = 26;

    if (avatars[u.userID]) {
      drawCircular(ctx, avatars[u.userID], avX, avY, avR);
    }
    ctx.strokeStyle = isTop3 ? borderColor : "rgba(168,85,247,0.6)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI * 2);
    ctx.stroke();

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    const name = u.userName.length > 22 ? u.userName.slice(0, 22) + "â€¦" : u.userName;
    ctx.fillText(name, rowX + 160, rowY + 44);

    // Progress bar
    const barX = rowX + 470;
    const barW = 320;
    const barH = 14;
    const barY = rowY + 27;
    const ratio = Math.min(1, u.total / maxTotal);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundRect(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, "#a855f7");
    barGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = barGrad;
    roundRect(ctx, barX, barY, Math.max(12, ratio * barW), barH, 7);
    ctx.fill();

    // Value
    ctx.textAlign = "right";
    ctx.fillStyle = isTop3 ? borderColor : "#ec4899";
    if (isTop3) {
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = 15;
    }
    ctx.font = "bold 30px 'Segoe UI', sans-serif";
    ctx.fillText(fmt(u.total), rowX + rowW - 30, rowY + 48);
    ctx.shadowBlur = 0;
  }

  // ===== FOOTER =====
  const footY = H - FOOTER_H + 25;

  ctx.fillStyle = "rgba(168,85,247,0.15)";
  roundRect(ctx, 40, footY - 10, W - 80, 60, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(168,85,247,0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 40, footY - 10, W - 80, 60, 14);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'Segoe UI', sans-serif";
  ctx.fillText(`ðŸ“„ Page ${page} / ${totalPages}`, W / 2, footY + 15);

  if (totalPages > 1) {
    ctx.fillStyle = "#c084fc";
    ctx.font = "italic 14px 'Segoe UI', sans-serif";
    ctx.fillText("Reply with 'next' to see next page", W / 2, footY + 38);
  }

  // ===== DECORATIONS =====
  drawDecorations(ctx, W, H);

  // ===== WATERMARK =====
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(168,85,247,0.6)";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.fillText("Â© DI_ABLO", 25, H - 15);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cardPath = path.join(cacheDir, `topmsg_all_${Date.now()}.png`);
  await fs.writeFile(cardPath, canvas.toBuffer("image/png"));
  return cardPath;
}

// ==================== MODULE ====================
module.exports = {
  config: {
    name: "topmsg",
    aliases: ["topmessages", "msgstats", "mymsg", "mymsglist"],
    version: "3.0.0",
    author: "DI_ABLO",
    countDown: 8,
    role: 0,
    shortDescription: "ðŸ† Message leaderboard + personal stats",
    category: "utility",
    guide: {
      en:
        "{p}topmsg - Your stats\n" +
        "{p}topmsg @user - User's stats\n" +
        "{p}topmsg (reply) - Reply user's stats\n" +
        "{p}topmsg all - Group leaderboard\n" +
        "Reply with 'next' for next page"
    }
  },

  // ==================== MESSAGE TRACKING ====================
  onChat: async function ({ event, api }) {
    try {
      const { threadID, senderID, body, attachments } = event;
      if (!threadID || !senderID) return;
      if (String(senderID) === String(api.getCurrentUserID())) return;
      if (!body && (!attachments || attachments.length === 0)) return;
      if (String(threadID) === String(senderID)) return;

      let type = "text";
      const attach = attachments && attachments[0];
      if (attach) {
        const t = (attach.type || "").toLowerCase();
        if (t.includes("photo") || t.includes("image")) type = "image";
        else if (t.includes("video")) type = "video";
        else if (t.includes("audio") || t.includes("voice")) type = "voice";
        else if (t.includes("sticker")) type = "sticker";
        else if (t.includes("file")) type = "file";
        else type = "image";
      } else if (isStickerOnly(body)) {
        type = "sticker";
      } else if (isEmojiOnly(body)) {
        type = "emoji";
      }

      global._msgNameCache = global._msgNameCache || {};
      let userName = global._msgNameCache[senderID];
      if (!userName) {
        try {
          const info = await api.getUserInfo(senderID);
          userName = info[senderID]?.name || "Unknown";
          global._msgNameCache[senderID] = userName;
        } catch (e) { userName = "Unknown"; }
      }

      await MessageStat.updateOne(
        { threadID: String(threadID), userID: String(senderID) },
        { $inc: { total: 1, [type]: 1 }, $set: { userName, lastMessageAt: Date.now() } },
        { upsert: true }
      );
    } catch (e) {}
  },

  // ==================== MAIN COMMAND ====================
  onStart: async function ({ api, event, args, message }) {
    const sendMsg = (txt) => message?.reply ? message.reply(txt) : api.sendMessage(txt, event.threadID, event.messageID);
    const { senderID, threadID, mentions, messageReply } = event;

    try {
      const sub = (args[0] || "").toLowerCase();

      let groupName = "DI-ABLO Group";
      try {
        const tInfo = await api.getThreadInfo(threadID);
        groupName = tInfo.threadName || groupName;
      } catch (e) {}

      // ============ LEADERBOARD (!topmsg all) ============
      if (sub === "all") {
        const allStats = await MessageStat.find({ threadID: String(threadID), total: { $gt: 0 } })
          .sort({ total: -1 })
          .lean();

        if (allStats.length === 0) return sendMsg("âŒ É´á´ á´á´‡êœ±êœ±á´€É¢á´‡êœ± á´›Ê€á´€á´„á´‹á´‡á´… Êá´‡á´›!");

        const ITEMS_PER_PAGE = 10;
        const totalPages = Math.ceil(allStats.length / ITEMS_PER_PAGE);
        const pageItems = allStats.slice(0, ITEMS_PER_PAGE);

        const processingMsg = await message.reply("â³ ÊŸá´á´€á´…ÉªÉ´É¢ ÊŸá´‡á´€á´…á´‡Ê€Ê™á´á´€Ê€á´…...");

        const cardPath = await createLeaderboardCard({
          stats: pageItems,
          page: 1,
          totalPages,
          groupName,
          startRank: 1
        });

        try { await message.unsend(processingMsg.messageID); } catch (e) {}

        const info = await api.sendMessage({
          body: `TOP MESSAGES â€¢ Page 1/${totalPages}`,
          attachment: fs.createReadStream(cardPath)
        }, threadID, () => {
          if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath);
        }, event.messageID);

        if (info && info.messageID && global.GoatBot?.onReply) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID,
            page: 1,
            totalPages,
            threadID,
            type: "nextPage"
          });
        }
        return;
      }

      // ============ PERSONAL CARD ============
      let targetID = senderID;
      if (mentions && Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
      else if (messageReply && messageReply.senderID) targetID = messageReply.senderID;

      const stat = await MessageStat.findOne({ threadID: String(threadID), userID: String(targetID) });

      if (!stat || stat.total === 0) {
        return sendMsg("âŒ É´á´ á´á´‡êœ±êœ±á´€É¢á´‡êœ± á´›Ê€á´€á´„á´‹á´‡á´… Êá´‡á´› êœ°á´Ê€ á´›ÊœÉªêœ± á´œêœ±á´‡Ê€!");
      }

      const processingMsg = await message.reply("â³ ÊŸá´á´€á´…ÉªÉ´É¢ êœ±á´›á´€á´›êœ±...");

      const cardPath = await createPersonalCard({
        userID: stat.userID,
        userName: stat.userName,
        stats: {
          total: stat.total,
          text: stat.text,
          image: stat.image,
          video: stat.video,
          voice: stat.voice,
          sticker: stat.sticker,
          emoji: stat.emoji,
          file: stat.file
        },
        groupName
      });

      try { await message.unsend(processingMsg.messageID); } catch (e) {}

      return api.sendMessage({
        body: `ðŸ“Š **${stat.userName}**'s Message Stats`,
        attachment: fs.createReadStream(cardPath)
      }, threadID, () => {
        if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath);
      }, event.messageID);

    } catch (err) {
      console.error("TopMsg Error:", err);
      return sendMsg("âŒ á´›á´á´˜á´êœ±É¢ á´‡Ê€Ê€á´Ê€!");
    }
  },

  // ==================== ON REPLY (next page) ====================
  onReply: async function ({ api, event, message, Reply }) {
    try {
      if (!Reply || Reply.type !== "nextPage") return;
      const { senderID, threadID, body } = event;
      if (String(senderID) !== String(Reply.author)) return;

      const cmd = (body || "").toLowerCase().trim();
      if (!["next", "n", "nxt"].includes(cmd)) return;

      const nextPage = Reply.page + 1;
      if (nextPage > Reply.totalPages) return message.reply("âŒ É´á´ á´á´Ê€á´‡ á´˜á´€É¢á´‡êœ±!");

      const allStats = await MessageStat.find({ threadID: String(threadID), total: { $gt: 0 } })
        .sort({ total: -1 })
        .lean();

      const ITEMS_PER_PAGE = 10;
      const startIdx = (nextPage - 1) * ITEMS_PER_PAGE;
      const pageItems = allStats.slice(startIdx, startIdx + ITEMS_PER_PAGE);

      let groupName = "DI-ABLO Group";
      try {
        const tInfo = await api.getThreadInfo(threadID);
        groupName = tInfo.threadName || groupName;
      } catch (e) {}

      const processingMsg = await message.reply(`â³ ÊŸá´á´€á´…ÉªÉ´É¢ á´˜á´€É¢á´‡ ${nextPage}...`);

      const cardPath = await createLeaderboardCard({
        stats: pageItems,
        page: nextPage,
        totalPages: Reply.totalPages,
        groupName,
        startRank: startIdx + 1
      });

      try { await message.unsend(processingMsg.messageID); } catch (e) {}

      const info = await api.sendMessage({
        body: `TOP MESSAGES â€¢ Page ${nextPage}/${Reply.totalPages}`,
        attachment: fs.createReadStream(cardPath)
      }, threadID, () => {
        if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath);
      }, event.messageID);

      if (info && info.messageID && global.GoatBot?.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "topmsg",
          messageID: info.messageID,
          author: senderID,
          page: nextPage,
          totalPages: Reply.totalPages,
          threadID,
          type: "nextPage"
        });
      }
    } catch (err) {
      console.error("TopMsg onReply Error:", err);
    }
  }
};
