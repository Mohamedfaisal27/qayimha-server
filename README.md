# سيرفر قيّمها الخلفي

## شغّله على جهازك (اختياري، للتجربة بس)
```
npm install
cp .env.example .env
# افتح .env وحط مفاتيح IGDB
npm start
```

## انشره على Railway (الطريقة اللي نوصي فيها)

1. روح لـ https://railway.app وسوي حساب (تقدر تسجل بحساب GitHub مباشرة)
2. ارفع هذا المجلد لمستودع GitHub جديد:
   - سوي مستودع جديد على https://github.com/new
   - ارفع كل الملفات اللي بهذا المجلد (سحب وإفلات من واجهة GitHub تكفي)
3. رجع لـ Railway، اضغط "New Project" → "Deploy from GitHub repo"
4. اختر المستودع اللي رفعته
5. روح لتبويب "Variables" وضيف:
   - `TWITCH_CLIENT_ID` = المفتاح اللي أخذته من Twitch
   - `TWITCH_CLIENT_SECRET` = السر اللي أخذته من Twitch
6. Railway بيبني وينشر تلقائياً، وبيعطيك رابط زي:
   `https://qayimha-server-production.up.railway.app`

## اختبار إنه شغّال
افتح بالمتصفح:
`https://[رابطك]/api/games/search?q=GTA`

لازم يرجع لك بيانات JSON فيها ألعاب GTA.

## الخطوة الأخيرة: اربطه بالتطبيق
بكود الفرونت إند (تطبيق قيّمها)، بدل ما تجيب بيانات الألعاب من القائمة الثابتة،
تسوي fetch لـ: `https://[رابطك]/api/games/search?q=اسم_اللعبة`
