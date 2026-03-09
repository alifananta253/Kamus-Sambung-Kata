import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [allWords, setAllWords] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [minLen, setMinLen] = useState("");
  const [maxLen, setMaxLen] = useState("");

  useEffect(() => {
    const loadKamus = async () => {
      try {
        const res = await fetch("/data/kamus.json");
        if (!res.ok) throw new Error("Gagal load /data/kamus.json");

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
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setPrefix("");
        setSuffix("");
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
      suffix.trim() !== "" ||
      minLen !== "" ||
      maxLen !== ""
    );
  }, [prefix, suffix, minLen, maxLen]);

  const filteredWords = useMemo(() => {
    if (!hasSearchInput) return [];

    let data = allWords;

    const p = prefix.trim().toLowerCase();
    const s = suffix.trim().toLowerCase();
    const min = minLen === "" ? null : Number(minLen);
    const max = maxLen === "" ? null : Number(maxLen);

    if (p) {
      data = data.filter((word) => word.startsWith(p));
    }

    if (s) {
      data = data.filter((word) => word.endsWith(s));
    }

    if (min !== null && !Number.isNaN(min)) {
      data = data.filter((word) => word.length >= min);
    }

    if (max !== null && !Number.isNaN(max)) {
      data = data.filter((word) => word.length <= max);
    }

    return data;
  }, [allWords, prefix, suffix, minLen, maxLen, hasSearchInput]);

  return (
    <div className="app-shell">
      <div className="scanline" />

      <div className="main-panel">
        <div className="topbar">SYS.V.3.0 // REALTIME</div>

        <h1 className="title">SAMBUNG KATA</h1>

        <div className="db-badge">
          ● DB_LINKED: {loading ? "LOADING..." : dbCount.toLocaleString("id-ID")}
        </div>

        <div className="welcome">WELCOME, OPERATOR</div>
        <a
  className="operator-tag"
  href="https://www.tiktok.com/@hahaybro0"
  target="_blank"
  rel="noopener noreferrer"
>
  @Moon
</a>

        <div className="game-cover-wrap">
          <img className="game-cover" src="/logo.png" alt="Sambung Kata" />
        </div>

        <div className="clear-hint">PRESS [ESC] TO CLEAR INPUT</div>

        <div className="input-grid">
          <div className="field">
            <label>HURUF AWAL</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="contoh: r"
            />
          </div>

          <div className="field">
            <label>AKHIRAN (OPT)</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="contoh: if"
            />
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
        <div className="output-header">
          <span>&gt;&gt; DATA_OUTPUT</span>
          <span className="count-box">
            {hasSearchInput ? filteredWords.length : 0}
          </span>
        </div>

        <div className="divider" />

        {loading ? (
          <div className="empty-state">Memuat database kata...</div>
        ) : !hasSearchInput ? (
          <div className="empty-state">
            <div className="idle-wrap">
              <div className="idle-bracket">[ _ ]</div>
              <div className="idle-text">TYPE TO INITIATE SCAN...</div>
            </div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="empty-state">
            <div className="idle-wrap">
              <div className="idle-bracket">[ _ ]</div>
              <div className="idle-text">NO MATCH FOUND</div>
            </div>
          </div>
        ) : (
          <div className="result-grid">
            {filteredWords.map((word, index) => (
              <div key={`${word}-${index}`} className="word-chip">
                {word}
              </div>
            ))}
          </div>
        )}
      </div>
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