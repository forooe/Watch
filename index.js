const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

const videoStorage = new Map();

// أضفنا هذا الجزء لكي يرد البوت عند الضغط على Start
bot.start((ctx) => {
    ctx.reply('أهلاً بك! أرسل لي أي فيديو وسأقوم بتحويله إلى رابط مشاهدة مباشر.');
});

app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/video/:id', async (req, res) => {
    const fileId = videoStorage.get(req.params.id);
    if (!fileId) return res.status(404).send('Video not found');
    try {
        const link = await bot.telegram.getFileLink(fileId);
        res.redirect(link.href);
    } catch (e) {
        res.status(500).send('Error fetching video');
    }
});

bot.on('video', async (ctx) => {
    try {
        const fileId = ctx.message.video.file_id;
        const uniqueId = Math.random().toString(36).substring(7);
        videoStorage.set(uniqueId, fileId);

        // تعديل مهم: نستخدم الرابط الظاهر في صورتك
        const domain = 'watch-production-2c42.up.railway.app'; 
        const playerLink = `https://${domain}/v/${uniqueId}`;
        
        await ctx.reply(`✅ تم تجهيز الرابط:\n${playerLink}`);
    } catch (error) {
        console.error(error);
        ctx.reply('حدث خطأ أثناء معالجة الفيديو.');
    }
});

bot.launch();
app.listen(process.env.PORT || 8080, () => console.log('Server Ready!'));
