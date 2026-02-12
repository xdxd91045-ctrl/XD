const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Sistem Aktif: Vardiyalı ve Kademeli Mod");
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
    const shiftDuration = 2 * 60 * 60 * 1000; // 2 Saat

    // Vardiya Sistemi
    setInterval(() => {
        currentGroup = (currentGroup === 'A') ? 'B' : 'A';
        console.log(`--- VARDİYA DEĞİŞTİ: Yeni Grup: ${currentGroup} ---`);
    }, shiftDuration);

    const startCycle = async () => {
        const half = Math.ceil(allTokens.length / 2);
        const activeTokens = (currentGroup === 'A') ? allTokens.slice(0, half) : allTokens.slice(half);

        console.log(`🚀 ${currentGroup} grubu tura başlıyor...`);

        // Botları 0.5sn aralıklarla sıraya diziyoruz
        for (let i = 0; i < activeTokens.length; i++) {
            const token = activeTokens[i];
            const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];

            // İstediğin 0.5sn kademeli bekleme
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
            // Mesajı gönder (Yanıtı beklemiyoruz ki hız kesilmesin ama limit kontrolü yapıyoruz)
            sendToDiscord(token, randomChannel, randomMsg, i + 1);
        }

        // Tüm grup bittikten sonra Discord'un IP bloklamaması için 10 saniye mola
        console.log("--- Tur tamamlandı, IP soğuması için 10sn bekleniyor ---");
        setTimeout(startCycle, 10000);
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
            // Discord 'retry_after' süresi verirse o kadar beklemek en doğrusu
            const wait = err.response.data.retry_after * 1000 || 5000;
            console.warn(`⚠️ Bot #${botNo} Limit! ${wait}ms bekleniyor.`);
        } else {
            console.error(`❌ Bot #${botNo} Hata: ${err.response?.status}`);
        }
    }
}const express = require('express');
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Gelişmiş Vardiyalı ve Kademeli Bot Sistemi Aktif!");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda dinleniyor.`);
});

// --- DEĞİŞKENLER ---
const tokensString = process.env.TOKENS; 
const channelIdsString = process.env.CHANNEL_ID; 
const msg1 = process.env.MESSAGE1;
const msg2 = process.env.MESSAGE2;

if (!tokensString || !channelIdsString || !msg1) {
    console.error("HATA: Değişkenler eksik! TOKENS, CHANNEL_ID (virgüllü) ve MESSAGE1 kontrol et.");
} else {
    const allTokens = tokensString.split(',').map(t => t.trim());
    const channelIds = channelIdsString.split(',').map(c => c.trim());
    const messages = [msg1, msg2].filter(m => m); // Message2 yoksa sadece 1'i kullanır
    
    let currentGroup = 'A';
    const shiftDuration = 2 * 60 * 60 * 1000; // 2 Saat

    // Vardiya Değiştirici
    setInterval(() => {
        currentGroup = (currentGroup === 'A') ? 'B' : 'A';
        console.log(`--- VARDİYA DEĞİŞTİ: Şu an Aktif Grup: ${currentGroup} ---`);
    }, shiftDuration);

    // ANA DÖNGÜ FONKSİYONU
    const runSystem = async () => {
        // Vardiyaya göre aktif tokenleri seç
        const half = Math.ceil(allTokens.length / 2);
        const activeTokens = (currentGroup === 'A') ? allTokens.slice(0, half) : allTokens.slice(half);

        console.log(`🚀 ${currentGroup} grubu için yeni tur başlatılıyor...`);

        // Her token için kademeli (0.5s, 1.0s...) işlem başlat
        const tasks = activeTokens.map((token, index) => {
            const delay = (index + 1) * 500; // İstediğin 0.5sn, 1.0sn kurgusu
            
            return new Promise(resolve => {
                setTimeout(async () => {
                    // Rastgele Kanal ve Rastgele Mesaj Seçimi
                    const randomId = channelIds[Math.floor(Math.random() * channelIds.length)];
                    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

                    await sendMessage(token, randomId, randomMsg, index + 1);
                    resolve();
                }, delay);
            });
        });

        await Promise.all(tasks);
        
        // Tüm grup bitince 2 saniye bekle ve başa dön
        setTimeout(runSystem, 2000);
    };

    runSystem();
}

async function sendMessage(token, id, msg, botNo) {
    try {
        await axios.post(`https://discord.com/api/v9/channels/${id}/messages`, {
            content: msg
        }, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });
        console.log(`✅ [Grup] Bot #${botNo} -> Kanal: ${id.slice(-4)} (Başarılı)`);
    } catch (err) {
        if (err.response?.status === 429) {
            console.error(`⚠️ Bot #${botNo} Limit yedi (429).`);
        } else {
            console.error(`❌ Bot #${botNo} Hata: ${err.response?.status}`);
        }
    }
}
