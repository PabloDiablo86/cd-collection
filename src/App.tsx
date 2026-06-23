import { useEffect, useMemo, useState } from "react";
import albumsData from "./data/albums.json";

const LASTFM_KEY = "6d5c4fdb6d07dcf953224b2286a6357c";

type Album = {
  artist: string;
  album: string;
  year: number;
  genre: string;
  edition?: string;
  notes?: string;
  cover?: string;
};

function App() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [genreFilter, setGenreFilter] = useState("");
  const [sortBy, setSortBy] = useState("artist");

  const [zoom, setZoom] = useState(2);

  console.log(albumsData);
  const [albums, setAlbums] = useState<Album[]>(albumsData);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

  const cache = useMemo(() => new Map<string, string>(), []);

  const genres = useMemo(() => {
    return [...new Set(albums.map((a) => a.genre))].sort();
  }, [albums]);

  // debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // 🔥 FETCH COVER (Last.fm)
  const fetchCover = async (artist: string, album: string) => {
    const key = `${artist}-${album}`;

    if (cache.has(key)) return cache.get(key);

    try {
      const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${LASTFM_KEY}&artist=${encodeURIComponent(
        artist
      )}&album=${encodeURIComponent(album)}&format=json`;

      const res = await fetch(url);
      const data = await res.json();

      const image =
        data?.album?.image?.reverse()?.find((img: any) => img["#text"])?.[
          "#text"
        ];

      if (image) {
        cache.set(key, image);
        return image;
      }
    } catch (e) {
      console.log("cover error", e);
    }

    return null;
  };

  // 🔥 AUTO LOAD COVERS
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const updated = [...albums];

      for (let i = 0; i < updated.length; i++) {
        if (updated[i].cover) continue;

        const cover = await fetchCover(
          updated[i].artist,
          updated[i].album
        );

        if (!cancelled && cover) {
          updated[i] = { ...updated[i], cover };
          setAlbums([...updated]);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAlbums = useMemo(() => {
    const q = debouncedSearch.toLowerCase();

    const filtered = albums.filter((album) => {
      const matchesSearch =
        album.artist.toLowerCase().includes(q) ||
        album.album.toLowerCase().includes(q) ||
        album.genre.toLowerCase().includes(q);

      const matchesGenre =
        !genreFilter || album.genre === genreFilter;

      return matchesSearch && matchesGenre;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "year-asc":
          return a.year - b.year;
        case "year-desc":
          return b.year - a.year;
        case "album":
          return a.album.localeCompare(b.album);
        default:
          return a.artist.localeCompare(b.artist);
      }
    });
  }, [albums, debouncedSearch, genreFilter, sortBy]);

    const gridConfig = useMemo(() => {
    switch (zoom) {
      case 1:
        return { min: 220, height: 320, gap: 18 };
      case 2:
        return { min: 150, height: 240, gap: 14 };
      case 3:
        return { min: 105, height: 160, gap: 8 };
      default:
        return { min: 150, height: 240, gap: 14 };
    }
  }, [zoom]);

  const currentIndex = selectedAlbum
    ? filteredAlbums.findIndex(
        (a) =>
          a.artist === selectedAlbum.artist &&
          a.album === selectedAlbum.album
      )
    : -1;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Музыкальная коллекция</h1>

      {/* CONTROLS */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px", minWidth: "250px" }}
        />

        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          style={{ padding: "10px" }}
        >
          <option value="">Все жанры</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "10px" }}
        >
          <option value="artist">Исполнитель (А-Я)</option>
          <option value="album">Альбом (А-Я)</option>
          <option value="year-desc">Год (новые → старые)</option>
          <option value="year-asc">Год (старые → новые)</option>
        </select>

        {/* ZOOM */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#888" }}>Zoom</span>

          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />

          <span style={{ fontSize: "12px", color: "#888" }}>
            {zoom === 1 ? "Comfort" : zoom === 2 ? "Balanced" : "Dense"}
          </span>
        </div>
      </div>

      <p>
        Всего альбомов: <b>{albums.length}</b> | Показано:{" "}
        <b>{filteredAlbums.length}</b>
      </p>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${gridConfig.min}px, 1fr))`,
          gap: `${gridConfig.gap}px`,
        }}
      >
        {filteredAlbums.map((album) => (
          <div
            key={`${album.artist}-${album.album}`}
            onClick={() => setSelectedAlbum(album)}
            style={{
              border: "1px solid #2d2d2d",
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              background: "#1b1b1b",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 14px 28px rgba(0,0,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(0,0,0,0.25)";
            }}
          >
            {/* COVER */}
            <div style={{ height: `${gridConfig.height}px`, overflow: "hidden" }}>
              {album.cover ? (
                <img
                  src={album.cover}
                  alt={album.album}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.35s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg,#2a2a2a,#1b1b1b)",
                    color: "#ddd",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: zoom === 3 ? "22px" : "28px",
                      fontWeight: "bold",
                      marginBottom: "6px",
                    }}
                  >
                    {album.artist
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#aaa",
                      lineHeight: 1.2,
                    }}
                  >
                    {album.album}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "10px",
                      color: "#666",
                    }}
                  >
                    {album.year} • {album.genre}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "8px" }}>
  <p
  style={{
    margin: 0,
    fontSize: "11px",
    color: "#e0e0e0",
    fontWeight: 700,
  }}
