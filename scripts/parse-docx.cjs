const fs = require("fs-extra");
const path = require("path");
const mammoth = require("mammoth");

const docxFile = path.join(
  __dirname,
  "..",
  "Музыкальная коллекция.docx"
);

const outputFile = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "albums.json"
);

async function main() {
  const result = await mammoth.extractRawText({
    path: docxFile
  });

  const text = result.value;

  const lines = text
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  const albums = [];

  let currentArtist = "";
  let currentGenre = "";

  for (const line of lines) {

    const artistMatch =
      line.match(/^(.+?)\s+\((.+)\)$/);

    if (
      artistMatch &&
      !line.startsWith("•") &&
      !line.match(/^\d{4}:/)
    ) {
      currentArtist = artistMatch[1].trim();
      currentGenre = artistMatch[2].trim();
      continue;
    }

    const albumMatch =
      line.match(/[•\-\*]?\s*(\d{4})\:\s*(.+)/);

    if (!albumMatch) continue;

    const year =
      Number(albumMatch[1]);

    const rest =
      albumMatch[2].trim();

    const albumName =
      rest.split("(")[0].trim();

    let edition = "";
    let notes = "";

    const bracket =
      rest.match(/\((.*?)\)/);

    if (bracket)
      edition = bracket[1];

    const afterBracket =
      rest.replace(/\(.*?\)/, "")
          .replace(albumName, "")
          .replace(/^,/, "")
          .trim();

    notes = afterBracket;

    albums.push({
      artist: currentArtist,
      album: albumName,
      genre: currentGenre,
      year,
      edition,
      notes,
      cover: ""
    });
  }

  fs.writeJsonSync(
    outputFile,
    albums,
    { spaces: 2 }
  );

  console.log(
    `Created ${albums.length} albums`
  );
}

main().catch(console.error);