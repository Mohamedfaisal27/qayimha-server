import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  if (!data.access_token) {
    console.error('فشل الحصول على توكن من Twitch:', JSON.stringify(data));
    throw new Error('Twitch token error: ' + JSON.stringify(data));
  }
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

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
      body: `search "${query}"; fields name, cover.url, first_release_date, genres.name, platforms.name, age_ratings.rating, summary; limit 10;`,
    });

    const games = await igdbRes.json();
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'صار خطأ بجلب بيانات اللعبة', details: err.message });
  }
});

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
    res.status(500).json({ error: 'صار خطأ بجلب تفاصيل اللعبة', details: err.message });
  }
});

app.get('/api/debug', (req, res) => {
  const mask = (v) => {
    if (!v) return 'غير موجود';
    return `طوله ${v.length} خانة، يبدأ بـ "${v.slice(0, 4)}", ينتهي بـ "${v.slice(-4)}"`;
  };
  res.json({
    TWITCH_CLIENT_ID: mask(TWITCH_CLIENT_ID),
    TWITCH_CLIENT_SECRET: mask(TWITCH_CLIENT_SECRET),
  });
});

app.get('/', (req, res) => {
  res.send('سيرفر قيمها شغّال ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`السيرفر شغال على المنفذ ${PORT}`));
