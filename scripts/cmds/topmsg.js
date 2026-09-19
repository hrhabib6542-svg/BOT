const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

module.exports.config = {
  name: "topmsg",
  aliases: ["msglb", "msgtop", "topmessage"],
  version: "2.0",
  author: "HABIB | fix by BADHON-00",
  countDown: 10,
  role: 0,
  shortDescription: "Top 10 message count leaderboard",
  category: "box chat"
};

function formatCount(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return String(num);
}

function roundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
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
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

async function loadAvatar(uid, cacheDir) {
  const tmpPath = path.join(cacheDir, `av_${uid}_${Date.now()}.png`);
  try {
    const imageUrl = `https://graph.facebook.com/${uid}/picture?height=300&width=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    await fs.writeFile(tmpPath, response.data);
    const img = await loadImage(tmpPath);
    await fs.remove(tmpPath);
    return img;
  } catch (e) {
    if (await fs.pathExists(tmpPath)) await fs.remove(tmpPath);
    return null;
  }
}

function drawCircularAvatar(ctx, img, name, x, y, size, borderColor = "#ffffff") {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    const colors = ["#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#00bcd4", "#009688"];
    ctx.fillStyle = colors[(name || "?").charCodeAt(0) % colors.length];
    ctx.fillRect(x, y, size, size);
    ctx.font = `bold ${Math.floor(size * 0.45)}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((name || "?")[0].toUpperCase(), x + size / 2, y + size / 2);
  }
  ctx.restore();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 1, 0, Math.PI * 2);
  ctx.stroke();
}

module.exports.onStart = async function ({ api, event, threadsData, usersData }) {
  const { threadID, messageID } = event;

  const threadData = await threadsData.get(threadID);
  if (!threadData || !threadData.members) {
    return api.sendMessage("❌ এই গ্রুপের মেসেজ ডাটা পাওয়া যায়নি।", threadID, messageID);
  }

  let membersList = [];
  if (Array.isArray(threadData.members)) {
    membersList = threadData.members;
  } else {
    membersList = Object.entries(threadData.members).map(([id, val]) => ({ userID: id, ...val }));
  }

  const sorted = membersList
    .map(m => ({
      uid: m.userID,
      name: m.name || "Facebook User",
      count: m.count || 0
    }))
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (sorted.length === 0) {
    return api.sendMessage("⚠️ এই গ্রুপিংয়ে মেসেজ ডাটা যুক্ত কোনো ইউজার নেই।", threadID, messageID);
  }

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const avatars = await Promise.all(sorted.map(user => loadAvatar(user.uid, cacheDir)));

  const width = 800;
  const height = 900;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, "#0a0c1d");
  bgGrad.addColorStop(0.5, "#101432");
  bgGrad.addColorStop(1, "#0a0c1d");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * width;
    const sy = Math.random() * height;
    const sr = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#ffd700";
  ctx.fillText("👑 MESSAGE COUNT LEADERBOARD 👑", width / 2, 55);

  ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, 75);
  ctx.lineTo(width - 100, 75);
  ctx.stroke();

  const topPositions = [
    { rank: 1, x: 400, y: 180, size: 100, color: "#ffd700", label: "#1" },
    { rank: 2, x: 200, y: 210, size: 80, color: "#e0e0e0", label: "#2" },
    { rank: 3, x: 600, y: 210, size: 80, color: "#cd7f32", label: "#3" }
  ];

  const top3Indices = [0, 1, 2];
  top3Indices.forEach((idx) => {
    if (sorted[idx]) {
      const user = sorted[idx];
      const pos = topPositions[idx];
      const avatar = avatars[idx];

      drawCircularAvatar(ctx, avatar, user.name, pos.x - pos.size / 2, pos.y - pos.size / 2, pos.size, pos.color);

      ctx.fillStyle = pos.color;
      ctx.beginPath();
      ctx.arc(pos.x + pos.size / 2 - 10, pos.y - pos.size / 2 + 10, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pos.label, pos.x + pos.size / 2 - 10, pos.y - pos.size / 2 + 10);

      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 17px Arial";
      let shortName = user.name;
      if (shortName.length > 15) shortName = shortName.substring(0, 13) + "..";
      ctx.fillText(shortName, pos.x, pos.y + pos.size / 2 + 25);

      ctx.fillStyle = pos.color;
      ctx.font = "15px Arial";
      ctx.fillText(`${formatCount(user.count)} msgs`, pos.x, pos.y + pos.size / 2 + 45);
    }
  });

  const startY = 360;
  const rowHeight = 62;
  const barColors = ["#00e676", "#ff9100", "#ff4081", "#00e5ff", "#ab47bc", "#29b6f6", "#ffee58"];
  const maxCountInList = sorted[0] ? sorted[0].count : 1;

  for (let i = 3; i < sorted.length; i++) {
    const user = sorted[i];
    const avatar = avatars[i];
    const y = startY + (i - 3) * rowHeight;
    const color = barColors[(i - 3) % barColors.length];

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    roundRect(ctx, 40, y, width - 80, 52, 12, true);

    ctx.textAlign = "left";
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#a0a5c0";
    ctx.fillText(`#${i + 1}`, 60, y + 32);

    const avatarX = 110;
    const avatarY = y + 8;
    const avatarSize = 36;
    drawCircularAvatar(ctx, avatar, user.name, avatarX, avatarY, avatarSize, "rgba(255,255,255,0.2)");

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px Arial";
    let nameText = user.name;
    if (nameText.length > 18) nameText = nameText.substring(0, 16) + "..";
    ctx.fillText(nameText, 160, y + 32);

    const barX = 370;
    const barWidth = 260;
    const barH = 10;
    const progress = Math.min((user.count / maxCountInList) * barWidth, barWidth);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, y + 21, barWidth, barH, 5, true);

    if (progress > 0) {
      ctx.fillStyle = color;
      roundRect(ctx, barX, y + 21, Math.max(progress, 10), barH, 5, true);
    }

    ctx.textAlign = "right";
    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(formatCount(user.count), width - 60, y + 32);
  }

  ctx.textAlign = "center";
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillText("GOATBOT • MESSAGE LEADERBOARD", width / 2, height - 20);

  const filePath = path.join(cacheDir, `topmsg_${Date.now()}.png`);
  await fs.writeFile(filePath, canvas.toBuffer("image/png"));

  await api.sendMessage(
    { attachment: fs.createReadStream(filePath) },
    threadID,
    () => fs.remove(filePath),
    messageID
  );
};
