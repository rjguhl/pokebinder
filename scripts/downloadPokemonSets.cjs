const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const BASE = 'https://tcgcsv.com/tcgplayer/3';
const OUTPUT_DIR = path.join(__dirname, '../data/tcgsets');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const wait = ms => new Promise(r => setTimeout(r, ms));

async function fetchJson(url, retries = 3) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (retries > 0) {
      console.warn(`Retrying ${url}...`);
      await wait(1000);
      return fetchJson(url, retries - 1);
    } else {
      console.error(`❌ Failed to fetch: ${url}`, err.message);
      return null;
    }
  }
}

async function downloadAll() {
  console.log(`📦 Getting group list...`);
  const groupList = await fetchJson(`${BASE}/groups`);
  if (!groupList) return;

  const groups = groupList.results;
  console.log(`📚 Found ${groups.length} groups.`);

  for (const group of groups) {
    const groupId = group.groupId;
    const groupName = group.name.replace(/[\\/:"*?<>|]+/g, '_');

    console.log(`⬇️ Downloading: ${groupName} (${groupId})...`);

    const products = await fetchJson(`${BASE}/${groupId}/products`);
    if (products && products.results?.length) {
      const prices = await fetchJson(`${BASE}/${groupId}/prices`);
      const allPrices = prices?.results || [];

      const merged = products.results.map(product => ({
        ...product,
        prices: allPrices
          .filter(p => p.productId === product.productId)
          .map(p => ({
            subTypeName: p.subTypeName,
            lowPrice: p.lowPrice,
            midPrice: p.midPrice,
            highPrice: p.highPrice,
            marketPrice: p.marketPrice,
            directLowPrice: p.directLowPrice,
          })),
      }));

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${groupId}-${groupName}.json`),
        JSON.stringify(merged, null, 2)
      );
      console.log(`✅ Saved ${merged.length} cards for ${groupName}`);
    } else {
      console.warn(`⚠️ No products found for ${groupName}`);
    }

    await wait(300);
  }

  console.log(`🎉 All done!`);
}

downloadAll();