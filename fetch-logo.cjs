const https = require('https');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const logoUrl = 'https://i.postimg.cc/63KXZNcz/20260530-101216.png';
const targets = [
  path.join(publicDir, 'logo.png'),
  path.join(publicDir, 'favicon.png'),
  path.join(publicDir, 'favicon.ico'),
];

console.log('Downloading logo from:', logoUrl);

https.get(logoUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Referer': 'https://postimg.cc/'
  }
}, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed to download image. Status:', res.statusCode);
    return;
  }
  
  const data = [];
  res.on('data', (chunk) => {
    data.push(chunk);
  });
  
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    for (const target of targets) {
      fs.writeFileSync(target, buffer);
      console.log('Successfully written logo to:', target);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching logo:', err);
});
