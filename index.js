const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_DOMAIN = process.env.TELEGRAM_API_DOMAIN;

// الربط بالسيرفر الخاص بك لدعم الأحجام الكبيرة والسرعة
const bot = new Telegraf(BOT_TOKEN, {
    telegram: { apiRoot: `https://${API_DOMAIN}` }
});

const videoStorage = new Map();

bot.start((ctx) => {
    ctx.reply('🚀 البوت شغال الآن بنظام السيرفر الخاص! أرسل أي فيديو (حتى الأفلام الطويلة) وسأعطيك رابط مشاهدة سريع.');
});

// عرض صفحة المشغل
app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API جلب الفيديو
app.get('/api/video/:id', async (req, res) => {
    const fileId = videoStorage.get(req.params.id);
    if (!fileId) return res.status(404).send('الفيديو غير موجود');
    
    try {
        const file = await bot.telegram.getFile(fileId);
        // الرابط المباشر من سيرفرك الخاص
        const directUrl = `https://${API_DOMAIN}/file/bot${BOT_TOKEN}/${file.file_path}`;
        res.redirect(directUrl);
    } catch (e) {
        res.status(500).send('خطأ في الاتصال بسيرفر الفيديو');
    }
});

bot.on('video', async (ctx) => {
    try {
        const fileId = ctx.message.video.file_id;
        const uniqueId = Math.random().toString(36).substring(7);
        videoStorage.set(uniqueId, fileId);

        // رابط Railway الخاص ببوتك (خدمة Watch)
        const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
        const playerLink = `https://${domain}/v/${uniqueId}`;
        
        await ctx.reply(`🎬 جاهز للمشاهدة:\n${playerLink}`);
    } catch (err) {
        ctx.reply('حدث خطأ أثناء معالجة الفيديو.');
    }
});

bot.launch();
app.listen(process.env.PORT || 8080, () => console.log('Bot is Ready!'));
