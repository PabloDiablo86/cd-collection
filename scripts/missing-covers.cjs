const fs = require("fs-extra");

const albums = fs.readJsonSync(
  "src/data/albums.json"
);

const missing = albums.filter(
  a => !a.cover
);

console.log(
  `Missing covers: ${missing.length}\n`
);

for (const a of missing) {
  console.log(
    `${a.artist} - ${a.album}`
  );
}