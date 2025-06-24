const admin = require('firebase-admin');
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const FIRESTORE_COLLECTION = 'tcgcsv';
const TCGCSV_URL = 'https://tcgcsv.com/pokemon/en/all-en.csv';

(async () => {
  try {
    const creds = require('../credentials.json');
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
    const db = admin.firestore();

    const response = await axios.get(TCGCSV_URL);
    const rawCSV = response.data;

    const rows = await parseCSV(rawCSV);

    const batch = db.batch();
    for (const row of rows) {
      if (!row.ProductID) continue;
      const ref = db.collection(FIRESTORE_COLLECTION).doc(row.ProductID);
      batch.set(ref, row);
    }

    await batch.commit();
    console.log(`Synced ${rows.length} rows to Firestore.`);
  } catch (err) {
    console.error('Error syncing to Firestore:', err);
    process.exit(1);
  }
})();

function parseCSV(rawText) {
  const results = [];
  return new Promise((resolve, reject) => {
    Readable.from(rawText).pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}