>
  {album.artist}
</p>

  <p
    style={{
      margin: "4px 0 0",
      fontSize: "12px",
      color: "#cfcfcf",
    }}
  >
    {album.album}
  </p>

  <p
    style={{
      margin: "4px 0 0",
      fontSize: "11px",
      color: "#777",
    }}
  >
    {album.year}
  </p>
</div>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedAlbum && (
        <div
          onClick={() => setSelectedAlbum(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "20px",
    width: "100%",
    maxWidth: "900px",
  }}
>
  <button
    disabled={currentIndex <= 0}
    onClick={(e) => {
      e.stopPropagation();
      setSelectedAlbum(filteredAlbums[currentIndex - 1]);
    }}
  onMouseEnter={(e) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
    }
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
  }}
    style={{
      background: "rgba(255,255,255,0.08)",
      border: "1px solid #444",
      color: "#fff",
      fontSize: "32px",
      width: "56px",
      height: "56px",
      flexShrink: 0,
      borderRadius: "50%",
      cursor: currentIndex <= 0 ? "default" : "pointer",
      opacity: currentIndex <= 0 ? 0.3 : 0.7,
      transition: "background 0.2s ease",
    }}
  >
    ❮
  </button>

  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      background: "#222",
      color: "#fff",
      padding: "24px",
      borderRadius: "16px",
      maxWidth: "700px",
      width: "100%",
    }}
  >

            {selectedAlbum.cover && (
              <img
                src={selectedAlbum.cover}
                alt={selectedAlbum.album}
                style={{
                  width: "350px",
                  maxWidth: "100%",
                  marginBottom: "20px",
                  borderRadius: "10px",
                }}
              />
            )}

            <h2
  style={{
    color: "#f5f5f5",
    marginTop: "10px",
    marginBottom: "20px",
  }}
>
  {selectedAlbum.artist}
</h2>

<p>
  <b>Альбом:</b> {selectedAlbum.album}
</p>

<p>
  <b>Год:</b> {selectedAlbum.year}
</p>

<p>
  <b>Жанр:</b> {selectedAlbum.genre}
</p>

<p>
  <b>Издание:</b> {selectedAlbum.edition || "-"}
</p>

<p>
  <b>Примечания:</b> {selectedAlbum.notes || "-"}
</p>
  </div>

  <button
  disabled={currentIndex >= filteredAlbums.length - 1}
  onClick={(e) => {
    e.stopPropagation();
    setSelectedAlbum(filteredAlbums[currentIndex + 1]);
  }}
  onMouseEnter={(e) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
    }
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
  }}
  style={{
    background: "rgba(255,255,255,0.08)",
    border: "1px solid #444",
    color: "#fff",
    fontSize: "32px",
    width: "56px",
    height: "56px",
    flexShrink: 0,
    borderRadius: "50%",
    cursor:
      currentIndex >= filteredAlbums.length - 1
        ? "default"
        : "pointer",
    opacity:
      currentIndex >= filteredAlbums.length - 1
        ? 0.3
        : 0.7,
    transition: "background 0.2s ease",
  }}
>
  ❯
</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;