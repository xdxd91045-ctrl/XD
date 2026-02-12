const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Sabit Mesajlı İnsan Taklidi Sistemi Aktif.");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

const tokensString = process.env.TOKENS; 
const channelIdsString = process.env.CHANNEL_ID;
const message = process.env.MESSAGE; // Sadece senin yazdığın mesaj kullanılacak

if (!tokensString || !channelIdsString || !message) {
    console.error("HATA: Değişkenler eksik!");
} else {
    const tokens = tokensString.split(',').map(t => t.trim());
    const channelIds = channelIdsString.split(',').map(c => c.trim());
    
    console.log(`${tokens.length} bot için sabit mesajlı sistem başlatıldı...`);

    tokens.forEach((token, index) => {
        const startLoop = () => {
            // İnsan Taklidi: 180ms ile 220ms arası rastgele gecikme
            const randomJitter = Math.floor(Math.random() * 40) - 20; 
            const dynamicInterval = 200 + randomJitter;

            setTimeout(async () => {
                await sendToAllChannels(token, channelIds, index + 1, message);
                startLoop(); // Değişken süreyle döngü devam eder
            }, dynamicInterval);
        };
        
        setTimeout(startLoop, index * 200);
    });
}

async function sendToAllChannels(token, ids, botNo, fixedMessage) {
    for (const id of ids) {
        try {
            // 1. "Yazıyor..." simgesi
            axios.post(`https://discord.com/api/v9/channels/${id}/typing`, {}, {
                headers: { "Authorization": token }
            }).catch(() => {});

            // 2. Mesaj Gönderimi (Spam filtresi için sonuna küçük bir ID ekliyoruz)
            const finalMessage = `${fixedMessage} (${Math.floor(Math.random() * 999)})`;

            await axios.post(`https://discord.com/api/v9/channels/${id}/messages`, {
                content: finalMessage
            }, {
                headers: {
                    "Authorization": token,
                    "Content-Type": "application/json"
                }
            });
            
            console.log(`👤 Bot #${botNo} -> Kanal: ${id} (Sabit Mesaj)`);
        } catch (err) {
            if (err.response?.status === 429) {
                console.error(`⚠️ Hız sınırı: Bot #${botNo} engellendi.`);
            }
        }
    }
}
