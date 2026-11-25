// Aturan foto sampul: foto asli berlisensi bebas, lengkap dengan sumbernya.
// Dipakai alat/siapkan.mjs (pemeriksa + pembuat sampul) dan alat/cari-foto.mjs.

export const UA = 'ArtikelOtomatisSABIHA/1.0 (https://ptsabiha.com/artikel; github.com/ptsabiha/artikel-otomatis-sabiha)';

/** Situs foto yang boleh dipakai. `berkas` = host gambar, `halaman` = host halaman sumber. */
export const SUMBER_FOTO = [
  { situs: 'Wikimedia Commons', berkas: /^(upload|thumb)\.wikimedia\.org$/, halaman: /^commons\.wikimedia\.org$/ },
  { situs: 'Unsplash', berkas: /^images\.unsplash\.com$/, halaman: /^unsplash\.com$/ },
  { situs: 'Pexels', berkas: /^images\.pexels\.com$/, halaman: /^(www\.)?pexels\.com$/ },
  { situs: 'Pixabay', berkas: /^cdn\.pixabay\.com$/, halaman: /^pixabay\.com$/ },
  { situs: 'Flickr', berkas: /^live\.staticflickr\.com$/, halaman: /^(www\.)?flickr\.com$/ },
];

// Boleh dipakai untuk situs perusahaan: domain publik, CC0, CC BY, CC BY-SA, dan lisensi bebas situs stok.
// NC (non-komersial) dan ND (tanpa turunan) sengaja tidak masuk.
export const POLA_LISENSI = /^(CC0( 1\.0)?|Public domain|Domain publik|CC BY(-SA)? [1-4]\.0( [a-z]{2,6})?|Unsplash License|Pexels License|Pixabay (Content )?License)$/i;

const host = (url) => { try { return new URL(url).hostname.toLowerCase(); } catch { return ''; } };

/** Pemeriksaan isian `foto` di artikel.json (tanpa mengunduh). */
export function cekIsianFoto(foto) {
  const masalah = [];
  if (!foto || typeof foto !== 'object') return ['"foto" wajib diisi (foto asli berlisensi bebas + sumbernya); lihat CLAUDE.md bagian "Foto sampul"'];

  const berkas = String(foto.berkas ?? '');
  const halaman = String(foto.halaman ?? '');
  if (!/^https:\/\/\S+$/.test(berkas)) masalah.push('foto.berkas harus alamat gambar https://');
  if (!/^https:\/\/\S+$/.test(halaman)) masalah.push('foto.halaman harus alamat halaman sumber https://');

  const sumber = SUMBER_FOTO.find((s) => s.berkas.test(host(berkas)));
  if (!sumber) masalah.push(`foto.berkas harus dari: ${SUMBER_FOTO.map((s) => s.situs).join(', ')} (bukan dari situs berita/Google Images biasa)`);
  else if (!sumber.halaman.test(host(halaman))) masalah.push(`foto.halaman harus halaman foto itu di ${sumber.situs}`);
  if (sumber && foto.situs && foto.situs !== sumber.situs) masalah.push(`foto.situs harus "${sumber.situs}"`);

  const kredit = String(foto.kredit ?? '').trim();
  if (kredit.length < 2 || kredit.length > 120) masalah.push('foto.kredit (nama fotografer/pemilik) wajib, 2–120 karakter');
  if (/<|>/.test(kredit)) masalah.push('foto.kredit tanpa tag HTML');

  const lisensi = String(foto.lisensi ?? '').trim();
  if (!POLA_LISENSI.test(lisensi)) masalah.push(`foto.lisensi "${lisensi}" tidak boleh; pakai CC0, Public domain, CC BY x.0, CC BY-SA x.0, Unsplash/Pexels/Pixabay License (tanpa NC/ND)`);

  const ket = String(foto.keterangan ?? '').trim();
  if (ket.length < 10 || ket.length > 160) masalah.push('foto.keterangan (isi foto, untuk teks alternatif) wajib, 10–160 karakter');

  if ('posisi' in foto && !/^[a-z0-9% .]{1,30}$/i.test(String(foto.posisi))) masalah.push('foto.posisi mis. "center", "top", atau "50% 30%"');
  return masalah;
}

export function situsFoto(berkas) {
  return SUMBER_FOTO.find((s) => s.berkas.test(host(berkas)))?.situs ?? '';
}

/** Ukuran gambar dari kepala berkas JPEG/PNG/WebP. */
export function ukuranGambar(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { jenis: 'png', lebar: buf.readUInt32BE(16), tinggi: buf.readUInt32BE(20) };
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const k = buf.toString('ascii', 12, 16);
    if (k === 'VP8 ') return { jenis: 'webp', lebar: buf.readUInt16LE(26) & 0x3fff, tinggi: buf.readUInt16LE(28) & 0x3fff };
    if (k === 'VP8L') { const b = buf.readUInt32LE(21); return { jenis: 'webp', lebar: (b & 0x3fff) + 1, tinggi: ((b >> 14) & 0x3fff) + 1 }; }
    if (k === 'VP8X') return { jenis: 'webp', lebar: 1 + buf.readUIntLE(24, 3), tinggi: 1 + buf.readUIntLE(27, 3) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const pjg = buf.readUInt16BE(i + 2);
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
        return { jenis: 'jpg', tinggi: buf.readUInt16BE(i + 5), lebar: buf.readUInt16BE(i + 7) };
      }
      i += 2 + pjg;
    }
  }
  return null;
}

/** Unduh foto lalu pastikan benar gambar mendatar yang cukup besar. */
export async function unduhFoto(berkas) {
  let res;
  try {
    res = await fetch(berkas, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    return { masalah: [`foto.berkas tidak bisa diunduh: ${e.cause?.code ?? e.message}`], jaringan: true };
  }
  // 403/407 dari proxy jaringan (mis. lingkungan cloud) dianggap masalah jaringan, bukan masalah foto.
  if (!res.ok) return { masalah: [`foto.berkas menjawab HTTP ${res.status}`], jaringan: res.status === 403 || res.status === 407 };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 20 * 1024 * 1024) return { masalah: ['foto.berkas lebih dari 20 MB; pakai ukuran 1920 px'] };
  const u = ukuranGambar(buf);
  if (!u) return { masalah: ['foto.berkas bukan gambar JPEG/PNG/WebP'] };
  const masalah = [];
  if (u.lebar < 1000) masalah.push(`foto hanya ${u.lebar}px lebarnya (minimal 1000px)`);
  if (u.lebar / u.tinggi < 1.2) masalah.push(`foto ${u.lebar}x${u.tinggi} tidak mendatar (perbandingan minimal 1,2:1); pilih foto landscape`);
  return { masalah, buf, ...u };
}

/** Kunci pembanding foto (sama = foto yang sama walau ukurannya beda). */
export function kunciFoto(foto) {
  const h = String(foto?.halaman ?? '').toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
  return h.replace(/^https:\/\/(www\.)?/, '');
}
