var store = require("app-store-scraper");
var fs = require("fs");

const mainAppId = 1621276337;
const secondAppId = 509838162;
const country = "cz";

async function printSecondAppRating() {
  try {
    const info = await store.app({
      id: secondAppId,
      ratings: true,
      country,
    });

    console.log("============================================");
    console.log(`📱 App Store – Můj Vodafone`);
    console.log(`⭐ Celkové hodnocení: ${info.score.toFixed(2)} / 5`);
    console.log(`📝 Počet hodnocení: ${info.ratings}`);
    console.log("============================================\n");
  } catch (err) {
    console.error(`❌ Chyba pri načítaní dát pre ${secondAppId}:`, err.message);
  }
}

async function fetchMainAppData() {
  try {
    console.log(`📦 App Store – Můj Vodafone+`);
    //    console.log("============================================");

    // 1️⃣ Info o appke + ratingy
    const appInfoFull = await store.app({
      id: mainAppId,
      ratings: true,
      country,
    });

    const appInfo = {
      ratings: {
        histogram: appInfoFull.histogram,
        totalRatings: appInfoFull.ratings,
        totalReviews: appInfoFull.reviews,
        score: appInfoFull.score,
      },
    };

    console.log(
      `⭐ Celkové hodnotenie: ${appInfo.ratings.score.toFixed(2)} / 5`,
    );
    console.log(`📝 Počet hodnotení: ${appInfo.ratings.totalRatings}`);
    console.log(`💬 Počet recenzií: ${appInfo.ratings.totalReviews}`);
    console.log("============================================");

    // 2️⃣ Recenzie
    console.log("Stahujem najnovšie recenzie...");
    const reviews = await store.reviews({
      id: mainAppId,
      sort: store.sort.NEWEST,
      country,
      num: 200,
    });

    // 3️⃣ Uloženie do JSON
    const output = { appInfo, reviews };
    fs.writeFileSync(
      "vodafone-appstore-reviews-update.json",
      JSON.stringify(output, null, 2),
    );

    console.log("✅ Uložené: vodafone-appstore-reviews-update.json");
    console.log("============================================");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

async function main() {
  await printSecondAppRating(); // 1. stará appka
  await fetchMainAppData(); // 2. hlavná appka
}

main();
