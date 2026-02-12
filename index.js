const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Özel Gecikmeli Spam Sistemi Aktif!"));
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));

// --- AYARLAR ---
const tokensRaw = process.env.TOKENS; 
const channelIdsRaw = process.env.CHANNEL_IDS; 
const messages = [process.env.MESSAGE1, process.env.MESSAGE2];

const allTokens = tokensRaw ? tokensRaw.split(",").map(t => t.trim()).filter(t => t) : [];
const channelIds = channelIdsRaw ? channelIdsRaw.split(",").map(id => id.trim()).filter(id => id) : [];

let currentGroup = 'A';
const shiftDuration = 2 * 60 * 60 * 1000; // 2 Saatlik Vardiya

setInterval(() => {
    currentGroup = (currentGroup === 'A') ? 'B' : 'A';
    console.log(`--- VARDİYA DEĞİŞTİ: Aktif Grup ${currentGroup} ---`);
}, shiftDuration);

function getActiveTokens() {
    const half = Math.ceil(allTokens.length / 2);
    return (currentGroup === 'A') ? allTokens.slice(0, half) : allTokens.slice(half);
}

// --- ANA DÖNGÜ (0.5sn, 1.0sn, 1.5sn Kurgusu) ---
async function startSpam() {
    while (true) {
        const activeTokens = getActiveTokens();
        
        // Her döngüde botların sırasını (index) kullanarak gecikme veriyoruz
        // index 0 -> 0.5sn, index 1 -> 1.0sn, index 2 -> 1.5sn...
        const sendPromises = activeTokens.map((token, index) => {
            const delay = (index + 1) * 500; // Her bot için +0.5 saniye ekler
            
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
                    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

                    try {
                        await axios.post(`https://discord.com/api/v9/channels/${randomChannel}/messages`, 
                        { content: randomMsg }, 
                        { headers: { "Authorization": token, "Content-Type": "application/json" } });
                        console.log(`🚀 Bot ${index + 1} (${delay}ms): Mesaj gönderildi.`);
                    } catch (err) {
                        console.error(`❌ Bot ${index + 1} Hata:`, err.response?.status);
                    }
                    resolve();
                }, delay);
            });
        });

        // Mevcut gruptaki tüm botlar kendi sürelerinde mesaj atana kadar bekle
        await Promise.all(sendPromises);
        
        // Grup bittikten sonra yeni bir dalga başlatmadan önce 1 saniye nefes al
        await new Promise(r => setTimeout(r, 1000));
    }
}

if (allTokens.length > 0 && channelIds.length > 0) {
    startSpam();
} else {
    console.error("HATA: Token veya Kanal ID bulunamadı!");
}
