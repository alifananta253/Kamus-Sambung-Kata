const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "public", "data");
const OUTPUT_DIR = path.join(__dirname, "public", "data");

// File input
const FILES = {
  crowdsource: "kamus_crowdsource.txt",
  words: "kamus_words.txt",
  umum: "kamus_umum.txt",      // format lua map atau txt
  lengkap: "kamus_lengkap.txt" // format lua grouped atau txt
};

function normalizeWord(word) {
  if (!word) return "";
  return String(word)
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "")
    .replace(/\r/g, "")
    .replace(/[^a-zA-ZÀ-ÿ0-9_-]/g, "")
    .trim();
}

// TXT biasa: 1 kata per baris
function extractWordsFromPlainText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("--"))
    .map(normalizeWord)
    .filter(Boolean);
}

// Lua map:
// return {
//   ["meja"] = "benda",
//   ["kursi"] = "benda"
// }
function extractWordsFromLuaMap(text) {
  const words = [];
  const regex = /\["([^"]+)"\]\s*=/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const word = normalizeWord(match[1]);
    if (word) words.push(word);
  }

  return words;
}

// Lua grouped:
// return {
//   ["a"]={"aabi","aamin","abadi"},
//   ["b"]={"baca","badan"}
// }
function extractWordsFromLuaGrouped(text) {
  const words = [];

  const groupRegex = /\["([a-zA-Z])"\]\s*=\s*\{([\s\S]*?)\}/g;
  let groupMatch;

  while ((groupMatch = groupRegex.exec(text)) !== null) {
    const body = groupMatch[2];
    const wordRegex = /"([^"]+)"/g;
    let wordMatch;

    while ((wordMatch = wordRegex.exec(body)) !== null) {
      const word = normalizeWord(wordMatch[1]);
      if (word) words.push(word);
    }
  }

  return words;
}

function detectAndExtract(text, filename) {
  const clean = text.trim();

  // grouped lua
  if (/\["[a-zA-Z]"\]\s*=\s*\{/.test(clean)) {
    console.log(`Parsing ${filename} sebagai Lua grouped`);
    return extractWordsFromLuaGrouped(clean);
  }

  // lua map
  if (/\["[^"]+"\]\s*=/.test(clean)) {
    console.log(`Parsing ${filename} sebagai Lua map`);
    return extractWordsFromLuaMap(clean);
  }

  // plain text
  console.log(`Parsing ${filename} sebagai TXT biasa`);
  return extractWordsFromPlainText(clean);
}

function writeJson(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Tersimpan: ${filePath}`);
}

function writeGroupedJson(filename, words) {
  const grouped = {};

  for (const word of words) {
    const first = word[0] || "#";
    if (!grouped[first]) grouped[first] = [];
    grouped[first].push(word);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = [...new Set(grouped[key])].sort((a, b) =>
      a.localeCompare(b, "id")
    );
  }

  writeJson(filename, grouped);
}

function main() {
  const allWords = new Set();

  for (const [label, fileName] of Object.entries(FILES)) {
    const filePath = path.join(INPUT_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠ File tidak ditemukan: ${filePath}`);
      continue;
    }

    const text = fs.readFileSync(filePath, "utf8");
    const words = detectAndExtract(text, fileName);

    console.log(`- ${fileName}: ${words.length} kata`);

    // simpan hasil per file juga
    writeJson(`${label}.json`, [...new Set(words)].sort((a, b) => a.localeCompare(b, "id")));

    for (const word of words) {
      allWords.add(word);
    }
  }

  const merged = [...allWords].sort((a, b) => a.localeCompare(b, "id"));

  writeJson("kamus.json", merged);
  writeGroupedJson("kamus_grouped.json", merged);

  console.log(`\n🎉 Selesai. Total kata gabungan: ${merged.length}`);
}

main();