// ... (üst kısımdaki express ve ws ayarları aynı kalacak)

const tokens = process.env.TOKENS ? process.env.TOKENS.split(',').map(t => t.trim()) : [];
const delayBetweenAccounts = 1000; // Hesaplar arası 1 saniye fark
const individualAccountInterval = tokens.length * delayBetweenAccounts; // Her hesabın kendi bekleme süresi

if (tokens.length === 0 || !channelId || !m1 || !m2 || !m3) {
    console.error("HATA: Değişkenler eksik!");
} else {
    console.log(`${tokens.length} hesap aktif. Her hesap ${individualAccountInterval / 1000} saniyede bir mesaj atacak.`);

    tokens.forEach((token, index) => {
        // Her hesap sırayla 1'er saniye arayla başlar
        setTimeout(() => {
            startBot(token, index + 1, individualAccountInterval);
        }, index * delayBetweenAccounts);
    });
}

function startBot(token, botNumber, interval) {
    const label = `Hesap-${botNumber}`;
    connectToGateway(token, label);

    const msgs = [m1, m2, m3];
    let step = 0;

    setInterval(async () => {
        const currentMsg = msgs[step];
        try {
            await axios.post(`https://discord.com/api/v9/channels/${channelId}/messages`, 
                { content: currentMsg }, 
                { headers: { "Authorization": token, "Content-Type": "application/json" } }
            );
            console.log(`✅ [${label}] Mesaj gitti.`);
            step = (step + 1) % msgs.length;
        } catch (err) {
            console.error(`❌ [${label}] Hata: ${err.response?.status}`);
        }
    }, interval); // Dinamik bekleme süresi (40 token için 40 saniye)
}
