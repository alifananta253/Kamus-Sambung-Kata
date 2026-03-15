import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [allWords, setAllWords] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [prefix, setPrefix] = useState("");
  const [suffixInput, setSuffixInput] = useState("");
  const [suffixTags, setSuffixTags] = useState([]);
  const [usedWords, setUsedWords] = useState([]);

  const [minLen, setMinLen] = useState("");
  const [maxLen, setMaxLen] = useState("");

  useEffect(() => {
    const loadKamus = async () => {
      try {
        const res = await fetch("./data/kamus.json");
        if (!res.ok) throw new Error("Gagal load ./data/kamus.json");

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Format kamus.json harus array");
        }

        const cleaned = [...new Set(data)]
          .map((w) => normalizeWord(w))
          .filter(Boolean);

        setAllWords(cleaned);
        setDbCount(cleaned.length);
      } catch (err) {
        console.error(err);
        alert("Gagal memuat kamus.json");
      } finally {
        setLoading(false);
      }
    };

    loadKamus();
  }, []);

  useEffect(() => {
    const savedUsedWords = localStorage.getItem("usedWords");
    if (savedUsedWords) {
      try {
        setUsedWords(JSON.parse(savedUsedWords));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("usedWords", JSON.stringify(usedWords));
  }, [usedWords]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setPrefix("");
        setSuffixInput("");
        setSuffixTags([]);
        setMinLen("");
        setMaxLen("");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const hasSearchInput = useMemo(() => {
    return (
      prefix.trim() !== "" ||
      suffixTags.length > 0 ||
      minLen !== "" ||
      maxLen !== ""
    );
  }, [prefix, suffixTags, minLen, maxLen]);

  const baseFilteredWords = useMemo(() => {
    let data = allWords;

    const p = prefix.trim().toLowerCase();
    const min = minLen === "" ? null : Number(minLen);
    const max = maxLen === "" ? null : Number(maxLen);

    if (p) {
      data = data.filter((word) => word.startsWith(p));
    }

    if (min !== null && !Number.isNaN(min)) {
      data = data.filter((word) => word.length >= min);
    }

    if (max !== null && !Number.isNaN(max)) {
      data = data.filter((word) => word.length <= max);
    }

    data = data.filter((word) => !usedWords.includes(word));

    return data;
  }, [allWords, prefix, minLen, maxLen, usedWords]);

  const mainWords = useMemo(() => {
    if (!hasSearchInput) return [];

    if (suffixTags.length === 0) {
      return baseFilteredWords;
    }

    return baseFilteredWords.filter((word) =>
      suffixTags.some((tag) => word.endsWith(tag))
    );
  }, [baseFilteredWords, suffixTags, hasSearchInput]);

  const fallbackWords = useMemo(() => {
  const p = prefix.trim().toLowerCase();

  // jika huruf awal belum diisi → jangan tampilkan apa pun
  if (p === "") return [];

  // jika tidak ada tag → tidak ada data cadangan
  if (suffixTags.length === 0) return [];

  return baseFilteredWords.filter(
    (word) => !suffixTags.some((tag) => word.endsWith(tag))
  );
}, [baseFilteredWords, suffixTags, prefix]);

  const addSuffixTag = () => {
    const value = normalizeWord(suffixInput);
    if (!value) return;
    if (suffixTags.includes(value)) {
      setSuffixInput("");
      return;
    }

    setSuffixTags((prev) => [...prev, value]);
    setSuffixInput("");
  };

  const removeSuffixTag = (tagToRemove) => {
    setSuffixTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSuffixKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addSuffixTag();
    }

    if (e.key === "Backspace" && suffixInput === "" && suffixTags.length > 0) {
      setSuffixTags((prev) => prev.slice(0, -1));
    }
  };

  const markAsUsed = (word) => {
    if (usedWords.includes(word)) return;
    setUsedWords((prev) => [...prev, word]);
  };

  const removeUsedWord = (word) => {
    setUsedWords((prev) => prev.filter((item) => item !== word));
  };

  const resetUsedWords = () => {
    setUsedWords([]);
    localStorage.removeItem("usedWords");
  };

  return (
    <div className="app-shell">
      <div className="scanline" />

      <div className="main-panel">
        <div className="topbar">System.V.0.1 // REALTIME</div>

        <h1 className="title">SAMBUNG KATA</h1>

        <div className="db-badge">
          ● Total Kata: {loading ? "LOADING..." : dbCount.toLocaleString("id-ID")}
        </div>

        <div className="welcome">WELCOME, OPERATOR</div>

        <div style={{ textAlign: "center" }}>
          <a
            className="operator-tag"
            href="https://www.tiktok.com/@hahaybro0"
            target="_blank"
            rel="noopener noreferrer"
          >
            @Moon
          </a>
        </div>

        <div className="game-cover-wrap">
          <img
            className="game-cover"
            src={process.env.PUBLIC_URL + "/logo.png"}
            alt="Sambung Kata"
          />
        </div>

        <div className="toolbar-row">
          <div className="clear-hint">PRESS [ESC] TO CLEAR INPUT</div>
          <button className="reset-used-btn" onClick={resetUsedWords}>
            Reset Kata Terpakai
          </button>
        </div>

        <div className="input-grid">
          <div className="field">
            <label>HURUF AWAL</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="contoh: ox"
            />
          </div>

          <div className="field">
            <label>AKHIRAN TAG (ENTER UNTUK TAMBAH)</label>
            <div className="tag-input-wrap">
              <div className="tag-list">
                {suffixTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="suffix-tag"
                    onClick={() => removeSuffixTag(tag)}
                    title="Hapus tag"
                  >
                    {tag} <span>×</span>
                  </button>
                ))}

                <input
                  type="text"
                  value={suffixInput}
                  onChange={(e) => setSuffixInput(e.target.value)}
                  onKeyDown={handleSuffixKeyDown}
                  placeholder="contoh: cy lalu Enter"
                  className="tag-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="input-grid small-grid">
          <div className="field">
            <label>[A-Z]</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="huruf awal"
            />
          </div>

          <div className="field">
            <label>[MIN_LEN]</label>
            <input
              type="number"
              value={minLen}
              onChange={(e) => setMinLen(e.target.value)}
              placeholder="min"
            />
          </div>

          <div className="field">
            <label>[MAX_LEN]</label>
            <input
              type="number"
              value={maxLen}
              onChange={(e) => setMaxLen(e.target.value)}
              placeholder="max"
            />
          </div>
        </div>

        <div className="live-feed">LIVE FEED ACTIVE</div>
      </div>

      <div className="output-panel">
        {loading ? (
          <div className="empty-state">Memuat database kata...</div>
        ) : !hasSearchInput ? (
          <div className="empty-state">
            <div className="idle-wrap">
              <div className="idle-bracket">[ _ ]</div>
              <div className="idle-text">TYPE TO INITIATE SCAN...</div>
              <div className="idle-text">KETIK UNTUK INISIALISASI MEMINDAI...</div>
            </div>
          </div>
        ) : (
          <>
            <SectionHeader title="HASIL UTAMA" count={mainWords.length} />
            <div className="divider" />

            {mainWords.length === 0 ? (
              <div className="empty-mini">Tidak ada kata yang cocok dengan akhiran tag.</div>
            ) : (
              <div className="result-grid">
                {mainWords.map((word, index) => (
                  <button
                    key={`${word}-${index}`}
                    className="word-chip clickable-word"
                    onClick={() => markAsUsed(word)}
                    title="Klik untuk tandai sebagai kata terpakai"
                  >
                    {word}
                  </button>
                ))}
              </div>
            )}

            <div className="panel-gap" />

            <SectionHeader
              title={`KATA TERPAKAI (${usedWords.length})`}
              count={usedWords.length}
            />
            <div className="divider" />

            {usedWords.length === 0 ? (
              <div className="empty-mini">Belum ada kata terpakai.</div>
            ) : (
              <div className="used-tags">
                {usedWords.map((word) => (
                  <button
                    key={word}
                    className="used-word-tag"
                    onClick={() => removeUsedWord(word)}
                    title="Klik untuk mengembalikan kata"
                  >
                    {word}
                  </button>
                ))}
              </div>
            )}

            <div className="panel-gap" />

            <SectionHeader title="DATA CADANGAN" count={fallbackWords.length} />
            <div className="divider" />

            {fallbackWords.length === 0 ? (
              <div className="empty-mini">
                {suffixTags.length > 0
                  ? "Semua kata dari huruf awal sudah masuk ke hasil utama."
                  : "Tag akhiran belum ditambahkan."}
              </div>
            ) : (
              <div className="result-grid">
                {fallbackWords.map((word, index) => (
                  <div key={`${word}-fallback-${index}`} className="word-chip fallback-chip">
                    {word}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="output-header section-header-custom">
      <span>&gt;&gt; {title}</span>
      <span className="count-box">{count}</span>
    </div>
  );
}

function normalizeWord(word) {
  if (!word) return "";

  return word
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, "")
    .replace(/[^a-zA-ZÀ-ÿ0-9_-]/g, "")
    .trim();
}

export default App;