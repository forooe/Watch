const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const app = express();

// جلب التوكن من متغيرات بيئة Railway
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// مخزن مؤقت لروابط الفيديوهات
const videoStorage = new Map();

// عرض صفحة المشغل
app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// نقطة وصول لجلب رابط الفيديو الفعلي للمشغل
app.get('/api/video/:id', async (req, res) => {
    const fileId = videoStorage.get(req.params.id);
    if (!fileId) return res.status(404).send('Video not found');
    
    try {
        const link = await bot.telegram.getFileLink(fileId);
        res.redirect(link.href);
    } catch (e) {
        res.status(500).send('Error fetching video from Telegram');
    }
});

// استقبال الفيديو من المستخدم
bot.on('video', async (ctx) => {
    const fileId = ctx.message.video.file_id;
    const uniqueId = Math.random().toString(36).substring(7);
    
    // حفظ المعرف في الذاكرة
    videoStorage.set(uniqueId, fileId);

    // الحصول على رابط السيرفر من Railway تلقائياً
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:3000';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const playerLink = `${protocol}://${domain}/v/${uniqueId}`;
    
    await ctx.reply(`🎬 تفضل رابط المشاهدة (مثل يوتيوب):\n${playerLink}`);
});

bot.launch();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
