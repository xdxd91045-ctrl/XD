const express = require('express');
const axios = require("axios");
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Sistem Aktif: 40 Token - Saniyelik Geçiş Modu");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});

// DEĞİŞKENLERİ TANIMLIYORUZ (Hatanın çözümü burası)
const tokens = process.env.TOKENS ? process.env.TOKENS.split(',').map(t => t.trim()) : [];
const channelId = process.env.CHANNEL_ID;
const m1 = process.env.MESSAGE1;
const m2 = process.env.MESSAGE2;
const m3 = process.env.MESSAGE3;

// Kontrol mekanizması
if (tokens.length === 0 || !channelId || !m1 || !m2 || !m3) {
    console.error("HATA: Render panelindeki Environment Variables eksik!");
} else {
    // Toplam döngü süresi: Token sayısı x 1 saniye
    const cycleTime = tokens.length * 1000;

    tokens.forEach((token, index) => {
        // Her botu 1 saniye arayla (zincirleme) başlatıyoruz
        setTimeout(() => {
            startBot(token, index + 1, cycleTime);
        }, index * 1000);
    });
}

function startBot(token, botNumber, interval) {
    const label = `Hesap-${botNumber}`;
    connectToGateway(token, label);

    const msgs = [m1, m2, m3];
    let step = 0;

    setInterval(async () => {
        try {
            await axios.post(`https://discord.com/api/v9/channels/${channelId}/messages`, 
                { content: msgs[step] }, 
                { headers: { "Authorization": token, "Content-Type": "application/json" } }
            );
            console.log(`✅ [${label}] Mesaj Başarılı.`);
            step = (step + 1) % msgs.length;
        } catch (err) {
            if (err.response?.status === 401) {
                console.error(`❌ [${label}] TOKEN HATALI (401)!`);
            } else if (err.response?.status === 429) {
                console.error(`⚠️ [${label}] Discord engeli (429).`);
            }
        }
    }, interval); // Her hesap sırası gelene kadar bekler (40 token için 40 saniye)
}

function connectToGateway(token, label) {
    const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');
    ws.on('open', () => {
        ws.send(JSON.stringify({
            op: 2,
            d: {
                token: token,
                properties: { $os: 'linux', $browser: 'chrome', $device: 'chrome' },
                presence: { status: 'dnd', afk: false }
            }
        }));
    });
    ws.on('message', (data) => {
        const p = JSON.parse(data);
        if (p.op === 10) {
            setInterval(() => { if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: null })); }, p.d.heartbeat_interval);
        }
    });
    ws.on('close', () => setTimeout(() => connectToGateway(token, label), 5000));
}
