 const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const OWNER_UID = "100073798820230";
const WATERMARK_TEXT = "DI-ABLO";

const dataDir = path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const accessFile = path.join(dataDir, "asianwaifuAccess.json");

const cacheDir = path.join(__dirname, "..", "..", "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

function loadAllowed() {
  try { return JSON.parse(fs.readFileSync(accessFile, "utf8")); } catch { return []; }
}
function saveAllowed(list) {
  fs.writeFileSync(accessFile, JSON.stringify(list));
}
function hasAccess(uid) {
  if (uid === OWNER_UID) return true;
  return loadAllowed().includes(uid);
}

// 
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function applyWatermark(imageUrl) {
  const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const img = await loadImage(Buffer.from(res.data));

  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, img.width, img.height);

  //
  const fontSize = Math.max(14, Math.round(img.width * 0.028));
  ctx.font = `bold ${fontSize}px Sans`;
  const textWidth = ctx.measureText(WATERMARK_TEXT).width;

  const paddingX = fontSize * 0.6;
  const paddingY = fontSize * 0.45;
  const pillW = textWidth + paddingX * 2;
  const pillH = fontSize + paddingY * 2;
  const margin = Math.round(img.width * 0.02);

  const x = img.width - pillW - margin;
  const y = img.height - pillH - margin;

  //
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fill();

  //
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(WATERMARK_TEXT, x + paddingX, y + pillH / 2);

  const filePath = path.join(cacheDir, `waifu_${Date.now()}.jpg`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/jpeg", { quality: 0.9 }));
  return filePath;
}

const imageLinks = [
  "https://files.catbox.moe/asebgf.jpg",
  "https://files.catbox.moe/zle9er.jpg",
  "https://files.catbox.moe/42j4ro.jpg",
  "https://files.catbox.moe/hhrk2x.jpg",
  "https://files.catbox.moe/9gm7ww.jpg",
  "https://files.catbox.moe/rknodx.jpg",
  "https://files.catbox.moe/kyvmoq.jpg",
  "https://files.catbox.moe/a28d91.jpg",
  "https://files.catbox.moe/l51ecr.jpg",
  "https://files.catbox.moe/305co6.jpg",
  "https://files.catbox.moe/l65337.jpg",
  "https://files.catbox.moe/tipqd0.jpg",
  "https://files.catbox.moe/kusx50.jpg",
  "https://files.catbox.moe/ttubhe.jpg",
  "https://files.catbox.moe/udba6f.jpg",
  "https://files.catbox.moe/cccb1o.jpg",
  "https://files.catbox.moe/wunk0s.jpg",
  "https://files.catbox.moe/9h1auj.jpg",
  "https://files.catbox.moe/te8l7t.jpg",
  "https://files.catbox.moe/punf74.jpg",
  "https://files.catbox.moe/z9e6ql.jpg",
  "https://files.catbox.moe/fo2xpa.jpg",
  "https://files.catbox.moe/sfof27.jpg",
  "https://files.catbox.moe/hq4e69.jpg",
  "https://files.catbox.moe/iwj91e.jpg",
  "https://files.catbox.moe/y82dni.jpg",
  "https://files.catbox.moe/tyoi2l.jpg",
  "https://files.catbox.moe/h6jkb5.jpg",
  "https://files.catbox.moe/ya78cw.jpg",
  "https://files.catbox.moe/38rshj.jpg",
  "https://files.catbox.moe/u4c5hr.jpg",
  "https://files.catbox.moe/asdwuj.jpg",
  "https://files.catbox.moe/51vl35.jpg",
  "https://files.catbox.moe/jqfd8t.jpg",
  "https://files.catbox.moe/5xv35k.jpg",
  "https://files.catbox.moe/acd0mg.jpg",
  "https://files.catbox.moe/luivde.jpg",
  "https://files.catbox.moe/i4ymm6.jpg",
  "https://files.catbox.moe/bcobj6.jpg",
  "https://files.catbox.moe/5kc33m.jpg",
  "https://files.catbox.moe/36luok.jpg",
  "https://files.catbox.moe/d521v9.jpg",
  "https://files.catbox.moe/2dbcza.jpg",
  "https://files.catbox.moe/swrw1z.jpg",
  "https://files.catbox.moe/8bufam.jpg",
  "https://files.catbox.moe/go5zza.jpg",
  "https://files.catbox.moe/5f8ywh.jpg",
  "https://files.catbox.moe/gi88bj.jpg",
  "https://files.catbox.moe/3cnog3.jpg",
  "https://files.catbox.moe/vyrk6g.jpg",
  "https://files.catbox.moe/1qnncs.jpg",
  "https://files.catbox.moe/qz4ri5.jpg",
  "https://files.catbox.moe/fg8olr.jpg",
  "https://files.catbox.moe/x4a1ij.jpg",
  "https://files.catbox.moe/xy5ppr.jpg",
  "https://files.catbox.moe/mdrub2.jpg",
  "https://files.catbox.moe/2p5da6.jpg",
  "https://files.catbox.moe/lc5k8r.jpg",
  "https://files.catbox.moe/02ustt.jpg",
  "https://files.catbox.moe/k3hhz6.jpg",
  "https://files.catbox.moe/4nbq7x.jpg",
  "https://files.catbox.moe/wm1nx0.jpg",
  "https://files.catbox.moe/gqc4v6.jpg",
  "https://files.catbox.moe/7i5k3f.jpg",
  "https://files.catbox.moe/0kukng.jpg",
  "https://files.catbox.moe/jphibx.jpg",
  "https://files.catbox.moe/44et5d.jpg",
  "https://files.catbox.moe/40qtn9.jpg",
  "https://files.catbox.moe/c7rfc8.jpg",
  "https://files.catbox.moe/ryu3a0.jpg",
  "https://files.catbox.moe/5nbmdd.jpg",
  "https://files.catbox.moe/5bqv52.jpg",
  "https://files.catbox.moe/4el8q0.jpg",
  "https://files.catbox.moe/sj6ox6.jpg",
  "https://files.catbox.moe/05kd6d.jpg",
  "https://files.catbox.moe/3o2nwq.jpg",
  "https://files.catbox.moe/zkrdgc.jpg",
  "https://files.catbox.moe/q06i5m.jpg",
  "https://files.catbox.moe/ebfy8o.jpg",
  "https://files.catbox.moe/yeqcet.jpg",
  "https://files.catbox.moe/48ae9e.jpg",
  "https://files.catbox.moe/jx3ve1.jpg",
  "https://files.catbox.moe/pi072k.jpg",
  "https://files.catbox.moe/ox00zi.jpg",
  "https://files.catbox.moe/y8y3v8.jpg",
  "https://files.catbox.moe/onrs6x.jpg",
  "https://files.catbox.moe/n27jsi.jpg",
  "https://files.catbox.moe/xm9gv1.jpg",
  "https://files.catbox.moe/fjznif.jpg",
  "https://files.catbox.moe/wpbicr.jpg",
  "https://files.catbox.moe/lwo0jw.jpg",
  "https://files.catbox.moe/jolxbf.jpg",
  "https://files.catbox.moe/7z9acn.jpg",
  "https://files.catbox.moe/fk8cpl.jpg",
  "https://files.catbox.moe/vxlzzo.jpg",
  "https://files.catbox.moe/kgbjhy.jpg",
  "https://files.catbox.moe/on3j7l.jpg",
  "https://files.catbox.moe/i0wxa8.jpg",
  "https://files.catbox.moe/c2jtz4.jpg",
  "https://files.catbox.moe/yvqk8j.jpg",
  "https://files.catbox.moe/l7o9zq.jpg",
  "https://files.catbox.moe/u252c2.jpg",
  "https://files.catbox.moe/pjzbmd.jpg",
  "https://files.catbox.moe/dm32fa.jpg",
  "https://files.catbox.moe/mp0xgx.jpg",
  "https://files.catbox.moe/bs158c.jpg",
  "https://files.catbox.moe/5jht16.jpg",
  "https://files.catbox.moe/mc06gh.jpg",
  "https://files.catbox.moe/mbxgc9.jpg",
  "https://files.catbox.moe/ovi510.jpg",
  "https://files.catbox.moe/zrpwnm.jpg",
  "https://files.catbox.moe/dikgox.jpg",
  "https://files.catbox.moe/52q0en.jpg",
  "https://files.catbox.moe/8oq2z5.jpg",
  "https://files.catbox.moe/a2d8m0.jpg",
  "https://files.catbox.moe/z4j2gy.jpg",
  "https://files.catbox.moe/0n9525.jpg",
  "https://files.catbox.moe/6wyx6r.jpg",
  "https://files.catbox.moe/ludjjd.jpg",
  "https://files.catbox.moe/2dxbce.jpg",
  "https://files.catbox.moe/vf6uih.jpg",
  "https://files.catbox.moe/uurp70.jpg",
  "https://files.catbox.moe/mhfqly.jpg",
  "https://files.catbox.moe/tc3g6f.jpg",
  "https://files.catbox.moe/hmj2kw.jpg",
  "https://files.catbox.moe/wx2wot.jpg",
  "https://files.catbox.moe/rrl5q7.jpg",
  "https://files.catbox.moe/4y544o.jpg",
  "https://files.catbox.moe/5a052p.jpg",
  "https://files.catbox.moe/uripbo.jpg",
  "https://files.catbox.moe/yeifle.jpg",
  "https://files.catbox.moe/s9npm0.jpg",
  "https://files.catbox.moe/xhvu1u.jpg",
  "https://files.catbox.moe/uousbo.jpg",
  "https://files.catbox.moe/uukido.jpg",
  "https://files.catbox.moe/v2q9dj.jpg",
  "https://files.catbox.moe/92kfo0.jpg",
  "https://files.catbox.moe/9m1mou.jpg",
  "https://files.catbox.moe/hhmyuj.png",
  "https://files.catbox.moe/0nhevr.jpg",
  "https://files.catbox.moe/vp7422.jpg",
  "https://files.catbox.moe/1kt7r7.jpg",
  "https://files.catbox.moe/2xhact.jpg",
  "https://files.catbox.moe/10pz5n.jpg",
  "https://files.catbox.moe/bhcvd0.jpg",
  "https://files.catbox.moe/cd8slv.jpg",
  "https://files.catbox.moe/lv8dnp.jpg",
  "https://files.catbox.moe/xku4ha.jpg",
  "https://files.catbox.moe/ulwn1o.jpg",
  "https://files.catbox.moe/3rd1dc.jpg",
  "https://files.catbox.moe/ocyaf6.jpg",
  "https://files.catbox.moe/5miefp.jpg",
  "https://files.catbox.moe/q6gp8j.jpg",
  "https://files.catbox.moe/ny12jg.jpg",
  "https://files.catbox.moe/ykykiz.jpg",
  "https://files.catbox.moe/6pf410.jpg",
  "https://files.catbox.moe/axwfy6.jpg",
  "https://files.catbox.moe/4b35kc.jpg",
  "https://files.catbox.moe/f8fpq9.jpg",
  "https://files.catbox.moe/5esyas.jpg",
  "https://files.catbox.moe/22512i.jpg",
  "https://files.catbox.moe/3uwdur.jpg",
  "https://files.catbox.moe/gr9e9i.jpg",
  "https://files.catbox.moe/727hdr.jpg",
  "https://files.catbox.moe/zvrpjl.jpg",
  "https://files.catbox.moe/msayra.jpg",
  "https://files.catbox.moe/lhmde2.jpg",
  "https://files.catbox.moe/8gmytd.jpg",
  "https://files.catbox.moe/ylxhrl.jpg",
  "https://files.catbox.moe/cu6did.jpg",
  "https://files.catbox.moe/98921m.jpg",
  "https://files.catbox.moe/yytew9.jpg",
  "https://files.catbox.moe/b4fobp.jpg",
  "https://files.catbox.moe/0nne6x.jpg",
  "https://files.catbox.moe/k1idil.jpg",
  "https://files.catbox.moe/j44gkm.jpg",
  "https://files.catbox.moe/wpcvqp.jpg",
  "https://files.catbox.moe/fubr8z.jpg",
  "https://files.catbox.moe/wnmxxo.jpg",
  "https://files.catbox.moe/malrbv.jpg",
  "https://files.catbox.moe/1p8si1.jpg",
  "https://files.catbox.moe/vbpavo.jpg",
  "https://files.catbox.moe/bp87dz.jpg",
  "https://files.catbox.moe/cin2ll.jpg",
  "https://files.catbox.moe/oi9p8l.jpg",
  "https://files.catbox.moe/5ikvt7.jpg",
  "https://files.catbox.moe/4hhcd8.jpg",
  "https://files.catbox.moe/xxfnq6.jpg",
  "https://files.catbox.moe/tm60ce.jpg",
  "https://files.catbox.moe/u7ryf8.jpg",
  "https://files.catbox.moe/guqfg6.jpg",
  "https://files.catbox.moe/fgaent.jpg",
  "https://files.catbox.moe/u0t8qp.jpg",
  "https://files.catbox.moe/ayrhin.jpg",
  "https://files.catbox.moe/f5jol2.jpg",
  "https://files.catbox.moe/6pego7.jpg",
  "https://files.catbox.moe/vvv99g.jpg",
  "https://files.catbox.moe/fo62rz.jpg",
  "https://files.catbox.moe/kd4gxg.jpg",
  "https://files.catbox.moe/nr0r9g.jpg",
  "https://files.catbox.moe/snxqpf.jpg",
  "https://files.catbox.moe/m5xw04.jpg",
  "https://files.catbox.moe/9n4zdn.jpg",
  "https://files.catbox.moe/06yfih.jpg",
  "https://files.catbox.moe/gmcsj2.jpg",
  "https://files.catbox.moe/q2ipx1.jpg",
  "https://files.catbox.moe/dewb4j.jpg",
  "https://files.catbox.moe/ccabmp.jpg",
  "https://files.catbox.moe/p2ano5.jpg",
  "https://files.catbox.moe/tzdpp3.jpg",
  "https://files.catbox.moe/h7lq4n.jpg",
  "https://files.catbox.moe/eu1s6j.jpg",
  "https://files.catbox.moe/4q7kk5.jpg",
  "https://files.catbox.moe/d6odz9.jpg",
  "https://files.catbox.moe/eu1yin.jpg",
  "https://files.catbox.moe/fxxpyd.jpg",
  "https://files.catbox.moe/fyyd4k.jpg",
  "https://files.catbox.moe/o88kiv.jpg",
  "https://files.catbox.moe/es4xar.jpg",
  "https://files.catbox.moe/w1klqz.jpg",
  "https://files.catbox.moe/uxfscj.jpg",
  "https://files.catbox.moe/3xui27.jpg",
  "https://files.catbox.moe/awg3s3.jpg",
  "https://files.catbox.moe/awizn0.jpg",
  "https://files.catbox.moe/drspud.png",
  "https://files.catbox.moe/ybuj5z.jpg",
  "https://files.catbox.moe/80sa26.jpg",
  "https://files.catbox.moe/4vibi8.jpg",
  "https://files.catbox.moe/unreid.jpg",
  "https://files.catbox.moe/g9lrbt.jpg",
  "https://files.catbox.moe/5tb0b2.jpg",
  "https://files.catbox.moe/eivsuq.jpg",
  "https://files.catbox.moe/momvv3.jpg",
  "https://files.catbox.moe/9aa53f.jpg",
  "https://files.catbox.moe/odtm5t.jpg",
  "https://files.catbox.moe/i9hpy8.jpg"
];

module.exports = {
  config: {
    name: "asianwaifu",
    aliases: "asfu",
    version: "2.0",
    author: "Protik Shah",
    role: 0,
    category: "fun",
    guide: {
      en: "{p}asianwaifu - Get a random asian girl pic (permission only).\n{p}asianwaifu add <uid> - Grant access (owner only).\n{p}asianwaifu remove <uid> - Revoke access (owner only).\n{p}asianwaifu list - Show who has access (owner only)."
    }
  },

  onStart: async function ({ api, event, args }) {
    const senderID = event.senderID;
    const sub = (args[0] || "").toLowerCase();

    if (sub === "add" || sub === "remove" || sub === "list") {
      if (senderID !== OWNER_UID) {
        return api.sendMessage("এই কমান্ড শুধু বট মালিক ব্যবহার করতে পারবে।", event.threadID, event.messageID);
      }
      let allowed = loadAllowed();

      if (sub === "add") {
        const uid = args[1];
        if (!uid) return api.sendMessage("UID দে: !asianwaifu add <uid>", event.threadID, event.messageID);
        if (uid === OWNER_UID) return api.sendMessage("তুই তো এমনিতেই owner।", event.threadID, event.messageID);
        if (allowed.includes(uid)) return api.sendMessage("আগে থেকেই পারমিশন আছে।", event.threadID, event.messageID);
        allowed.push(uid);
        saveAllowed(allowed);
        return api.sendMessage(`✅ পারমিশন দেওয়া হলো: ${uid}`, event.threadID, event.messageID);
      }

      if (sub === "remove") {
        const uid = args[1];
        if (!uid) return api.sendMessage("UID দে: !asianwaifu remove <uid>", event.threadID, event.messageID);
        if (!allowed.includes(uid)) return api.sendMessage("এই UID-এর পারমিশন নাই।", event.threadID, event.messageID);
        allowed = allowed.filter(id => id !== uid);
        saveAllowed(allowed);
        return api.sendMessage(`❌ পারমিশন কেটে দেওয়া হলো: ${uid}`, event.threadID, event.messageID);
      }

      if (sub === "list") {
        if (allowed.length === 0) return api.sendMessage("Owner ছাড়া কাউকে পারমিশন দেওয়া হয়নি।", event.threadID, event.messageID);
        return api.sendMessage(`পারমিশনপ্রাপ্ত UID সমূহ:\n${allowed.join("\n")}`, event.threadID, event.messageID);
      }
    }

    if (!hasAccess(senderID)) {
      return api.sendMessage("দুঃখিত, এই কমান্ড ব্যবহারের পারমিশন তোর নাই।", event.threadID, event.messageID);
    }

    try {
      const randomUrl = imageLinks[Math.floor(Math.random() * imageLinks.length)];
      const filePath = await applyWatermark(randomUrl);
      api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlink(filePath, () => {}),
        event.messageID
      );
    } catch (e) {
      console.error("asianwaifu error:", e.message);
      api.sendMessage("ছবি লোড করতে সমস্যা হয়েছে, আবার ট্রাই কর।", event.threadID, event.messageID);
    }
  }
};
