const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const app = express();

// جلب البيانات من المتغيرات
const BOT_TOKEN = process.env.BOT_TOKEN;
// إذا لم يجد الرابط في المتغيرات، سيستخدم الرابط الداخلي تلقائياً
const API_DOMAIN = process.env.TELEGRAM_API_DOMAIN || 'telegram-bot-api.railway.internal:8080';

// إعداد البوت للعمل مع سيرفر الـ API الخاص بك
const bot = new Telegraf(BOT_TOKEN, {
    telegram: { 
        apiRoot: `http://${API_DOMAIN}`,
        testPath: false 
    }
});

// مخزن مؤقت لروابط الفيديوهات
const videoStorage = new Map();

// رسالة الترحيب
bot.start((ctx) => ctx.reply('🚀 البوت شغال الآن بأقصى سرعة وسيرفر خاص!\nأرسل أي فيديو (حتى لو حجمه كبير) وسأعطيك رابط مشاهدة مباشر.'));

// صفحة المشاهدة (تأكد من وجود ملف index.html في مشروعك)
app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// رابط الـ API الذي يستخدمه المشغل لجلب الفيديو
app.get('/api/video/:id', async (req, res) => {
    const fileId = videoStorage.get(req.params.id);
    if (!fileId) return res.status(404).send('الفيديو غير موجود');
    
    try {
        const file = await bot.telegram.getFile(fileId);
        // توليد الرابط المباشر من سيرفرك الخاص
        const directUrl = `http://${API_DOMAIN}/file/bot${BOT_TOKEN}/${file.file_path}`;
        res.redirect(directUrl);
    } catch (e) {
        console.error('Error fetching file:', e);
        res.status(500).send('خطأ في الاتصال بسيرفر التليجرام الخاص');
    }
});

// استقبال الفيديوهات
bot.on('video', async (ctx) => {
    const fileId = ctx.message.video.file_id;
    const uniqueId = Math.random().toString(36).substring(7);
    videoStorage.set(uniqueId, fileId);
    
    // الحصول على رابط البوت العام من ريلوي
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    const watchUrl = `https://${domain}/v/${uniqueId}`;
    
    ctx.reply(`✅ تم معالجة الفيديو بنجاح!\n\n🔗 رابط المشاهدة المباشر:\n${watchUrl}`);
});

// تشغيل البوت
bot.launch()
    .then(() => console.log('✅ Telegram Bot is Online!'))
    .catch((err) => console.error('❌ Bot launch error:', err));

// تشغيل سيرفر الويب على المنفذ 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Web Server is running on port ${PORT}`);
});

// التعامل مع الإغلاق المفاجئ
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
