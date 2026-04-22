const store = require("app-store-scraper");
const fs = require("fs");
const { segmentReview } = require("./review-segmenter.js");

function removeDiacritics(text = "") {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// =======================
// KONFIGURÁCIA
// =======================
const mainAppId = 1621276337; // Můj Vodafone+
const secondAppId = 509838162; // stará appka
const country = "cz";
const dataFile = "vodafone-appstore-reviews.json";
const backupFile = "vodafone-appstore-reviews (copy).json";

// =======================
// HLAVNÝ FLOW
// =======================
async function main() {
  // === Backup starého súboru ===
  if (fs.existsSync(dataFile)) {
    fs.copyFileSync(dataFile, backupFile);
    console.log(`📁 Backup created: ${backupFile}`);
  }

  // === Načítanie existujúceho súboru ===
  let existingReviews = [];
  if (fs.existsSync(dataFile)) {
    try {
      const raw = fs.readFileSync(dataFile, "utf-8");
      const parsed = JSON.parse(raw);
      existingReviews = parsed.reviews || [];
      console.log(`ℹ️ Načítaných ${existingReviews.length} existujúcich recenzií`);
    } catch (err) {
      console.warn("⚠️ Chyba pri načítaní existujúceho súboru, začíname od nuly");
      existingReviews = [];
    }
  }

  // === Načítanie nových recenzií ===
  console.log(`📦 Načítavam nové recenzie pre App Store ID ${mainAppId}...`);
  const newReviewsRaw = await store.reviews({
    id: mainAppId,
    sort: store.sort.NEWEST,
    country,
    num: 200,
  });

  // === Filtrovanie iba nových recenzií podľa ID ===
  const existingIds = new Set(existingReviews.map((r) => r.id));
  const newUniqueReviews = newReviewsRaw.filter((r) => !existingIds.has(r.id));
  console.log(`✅ Nájdených ${newUniqueReviews.length} nových recenzií`);

  // === Normalizácia a segmentácia ===
  const newProcessed = newUniqueReviews.map((review) => {
    const originalText = review.text || "";
    const normalizedText = removeDiacritics(originalText).toLowerCase();
    return {
      id: review.id,
      userName: review.userName,
      userUrl: review.userUrl || null,
      version: review.version || null,
      score: review.score,
      title: review.title || "",
      text: originalText,
      url: review.url || null,
      updated: review.updated || null,
      textNormalized: normalizedText,
      segments: segmentReview(normalizedText),
    };
  });

  // 🔧 FIX: Use Map to merge — prevents review count from dropping.
  //         New reviews take precedence so updated content is always fresh.
  const mergedMap = new Map();
  [...existingReviews, ...newProcessed].forEach((r) => mergedMap.set(r.id, r));
  const allReviews = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.updated) - new Date(a.updated)
  );

  console.log(`📊 Total reviews after merge: ${allReviews.length}`);

  // === Info o appke ===
  const appData = await store.app({ id: mainAppId, ratings: true, country });

  // === Výstup so sekciou ratings ===
  const output = {
    ratings: {
      score: appData.score,
      totalRatings: appData.ratings,
      totalReviews: appData.reviews,
      histogram: appData.histogram,
    },
    reviews: allReviews,
    metadata: {
      totalReviewsExtracted: allReviews.length,
      extractedAt: new Date().toISOString(),
      source: "app-store",
    },
  };

  fs.writeFileSync(dataFile, JSON.stringify(output, null, 2));
  console.log(`📄 Výstup uložený do: ${dataFile}`);
  console.log("✅ Segmentácia a doplnenie nových recenzií dokončené!");
}

main().catch((err) => console.error("❌ Error:", err));
