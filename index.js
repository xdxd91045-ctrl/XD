const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot Sistemi Aktif: 3 Kanal + Vardiya + Çoklu Token Modu!");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

// --- AYARLAR VE DEĞİŞKENLER ---
const tokensRaw = process.env.TOKENS; 
// Render'da CHANNEL_IDS kısmına id1,id2,id3 şeklinde 3 tane yazmalısın
const channelIdsRaw = process.env.CHANNEL_IDS; 
const messages = [process.env.MESSAGE1, process.env.MESSAGE2];

if (!tokensRaw || !channelIdsRaw || !messages[0]) {
    console.error("HATA: TOKENS, CHANNEL_IDS veya MESSAGE1/2 eksik!");
    process.exit(1);
}

const allTokens = tokensRaw.split(",").map(t => t.trim());
const channelIds = channelIdsRaw.split(",").map(id => id.trim());
const shiftDuration = 2 * 60 * 60 * 1000; // 2 Saatlik Vardiya
let currentGroup = 'A';

// --- VARDİYA SİSTEMİ ---
function getActiveTokens() {
    const half = Math.ceil(allTokens.length / 2);
    return (currentGroup === 'A') ? allTokens.slice(0, half) : allTokens.slice(half);
}

setInterval(() => {
    currentGroup = (currentGroup === 'A') ? 'B' : 'A';
    console.log(`--- VARDİYA DEĞİŞTİ: Aktif Grup: ${currentGroup} ---`);
}, shiftDuration);

// --- MESAJ GÖNDERME FONKSİYONU ---
async function startSending() {
    const activeTokens = getActiveTokens();
    
    // Her döngüde rastgele bir kanal ve rastgele bir mesaj seçiyoruz
    const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    // Bu döngü, o anki vardiyada olan tüm botların (20 bot) sırayla mesaj atmasını sağlar
    for (const token of activeTokens) {
        try {
            await axios.post(`https://discord.com/api/v9/channels/${randomChannel}/messages`, {
                content: randomMsg
            }, {
                headers: {
                    "Authorization": token,
                    "Content-Type": "application/json"
                }
            });
            console.log(`✅ [Grup ${currentGroup}] Kanal: ${randomChannel.slice(-5)} | Mesaj: "${randomMsg.slice(0,10)}..."`);
        } catch (err) {
            console.error(`❌ Hata (Token: ${token.slice(-5)}):`, err.response?.status);
            // Eğer token geçersizse (401), o tokeni atlayıp devam eder
        }
    }

    // --- İNSANSI GECİKME (0.2 sn ile 1.0 sn arası rastgele) ---
    const randomDelay = Math.floor(Math.random() * (1000 - 200 + 1) + 200);
    setTimeout(startSending, randomDelay);
}

// Sistemi Başlat
console.log("Sistem 3 kanallı modda başlatılıyor...");
startSending();
