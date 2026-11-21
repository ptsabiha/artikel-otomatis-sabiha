#!/usr/bin/env node
// Alat antrean Artikel Otomatis SABIHA. Tanpa paket npm.
//
//   node alat/siapkan.mjs cek <id> [<id> ...]   periksa artikel (dipakai routine sebelum push)
//   node alat/siapkan.mjs                       periksa semua, buat sampul yang belum ada,
//                                               tulis daftar.json + laporan-cek.txt (GitHub Actions)
//   node alat/siapkan.mjs --tanpa-sampul        sama, tanpa membuat sampul (mis. tidak ada Chrome)
//
// Artikel yang tidak lolos pemeriksaan TIDAK masuk daftar.json, jadi tidak ditarik situs.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ANTREAN = join(AKAR, 'antrean');
const DAFTAR = join(AKAR, 'daftar.json');

export const KATEGORI = {
  'manajemen-yayasan': { nama: 'Manajemen Yayasan', warna: '#F2B705', teks: '#0E2A4F', gelap: '#1F4E8C', minSumber: 1 },
  'isu-pendidikan': { nama: 'Isu Pendidikan', warna: '#E04A50', teks: '#ffffff', gelap: '#C0262D', minSumber: 2 },
  'bantuan-dan-lomba': { nama: 'Bantuan & Lomba', warna: '#2BB38A', teks: '#ffffff', gelap: '#0F7B5F', minSumber: 2 },
};
const PRODUK = ['akadiva', 'modul-ajar', 'kurir-atk'];
const POLA_ID = /^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})-[a-z0-9-]{3,120}$/;
const TAG_BOLEH = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'a', 'blockquote', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td']);

const teksPolos = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const normal = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

function bacaArtikel(id) {
  const berkas = join(ANTREAN, id, 'artikel.json');
  if (!existsSync(berkas)) return { galat: ['artikel.json tidak ada'] };
  const mentah = readFileSync(berkas);
  try {
    return { data: JSON.parse(mentah.toString('utf8')), mentah };
  } catch (e) {
    return { galat: ['artikel.json bukan JSON yang sah: ' + e.message] };
  }
}

