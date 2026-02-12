const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Çift Kanallı Bot Sistemi Aktif!");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

const tokensString = process.env.TOKENS; 
const channelIdsString = process.env.CHANNEL_ID; // Artık buraya "id1,id2" yazacağız
const message = process.env.MESSAGE;

if (!tokensString || !channelIdsString || !message) {
    console.error("HATA: Değişkenler eksik! TOKENS, CHANNEL_ID (virgüllü) ve MESSAGE kontrol et.");
} else {
    const tokens = tokensString.split(',').map(t => t.trim());
    const channelIds = channelIdsString.split(',').map(c => c.trim());
    const botCount = tokens.length;
    
    // AYARLAR (Ban riskini azaltmak için 2 saniyeye çıkardık)
    const stepInterval = 2000; 
    const cycleTime = botCount * stepInterval;

    console.log(`${botCount} bot ve ${channelIds.length} kanal için sistem kuruluyor...`);

    tokens.forEach((token, index) => {
        setTimeout(() => {
            // Her bot kendi sırası geldiğinde tüm kanallara sırayla atar
            sendToAllChannels(token, channelIds, index + 1);
            
            // Döngüye sok
            setInterval(() => sendToAllChannels(token, channelIds, index + 1), cycleTime);
            
        }, index * stepInterval);
    });
}

async function sendToAllChannels(token, ids, botNo) {
    for (const id of ids) {
        try {
            await axios.post(`https://discord.com/api/v9/channels/${id}/messages`, {
                content: message
            }, {
                headers: {
                    "Authorization": token,
                    "Content-Type": "application/json"
                }
            });
            console.log(`✅ Bot #${botNo} -> Kanal: ${id} (Başarılı)`);
            // İki kanal arasında çok kısa (200ms) bir nefes payı
            await new Promise(resolve => setTimeout(resolve, 200)); 
        } catch (err) {
            console.error(`❌ Bot #${botNo} -> Kanal: ${id} Hata: ${err.response?.status}`);
        }
    }
}
