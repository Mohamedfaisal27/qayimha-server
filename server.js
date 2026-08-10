import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

// ------ هذي المفاتيح تحطها كمتغيرات بيئة (Environment Variables) بمنصة الاستضافة ------
// لا تكتبها هنا مباشرة أبداً
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

// يجيب توكن دخول من Twitch، ويعيد استخدامه لين ينتهي
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // نجدد قبل الانتهاء بدقيقة
  return cachedToken;
}

// نقطة الوصول اللي يطلبها التطبيق: يبحث عن لعبة بالاسم
app.get('/api/games/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'اكتب اسم لعبة للبحث' });

    const token = await getAccessToken();

    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      // نطلب الحقول اللي نحتاجها بس: الاسم، الغلاف، السعر التقديري، التصنيف، المنصات
      body: `search "${query}"; fields name, cover.url, first_release_date, genres.name, platforms.name, age_ratings.rating, summary; limit 10;`,
    });

    const games = await igdbRes.json();
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'صار خطأ بجلب بيانات اللعبة' });
  }
});

// نقطة الوصول: يجيب لعبة واحدة بالتفصيل عبر الـ id
app.get('/api/games/:id', async (req, res) => {
  try {
    const token = await getAccessToken();
    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `where id = ${req.params.id}; fields name, cover.url, first_release_date, genres.name, platforms.name, age_ratings.rating, summary;`,
    });
    const games = await igdbRes.json();
    res.json(games[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'صار خطأ بجلب تفاصيل اللعبة' });
  }
});

app.get('/', (req, res) => {
  res.send('سيرفر قيّمها شغّال ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر شغال على المنفذ ${PORT}`));
