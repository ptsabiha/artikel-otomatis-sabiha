#!/usr/bin/env node
// Cari foto asli berlisensi bebas di Wikimedia Commons untuk sampul artikel.
//
//   node alat/cari-foto.mjs "guru mengajar kelas sekolah dasar indonesia"
//   node alat/cari-foto.mjs "school teacher Indonesia" --jumlah 15 --pratinjau
//
// Hanya menampilkan foto mendatar >= 1600 px dengan lisensi yang boleh (lihat alat/foto.mjs).
// Setiap calon dicetak lengkap dengan isian "foto" siap tempel ke artikel.json.
// --pratinjau menyimpan gambar kecil ke sampul/_pratinjau/ supaya bisa dilihat dulu (Read).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLA_LISENSI, UA } from './foto.mjs';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv.slice(2);
const kata = arg.filter((a, i) => !a.startsWith('--') && arg[i - 1] !== '--jumlah').join(' ').trim();
const jumlah = Number(arg[arg.indexOf('--jumlah') + 1]) || 10;
const pratinjau = arg.includes('--pratinjau');
if (!kata) {
  console.log('Pakai: node alat/cari-foto.mjs "kata kunci" [--jumlah 10] [--pratinjau]');
  process.exit(2);
}

const polos = (html) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let coba = 1; coba <= 4; coba++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
    const json = await res.json().catch(() => ({}));
    if (!json.error) return json;
    if (coba === 4) throw new Error(json.error.info ?? 'API Commons galat');
    await new Promise((r) => setTimeout(r, 3000 * coba));
  }
}

const hasil = await api({
  action: 'query',
  generator: 'search',
  gsrnamespace: '6',
  gsrsearch: `${kata} filetype:bitmap`,
  gsrlimit: String(Math.min(50, jumlah * 4)),
  prop: 'imageinfo',
  iiprop: 'url|size|mime|extmetadata',
  iiurlwidth: '1920',
  iiextmetadatafilter: 'Artist|Credit|LicenseShortName|ImageDescription|ObjectName|AttributionRequired',
});

const halaman = (hasil.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
let n = 0;
if (pratinjau) mkdirSync(join(AKAR, 'sampul', '_pratinjau'), { recursive: true });

for (const p of halaman) {
  const ii = p.imageinfo?.[0];
  if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
  const m = ii.extmetadata ?? {};
  const lisensi = polos(m.LicenseShortName?.value);
  if (!POLA_LISENSI.test(lisensi)) continue;
  if (ii.width < 1600 || ii.width / ii.height < 1.25) continue;

  const kredit = (polos(m.Artist?.value) || polos(m.Credit?.value) || 'Tidak diketahui').slice(0, 120);
  const ket = polos(m.ImageDescription?.value).slice(0, 300);
  const berkas = (ii.width > 1920 && ii.thumburl ? ii.thumburl : ii.url).replace(/\?.*$/, '');
  n++;
  console.log(`\n#${n} ${p.title}  ${ii.width}x${ii.height}  ${lisensi}`);
  console.log(`   oleh: ${kredit}`);
  if (ket) console.log(`   isi : ${ket}`);
  console.log('   "foto": ' + JSON.stringify({
    berkas,
    halaman: ii.descriptionurl,
    situs: 'Wikimedia Commons',
    kredit,
    lisensi,
    keterangan: '(tulis isi foto dalam bahasa Indonesia, 10-160 karakter)',
  }));
  if (pratinjau) {
    const kecil = berkas.includes('/thumb/') ? berkas.replace(/\/1920px-/, '/500px-') : ii.thumburl?.replace(/\/1920px-/, '/500px-') ?? berkas;
    try {
      const r = await fetch(kecil, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const awalan = kata.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
        const f = join(AKAR, 'sampul', '_pratinjau', `${awalan}-${n}.jpg`);
        writeFileSync(f, Buffer.from(await r.arrayBuffer()));
        console.log(`   pratinjau: ${f}`);
      }
    } catch { /* lewati */ }
  }
  if (n >= jumlah) break;
}
if (!n) console.log('Tidak ada foto yang cocok. Coba kata kunci lain (bahasa Inggris sering lebih banyak hasil).');
