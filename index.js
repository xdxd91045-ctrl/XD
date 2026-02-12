const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot Sistemi Aktif! Hız Sınırı Pas Geçme Modu Devrede.");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

// --- AYARLAR ---
const tokensString = process.env.TOKENS; 
const channelIdsString = process.env.CHANNEL_ID; 
const msg1 = process.env.MESSAGE1;
const msg2 = process.env.MESSAGE2;

if (!tokensString || !channelIdsString || !msg1) {
    console.error("HATA: Değişkenler eksik! Render Panelini kontrol et.");
} else {
    const allTokens = tokensString.split(',').map(t => t.trim()).filter(t => t);
    const channelIds = channelIdsString.split(',').map(c => c.trim()).filter(c => c);
    const messages = [msg1, msg2].filter(m => m);
    
    let currentGroup = 'A';
    const shiftDuration = 2 * 60 * 60 * 1000; // 2 Saatlik Vardiya

    setInterval(() => {
        currentGroup = (currentGroup === 'A') ? 'B' : 'A';
        console.log(`--- VARDİYA DEĞİŞTİ: Yeni Grup: ${currentGroup} ---`);
    }, shiftDuration);

    const startCycle = async () => {
        const half = Math.ceil(allTokens.length / 2);
        const activeTokens = (currentGroup === 'A') ? allTokens.slice(0, half) : allTokens.slice(half);

        console.log(`🚀 ${currentGroup} grubu tura başlıyor...`);

        for (let i = 0; i < activeTokens.length; i++) {
            const token = activeTokens[i];
            const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];

            // İstediğin 0.5 saniyelik kademeli artış
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
            // Mesajı gönder (Yanıtı beklemiyoruz, hata gelse bile döngü devam eder)
            sendToDiscord(token, randomChannel, randomMsg, i + 1);
        }

        // Tur bittikten sonra kısa bir nefes payı (IP bloklanmaması için)
        setTimeout(startCycle, 5000);
    };

    startCycle();
}

async function sendToDiscord(token, id, msg, botNo) {
    try {
        await axios.post(`https://discord.com/api/v9/channels/${id}/messages`, {
            content: msg
        }, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });
        console.log(`✅ Bot #${botNo} -> Başarılı`);
    } catch (err) {
        if (err.response?.status === 429) {
            // BEKLEME YAPMIYORUZ: Sadece log basıyoruz, döngü zaten sonraki bota geçti bile
            console.warn(`⚠️ Bot #${botNo} Limit yedi! Pas geçildi.`);
        } else {
            console.error(`❌ Bot #${botNo} Hata: ${err.response?.status}`);
        }
    }
}
