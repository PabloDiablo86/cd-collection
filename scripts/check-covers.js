import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const albums = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../src/data/albums.json"),
    "utf8"
  )
);

const coversDir = path.join(__dirname, "../public/covers");

const missing = [];

for (const album of albums) {
  if (!album.cover) {
    missing.push(
      `${album.artist} - ${album.album} (нет поля cover)`
    );
    continue;
  }

  const fileName = album.cover.replace("/covers/", "");
  const fullPath = path.join(coversDir, fileName);

  if (!fs.existsSync(fullPath)) {
    missing.push(
      `${album.artist} - ${album.album} -> ${fileName}`
    );
  }
}

console.log("\n========== MISSING COVERS ==========\n");

if (missing.length === 0) {
  console.log("Все обложки найдены.");
} else {
  missing.forEach((x) => console.log(x));
}

console.log(`\nВсего отсутствует: ${missing.length}`);