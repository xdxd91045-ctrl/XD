const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Seri Atış Sistemi Aktif: 0.5sn aralıklarla hesap geçişi yapılıyor.");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

const tokensString = process.env.TOKENS; 
const channelId = process.env.CHANNEL_ID;
const message = process.env.MESSAGE;

if (!tokensString || !channelId || !message) {
    console.error("HATA: Değişkenler eksik! Render panelinden TOKENS, CHANNEL_ID ve MESSAGE kontrol et.");
} else {
    const tokens = tokensString.split(',').map(t => t.trim());
    const botCount = tokens.length;
    
    // AYARLAR
    const stepInterval = 500; // Her yeni mesaj arası 0.5 saniye (500ms)
    const cycleTime = botCount * stepInterval; // Bir hesabın tekrar sırasının gelmesi için gereken süre (15 saniye)

    console.log(`${botCount} bot için 0.5sn geçişli sistem kuruluyor...`);

    tokens.forEach((token, index) => {
        // Kademeli Başlatma
        setTimeout(() => {
            // İlk mesajı at
            sendMessage(token, index + 1);
            
            // Periyodik döngüye gir (15 saniyede bir bu hesaba sıra gelir)
            setInterval(() => sendMessage(token, index + 1), cycleTime);
            
        }, index * stepInterval); // 0.5, 1.0, 1.5... saniye gecikmeyle başlatır
    });
}

function sendMessage(token, botNo) {
  axios.post(`https://discord.com/api/v9/channels/${channelId}/messages`, {
    content: message
  }, {
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    }
  }).then(() => {
    console.log(`🚀 Bot #${botNo} mesajı gönderdi.`);
  }).catch((err) => {
    if (err.response?.status === 429) {
        console.error(`⚠️ Hız sınırı: Bot #${botNo} engellendi.`);
    } else {
        console.error(`❌ Bot #${botNo} hatası:`, err.response?.status);
    }
  });
}
