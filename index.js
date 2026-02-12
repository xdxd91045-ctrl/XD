const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Spam Sistemi Aktif - Hata Koruması Devrede!"));
app.listen(PORT, () => console.log(`Sunucu ${PORT} aktif.`));

const tokensRaw = process.env.TOKENS; 
const channelIdsRaw = process.env.CHANNEL_IDS; 
const messages = [process.env.MESSAGE1, process.env.MESSAGE2];

const allTokens = tokensRaw ? tokensRaw.split(",").map(t => t.trim()).filter(t => t) : [];
const channelIds = channelIdsRaw ? channelIdsRaw.split(",").map(id => id.trim()).filter(id => id) : [];

let currentGroup = 'A';
const shiftDuration = 2 * 60 * 60 * 1000;

setInterval(() => {
    currentGroup = (currentGroup === 'A') ? 'B' : 'A';
    console.log(`--- VARDİYA DEĞİŞTİ: Grup ${currentGroup} İş Başında ---`);
}, shiftDuration);

function getActiveTokens() {
    const half = Math.ceil(allTokens.length / 2);
    return (currentGroup === 'A') ? allTokens.slice(0, half) : allTokens.slice(half);
}

// Mesaj gönderme fonksiyonu
async function sendWithRetry(token, index, channelId, msg) {
    const delay = (index + 1) * 500; // İstediğin 0.5s, 1.0s, 1.5s kurgusu
    
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
        await axios.post(`https://discord.com/api/v9/channels/${channelId}/messages`, 
            { content: msg }, 
            { headers: { "Authorization": token, "Content-Type": "application/json" } }
        );
        console.log(`✅ Bot ${index + 1} başarılı.`);
    } catch (err) {
        if (err.response?.status === 429) {
            // Discord 429 verirse ne kadar beklememiz gerektiğini söyler (retry_after)
            const retryAfter = (err.response.data.retry_after * 1000) || 5000;
            console.error(`⚠️ Bot ${index + 1} Sınıra Takıldı! ${retryAfter}ms bekleniyor...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
        } else {
            console.error(`❌ Bot ${index + 1} hatası: ${err.response?.status}`);
        }
    }
}

async function startSpam() {
    while (true) {
        const activeTokens = getActiveTokens();
        
        // Botları sırayla ama asenkron (istediğin gecikmelerle) çalıştırıyoruz
        const promises = activeTokens.map((token, index) => {
            const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            return sendWithRetry(token, index, randomChannel, randomMsg);
        });

        await Promise.all(promises);
        
        // Tüm grup bir turu tamamladıktan sonra Discord'un IP'yi bloklamaması için 3 saniye mola
        await new Promise(r => setTimeout(r, 3000));
    }
}

if (allTokens.length > 0 && channelIds.length > 0) {
    startSpam();
} else {
    console.error("KRİTİK HATA: Tokenlar veya Kanallar eksik!");
}
