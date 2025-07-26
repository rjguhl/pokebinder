const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../data/tcgsets');
const outputDir = path.join(__dirname, '../data');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const output = path.join(outputDir, 'cards.json');

const allCards = [];

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.json')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        allCards.push(...parsed);
      }
    } catch (e) {
      console.error(`❌ Failed to parse ${file}:`, e.message);
    }
  }
});

fs.writeFileSync(output, JSON.stringify(allCards, null, 2));
console.log(`✅ Wrote ${allCards.length} cards to cards.json`);