const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_DOMAIN = process.env.TELEGRAM_API_DOMAIN;

// الربط بالسيرفر الخاص (استخدمنا http لتجنب مشاكل الشهادات في الروابط الداخلية)
const bot = new Telegraf(BOT_TOKEN, {
    telegram: { 
        apiRoot: `http://${API_DOMAIN}`,
        testPath: false 
    }
});

const videoStorage = new Map();

bot.start((ctx) => ctx.reply('🚀 البوت يعمل الآن بالسيرفر الخاص! أرسل الفيديوهات الكبيرة للمشاهدة.'));

app.get('/v/:id', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/video/:id', async (req, res) => {
    const fileId = videoStorage.get(req.params.id);
    if (!fileId) return res.status(404).send('Video not found');
    try {
        const file = await bot.telegram.getFile(fileId);
        // توليد رابط التحميل من سيرفرك الخاص
        const directUrl = `http://${API_DOMAIN}/file/bot${BOT_TOKEN}/${file.file_path}`;
        res.redirect(directUrl);
    } catch (e) {
        res.status(500).send('Error');
    }
});

bot.on('video', async (ctx) => {
    const fileId = ctx.message.video.file_id;
    const uniqueId = Math.random().toString(36).substring(7);
    videoStorage.set(uniqueId, fileId);
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    ctx.reply(`✅ رابط المشاهدة:\nhttps://${domain}/v/${uniqueId}`);
});

bot.launch().then(() => console.log('Bot Started!'));
app.listen(process.env.PORT || 8080);
