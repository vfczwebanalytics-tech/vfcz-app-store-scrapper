// normalizer.mjs
import fs from "fs";
import { segmentReview } from "./review-segmenter.js";

// Súbory
const inputFile = "vodafone-appstore-reviews-update.json";
const outputFile = "vodafone-appstore-reviews-normalized.json";

// Funkcia na odstránenie diakritiky
function removeDiacritics(text = "") {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Načítanie JSON
let data;
try {
  data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
} catch (err) {
  console.error("❌ Chyba pri načítaní vstupného súboru:", err.message);
  process.exit(1);
}

const reviews = data.reviews || [];

const normalizedReviews = reviews.map((review) => {
  const originalText = review.text || "";
  const normalizedText = removeDiacritics(originalText).toLowerCase();
  const segments = segmentReview(normalizedText);

  return {
    ...review,
    text_normalized: normalizedText,
    segments,
  };
});

try {
  fs.writeFileSync(
    outputFile,
    JSON.stringify(normalizedReviews, null, 2),
    "utf-8",
  );
  console.log(`✅ Recenzie boli normalizované a segmentované!`);
  console.log(`📄 Výstup uložený do: ${outputFile}`);
} catch (err) {
  console.error("❌ Chyba pri uložení výsledku:", err.message);
}
