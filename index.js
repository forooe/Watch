const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const app = express();

// 1. جلب البيانات من البيئة (أو استخدام القيم الافتراضية الصحيحة لسيرفرك)
const BOT_TOKEN = process.env.BOT_TOKEN;

// ملاحظة: استخدمنا الاسم الكامل للخدمة والبورت 8081 كما ظهر في الـ Logs الخاصة بك
const API_DOMAIN = process.env.TELEGRAM_API_DOMAIN || 'telegram-bot-api-production-97a4.railway.internal:8081';

// 2. إعداد البوت للاتصال بالسيرفر المحلي (Local Bot API)
const bot = new Telegraf(BOT_TOKEN, {
    telegram: { 
        apiRoot: `http://${API_DOMAIN}`, 
        testPath: false 
    }
});

const videoStorage = new Map();

// 3. أوامر البوت
bot.start((ctx) => {
    ctx.reply('🚀 أهلاً بك! البوت متصل الآن بالسيرفر الخاص.\nأرسل أي فيديو للحصول على رابط مشاهدة مباشر يدعم الأحجام الكبيرة.');
});

// 4. مسارات سيرفر الويب (Express)
app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/video/:id', async (req, res) => {
    const fileId = videoStorage.get(req.params.id);
    if (!fileId) return res.status(404).send('Video not found');
    
    try {
        const file = await bot.telegram.getFile(fileId);
        // توليد رابط التحميل من السيرفر الخاص مباشرة
        const directUrl = `http://${API_DOMAIN}/file/bot${BOT_TOKEN}/${file.file_path}`;
        res.redirect(directUrl);
    } catch (e) {
        console.error('API Error:', e);
        res.status(500).send('Error connecting to Local API');
    }
});

bot.on('video', async (ctx) => {
    try {
        const fileId = ctx.message.video.file_id;
        const uniqueId = Math.random().toString(36).substring(7);
        videoStorage.set(uniqueId, fileId);
        
        const domain = process.env.RAILWAY_PUBLIC_DOMAIN || req.get('host');
        ctx.reply(`✅ تم تجهيز الفيديو:\nhttps://${domain}/v/${uniqueId}`);
    } catch (err) {
        ctx.reply('حدث خطأ أثناء معالجة الفيديو.');
        console.error(err);
    }
});

// 5. تشغيل النظام
const PORT = process.env.PORT || 8080;

async function start() {
    try {
        // محاولة تشغيل البوت
        await bot.launch();
        console.log('✅ Telegram Bot is Online!');
        
        // تشغيل سيرفر الويب
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Web Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Critical Error during startup:', err);
        // إعادة المحاولة بعد 5 ثواني في حال فشل السيرفر الآخر في الاستجابة
        setTimeout(start, 5000);
    }
}

start();

// التعامل مع الإغلاق
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
