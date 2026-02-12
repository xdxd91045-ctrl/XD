const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot Sistemi Aktif ve Güvenli Modda Çalışıyor!");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

// --- AYARLAR ---
const tokensString = process.env.TOKENS; 
const channelIdsString = process.env.CHANNEL_ID; 
const msg1 = process.env.MESSAGE1 || process.env.MESSAGE;
const msg2 = process.env.MESSAGE2;

if (!tokensString || !channelIdsString || !msg1) {
    console.error("HATA: Değişkenler eksik! Render Panelini kontrol et.");
} else {
    const allTokens = tokensString.split(',').map(t => t.trim());
    const channelIds = channelIdsString.split(',').map(c => c.trim());
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

        // Botları senin istediğin 0.5sn, 1.0sn kademeli aralıklarla sıraya diziyoruz
        for (let i = 0; i < activeTokens.length; i++) {
            const token = activeTokens[i];
            const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];

            // İstediğin 0.5 saniyelik kademeli bekleme (Her bot bir öncekinden 0.5s sonra atar)
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
            sendToDiscord(token, randomChannel, randomMsg, i + 1);
        }

        // Tüm grup bittikten sonra Discord IP'sinin soğuması için 15 saniye mola
        // 429 hatasını azaltmak için bu süre gereklidir.
        setTimeout(startCycle, 15000);
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
            const retryAfter = err.response.data.retry_after * 1000 || 5000;
            console.warn(`⚠️ Bot #${botNo} Limit! ${retryAfter}ms bekleniyor.`);
        } else {
            console.error(`❌ Bot #${botNo} Hata: ${err.response?.status}`);
        }
    }
}
