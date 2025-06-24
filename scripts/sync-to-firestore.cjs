const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');

const FIRESTORE_COLLECTION = 'tcgcsv';
const creds = require('../credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(creds),
});
const db = admin.firestore();

const CATEGORY_ID = 3;
const BASE = 'https://tcgcsv.com/tcgplayer';

(async () => {
  try {
    console.log("Fetching Pokémon groups...");
    const groupRes = await axios.get(`${BASE}/${CATEGORY_ID}/groups`);
    const allGroups = groupRes.data.results;

    for (const group of allGroups) {
      const groupId = group.groupId;
      console.log(`Processing group: ${group.name} (${groupId})`);

      const prodRes = await axios.get(`${BASE}/${CATEGORY_ID}/${groupId}/products`);
      const products = prodRes.data.results;

      const priceRes = await axios.get(`${BASE}/${CATEGORY_ID}/${groupId}/prices`);
      const prices = priceRes.data.results;

      const priceMap = Object.fromEntries(
        prices.map((p) => [`${p.productId}_${p.subTypeName}`, p])
      );

      for (const product of products) {
        const docId = product.productId.toString();
        const docRef = db.collection(FIRESTORE_COLLECTION).doc(docId);

        const cardPrices = Object.values(priceMap).filter(
          (p) => p.productId === product.productId
        );

        await docRef.set({
          ...product,
          prices: cardPrices,
        });
      }

      console.log(`Synced ${products.length} cards from group "${group.name}"`);
    }

    console.log("All groups synced successfully.");
  } catch (err) {
    console.error('Error syncing to Firestore:', err.message || err);
    process.exit(1);
  }
})();