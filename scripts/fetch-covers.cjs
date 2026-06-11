const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const albumsPath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "albums.json"
);

const coversDir = path.join(
  __dirname,
  "..",
  "public",
  "covers"
);

fs.ensureDirSync(coversDir);

const albums = fs.readJsonSync(albumsPath);

function normalize(artist, album) {
  return `${artist}_${album}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zа-яё0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

async function downloadCover(album) {
  if (album.cover) {
    console.log(`Skip: ${album.artist} - ${album.album}`);
    return;
  }

  try {
    console.log(`Searching: ${album.artist} - ${album.album}`);

    const query = encodeURIComponent(
      `artist:"${album.artist}" AND release:"${album.album}"`
    );

    const mbUrl =
      `https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json&limit=10`;

    const mbResponse = await axios.get(mbUrl, {
      headers: {
        "User-Agent": "MusicCatalog/1.0"
      }
    });

    const releases = mbResponse.data?.releases || [];

    if (!releases.length) {
      console.log(`Not found`);
      return;
    }

    for (const release of releases) {
      try {
        const coverUrl =
          `https://coverartarchive.org/release/${release.id}/front`;

        const imageResponse = await axios.get(
          coverUrl,
          {
            responseType: "arraybuffer",
            timeout: 15000
          }
        );

        const filename =
          normalize(album.artist, album.album) + ".jpg";

        const filepath =
          path.join(coversDir, filename);

        fs.writeFileSync(filepath, imageResponse.data);

        album.cover = `/covers/${filename}`;

        console.log(`Saved: ${filename}`);

        return;
      } catch {
        // пробуем следующий релиз
      }
    }

    console.log(
      `No cover found: ${album.artist} - ${album.album}`
    );

  } catch (err) {
    console.log(
      `Failed: ${album.artist} - ${album.album}`
    );
  }
}

async function main() {
  for (const album of albums) {
    await downloadCover(album);
  }

  fs.writeJsonSync(
    albumsPath,
    albums,
    { spaces: 2 }
  );

  console.log("albums.json updated");
}

main();