/** Periksa satu artikel. Mengembalikan daftar masalah (kosong = lolos). */
export function cekArtikel(id, data, judulLain = []) {
  const masalah = [];
  const m = POLA_ID.exec(id);
  if (!m) masalah.push('nama folder harus YYYY-MM-DD-HHMM-judul-pendek (huruf kecil, angka, tanda hubung)');

  const judul = String(data.judul ?? '').trim();
  if (judul.length < 25 || judul.length > 110) masalah.push(`judul ${judul.length} karakter (harus 25–110)`);
  if (/[*#]|^\s*judul\s*:/i.test(judul)) masalah.push('judul berisi tanda markdown');
  const sama = judulLain.find((j) => normal(j) === normal(judul));
  if (sama) masalah.push(`judul sudah pernah dipakai: "${sama}"`);

  const ringkasan = String(data.ringkasan ?? '').trim();
  if (ringkasan.length < 80 || ringkasan.length > 300) masalah.push(`ringkasan ${ringkasan.length} karakter (harus 80–300)`);

  if (!KATEGORI[data.kategori]) masalah.push(`kategori harus salah satu: ${Object.keys(KATEGORI).join(', ')}`);

  const terbit = String(data.terbit ?? '');
  const t = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):00\+07:00$/.exec(terbit);
  if (!t) masalah.push('terbit harus berformat YYYY-MM-DDTHH:MM:00+07:00 (WIB)');
  else if (m && (t[1] !== m[1] || t[2] !== m[2] || t[3] !== m[3])) masalah.push('tanggal/jam di nama folder tidak sama dengan "terbit"');

  const isi = String(data.isi_html ?? '');
  const kata = teksPolos(isi).split(' ').filter(Boolean).length;
  if (kata < 700 || kata > 2000) masalah.push(`isi ${kata} kata (harus 700–2000)`);
  const jumlahH2 = (isi.match(/<h2[\s>]/gi) || []).length;
  if (jumlahH2 < 3) masalah.push(`baru ${jumlahH2} subjudul <h2> (minimal 3)`);
  for (const [, tag] of isi.matchAll(/<\/?([a-z0-9]+)/gi)) {
    if (!TAG_BOLEH.has(tag.toLowerCase())) { masalah.push(`tag <${tag}> tidak boleh dipakai`); break; }
  }
  if (/\son[a-z]+\s*=|javascript:|style\s*=/i.test(isi)) masalah.push('isi berisi atribut terlarang (on…=, style=, javascript:)');
  if (/\*\*|^#{1,3}\s|\n#{1,3}\s|\[[^\]]+\]\([^)]+\)/m.test(isi)) masalah.push('isi masih berisi tanda markdown (**, ##, [..](..)); pakai HTML');
  if (/<h2[^>]*>\s*(sumber|referensi|daftar pustaka)/i.test(isi)) masalah.push('jangan menulis bagian Sumber di isi_html; isi kolom "sumber" (situs menambahkannya)');

  const sumber = Array.isArray(data.sumber) ? data.sumber : [];
  const sumberSah = sumber.filter((s) => s && typeof s.judul === 'string' && s.judul.trim() && /^https:\/\/[^\s]+$/.test(String(s.url ?? '')));
  if (sumberSah.length !== sumber.length) masalah.push('setiap sumber wajib {"judul", "url": "https://..."}');
  const minSumber = KATEGORI[data.kategori]?.minSumber ?? 1;
  if (sumberSah.length < minSumber) masalah.push(`sumber minimal ${minSumber} untuk kategori ini`);

  const produk = data.produk ?? [];
  if (!Array.isArray(produk) || produk.some((p) => !PRODUK.includes(p))) masalah.push(`produk hanya boleh: ${PRODUK.join(', ')}`);
  if ('batal' in data && typeof data.batal !== 'boolean') masalah.push('batal harus true atau false');

  return masalah;
}

function semuaId() {
  if (!existsSync(ANTREAN)) return [];
  return readdirSync(ANTREAN, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

function cariChrome() {
  const calon = [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return calon.find((p) => existsSync(p)) ?? null;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buatSampul(chrome, id, data) {
  const k = KATEGORI[data.kategori];
  const judul = String(data.judul).trim();
  const ukuran = judul.length > 85 ? 54 : judul.length > 60 ? 62 : 72;
  const html = readFileSync(join(AKAR, 'sampul', 'cetakan.html'), 'utf8')
    .replaceAll('{{JUDUL}}', esc(judul))
    .replaceAll('{{KATEGORI}}', esc(k.nama))
    .replaceAll('{{WARNA}}', k.warna)
    .replaceAll('{{WARNA_TEKS}}', k.teks)
    .replaceAll('{{WARNA_GELAP}}', k.gelap)
    .replaceAll('{{UKURAN}}', String(ukuran));
  const sementara = join(AKAR, 'sampul', '_sementara.html');
  writeFileSync(sementara, html);
  const keluar = join(ANTREAN, id, 'sampul.png');
  try {
    execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
      '--force-device-scale-factor=1', '--window-size=1280,720', '--virtual-time-budget=6000',
      `--screenshot=${keluar}`, pathToFileURL(sementara).href,
    ], { stdio: 'ignore', timeout: 90_000 });
  } finally {
    unlinkSync(sementara);
  }
  return existsSync(keluar);
}

function judulTerpakai(kecuali) {
  const judul = [];
  for (const id of semuaId()) {
    if (id === kecuali) continue;
    const { data } = bacaArtikel(id);
    if (data?.judul && !data.batal) judul.push(String(data.judul));
  }
  return judul;
}

function perintahCek(ids) {
  let gagal = 0;
  for (const id of ids) {
    const { data, galat } = bacaArtikel(id);
    const masalah = galat ?? cekArtikel(id, data, judulTerpakai(id));
    if (masalah.length) {
      gagal++;
      console.log(`TIDAK LOLOS ${id}`);
      for (const x of masalah) console.log('  - ' + x);
    } else {
      console.log(`lolos ${id}`);
    }
  }
  process.exit(gagal ? 1 : 0);
}

function perintahSiapkan(tanpaSampul) {
  const lama = existsSync(DAFTAR) ? JSON.parse(readFileSync(DAFTAR, 'utf8')) : { artikel: [] };
  const kunciLama = new Map((lama.artikel ?? []).map((a) => [a.id, a.sampul_kunci]));
  const chrome = tanpaSampul ? null : cariChrome();
  if (!tanpaSampul && !chrome) console.log('Peringatan: Chrome tidak ditemukan, sampul tidak dibuat.');

  const artikel = [];
  const laporan = [];
  const judulDipakai = [];
  for (const id of semuaId()) {
    const { data, mentah, galat } = bacaArtikel(id);
    const masalah = galat ?? cekArtikel(id, data, data?.batal ? [] : judulDipakai);
    if (masalah.length) {
      laporan.push(`TIDAK LOLOS ${id}\n` + masalah.map((x) => '  - ' + x).join('\n'));
      continue;
    }
    if (!data.batal) judulDipakai.push(data.judul);

    const kunciSampul = hash(`${data.judul}|${data.kategori}`);
    const berkasSampul = join(ANTREAN, id, 'sampul.png');
    let adaSampul = existsSync(berkasSampul);
    if (chrome && !data.batal && (!adaSampul || kunciLama.get(id) !== kunciSampul)) {
      try {
        adaSampul = buatSampul(chrome, id, data);
        console.log(`sampul dibuat: ${id}`);
      } catch (e) {
        laporan.push(`SAMPUL GAGAL ${id}: ${e.message}`);
      }
    }
    const sampulMentah = adaSampul ? readFileSync(berkasSampul) : Buffer.alloc(0);

    artikel.push({
      id,
      judul: data.judul,
      kategori: data.kategori,
      terbit: data.terbit,
      hash: hash(Buffer.concat([mentah, sampulMentah])),
      sampul: adaSampul,
      sampul_kunci: kunciSampul,
      batal: Boolean(data.batal),
    });
  }

  artikel.sort((a, b) => b.terbit.localeCompare(a.terbit));
  const isi = { keterangan: 'Dibuat otomatis oleh alat/siapkan.mjs. Jangan diubah tangan.', artikel };
  const teksBaru = JSON.stringify(isi, null, 2) + '\n';
  if (!existsSync(DAFTAR) || readFileSync(DAFTAR, 'utf8') !== teksBaru) writeFileSync(DAFTAR, teksBaru);
  writeFileSync(join(AKAR, 'laporan-cek.txt'), laporan.length ? laporan.join('\n\n') + '\n' : 'Semua artikel lolos pemeriksaan.\n');

  console.log(`${artikel.length} artikel di daftar.json, ${laporan.length} masalah.`);
  for (const x of laporan) console.log(x);
}

const [perintah, ...sisa] = process.argv.slice(2);
if (perintah === 'cek') {
  if (!sisa.length) { console.log('Pakai: node alat/siapkan.mjs cek <id> [<id> ...]'); process.exit(2); }
  perintahCek(sisa);
} else {
  perintahSiapkan(perintah === '--tanpa-sampul');
}
