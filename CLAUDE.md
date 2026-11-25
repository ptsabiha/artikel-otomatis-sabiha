# Artikel Otomatis SABIHA

Repo publik `ptsabiha/artikel-otomatis-sabiha`. Isinya antrean artikel untuk ptsabiha.com/artikel. Keputusan pemilik (22 Nov 2026): **3 artikel per hari**, hasil riset sendiri, terbit sendiri **tanpa persetujuan per artikel**. Pemilik hanya membatalkan lewat chat kalau perlu.

Pembaca: pengurus/ketua yayasan pendidikan, kepala sekolah/madrasah, bendahara, operator/TU, dan guru (TK sampai SMA/SMK, madrasah, pesantren). Banyak yang dari yayasan kecil-menengah di daerah.

## Alur

1. Routine cloud "Artikel Harian SABIHA" menulis 3 artikel **untuk besok** ke `antrean/<id>/artikel.json`, lalu push ke `main`.
2. GitHub Actions `siapkan.yml` menjalankan `node alat/siapkan.mjs`. Langkahnya:
   - memeriksa setiap artikel;
   - mengunduh foto di kolom `foto`, lalu memotongnya menjadi `sampul.jpg` 1280x720 **tanpa teks** (cetakan `sampul/cetakan.html`);
   - menulis `daftar.json` dan `laporan-cek.txt`;
   - memanggil `POST https://ptsabiha.com/artikel/segarkan`.
3. Situs (Laravel, `ArticleImporter`) menarik artikel di `daftar.json`. Status artikel langsung "Terbit" dengan jam dari kolom `terbit`, jadi artikel baru tampil saat jamnya tiba. Penarikan diulang tiap jam.
4. Artikel yang **tidak lolos pemeriksaan tidak masuk `daftar.json`**, jadi tidak tayang. Lihat `laporan-cek.txt`.

## Jadwal (WIB)

| Jam | Kategori (`kategori`) | Isi |
|---|---|---|
| 07.00 | `manajemen-yayasan` | **Tips manajemen yayasan.** Rotasi subtopik: tata kelola & pengurus yayasan, keuangan & laporan, SDM guru/tendik (rekrut, gaji, kinerja, betah), penerimaan murid baru/SPMB, branding & pemasaran sekolah, akreditasi & mutu, sarana prasarana, hubungan dengan wali murid, digitalisasi administrasi, kepemimpinan kepala sekolah, perencanaan & RAPBS, kepatuhan & legalitas. |
| 12.00 | tanggal **genap**: `bantuan-dan-lomba`; tanggal **ganjil**: `isu-pendidikan` | **Bantuan & Lomba:** info bantuan/hibah untuk yayasan & sekolah, program/beasiswa/pelatihan guru (PPG, tunjangan, sertifikasi, program GTK), beasiswa & bantuan siswa (PIP, KIP, dll.), lomba siswa dan guru (OSN, O2SN, FLS3N/FLS2N, LKS, lomba dari Puspresnas, Kemenag, pemda, swasta). **Isu Pendidikan:** kabar/kebijakan pendidikan terbaru minggu ini dan artinya bagi yayasan. Kalau di hari genap tidak ada info bantuan/lomba yang masih buka dan terverifikasi, tulis isu pendidikan. |
| 19.00 | `manajemen-yayasan` | **Masalah & solusi.** Studi kasus masalah yang sering terjadi di yayasan, mis. guru bagus resign, murid baru turun, SPP menunggak, konflik pengurus dan kepala sekolah, wali murid komplain di grup WA, laporan BOS molor, data dapodik/EMIS kacau. Ceritakan situasinya, penyebabnya, lalu langkah penyelesaiannya. |

## Riset (wajib, pakai WebSearch dan WebFetch)

- Cari kabar 7–14 hari terakhir. Contoh kata kunci: "kemendikdasmen", "bantuan yayasan pendidikan 2026", "hibah sekolah swasta", "lomba siswa SD SMP SMA 2026", "puspresnas", "program guru GTK", "beasiswa guru", "PIP 2026", "Kemenag madrasah bantuan", "yayasan pendidikan" berita.
- Prioritaskan sumber resmi:
  - kementerian/lembaga, mis. kemendikdasmen.go.id, gtk.kemendikdasmen.go.id, puspresnas.kemendikdasmen.go.id, pip.kemendikdasmen.go.id, kemenag.go.id, pendis.kemenag.go.id, kemendiktisaintek.go.id;
  - situs pemerintah daerah;
  - situs JDIH/peraturan.go.id;
  - penyelenggara lomba resmi.
- Sesudah itu baru media tepercaya, mis. antaranews, kompas, detik edu, tempo, republika, media indonesia.
- **Buka (WebFetch) sumbernya.** Jangan menulis dari cuplikan hasil pencarian saja.
- **Info bantuan dan lomba wajib memuat:** nama program, penyelenggara, sasaran, syarat utama, jadwal atau tenggat, cara mendaftar, dan tautan resmi.
  - Tulis tanggal dan angka **hanya kalau tertulis di sumber**.
  - Kalau tidak ketemu, tulis "pantau laman resmi penyelenggara".
  - Program yang tenggatnya **sudah lewat** tidak boleh ditulis sebagai peluang.
- **Aturan dan peraturan:** sebut nomor atau isinya hanya kalau dibaca dari sumber. Jangan mengarang nama program, nominal, pasal, atau kutipan pejabat.
- Pakai nama lembaga sesuai sumber terbaru (mis. Kemendikdasmen, bukan Kemendikbudristek, untuk kabar sejak akhir 2024).
- Hindari berita sensasional atau negatif: kekerasan, kasus korupsi, hoaks, polemik politik. Tantangan pendidikan boleh dibahas dengan nada membangun.

## Gaya tulisan

- Bahasa Indonesia yang baik tapi hangat dan sederhana. Kalimat pendek. Sapa pembaca sebagai "Bapak/Ibu pengurus yayasan" sesekali saja.
- **800–1.300 kata.** Pemeriksa menolak isi di bawah 700 atau di atas 2.000 kata.
  - Pembuka: 1–2 paragraf berisi masalah nyata.
  - Bagian isi: 3–6 subjudul `<h2>`, boleh `<h3>`. Pakai daftar poin atau langkah bernomor.
  - Contoh konkret dari yayasan kecil-menengah.
  - Penutup: bagian praktis, mis. "Langkah yang bisa dimulai minggu ini".
- **Tulisan asli.** Parafrasekan sumber, jangan salin kalimatnya. Kutipan langsung paling banyak satu kalimat pendek, dengan nama sumbernya.
- Judul 25–110 karakter. Judul harus jelas dan berguna, tanpa clickbait, tanpa tanda seru berlebihan, dan tanpa tahun kalau tidak perlu.
- Ringkasan 80–300 karakter, 1–2 kalimat. Ringkasan tampil di Google dan WhatsApp.
- Jangan menulis bagian "Sumber" di isi. Isi kolom `sumber`, nanti situs menambahkannya sendiri di akhir artikel.
- **Akadiva tidak diiklankan di isi.** Jangan menyebut fitur atau harga.
  - Kalau topiknya soal administrasi, keuangan, data, absensi, atau SPP sekolah, isi `"produk": ["akadiva"]`. Situs akan menampilkan kartu Akadiva di bawah artikel.
  - Kalau topiknya modul ajar atau kurikulum, isi `["modul-ajar"]`.
  - Selain itu, isi `[]`.
- Jangan mengulang topik yang sama dalam 30 hari. Baca judul di `daftar.json` dan folder `antrean/` sebelum memilih topik.

## Foto sampul (wajib, sejak 25 Nov 2026)

Keputusan pemilik: sampul artikel **harus foto asli**, bukan banner teks buatan, dan **sumber fotonya wajib ditulis**. Situs menampilkan keterangan "Foto: … / situs (lisensi)" di bawah sampul.

- **Hanya foto yang boleh dipakai ulang secara sah:** Wikimedia Commons (utama), Unsplash, Pexels, Pixabay, atau Flickr. Lisensinya CC0, Public domain, CC BY, CC BY-SA, Unsplash/Pexels/Pixabay License. **Tanpa NC dan ND.**
- **Jangan** mengambil foto dari Google Images biasa, situs berita, Instagram, atau situs sekolah/pemerintah. Foto-foto itu berhak cipta, dan bisa membuat situs kena aduan hak cipta.
- Cara mencari (Wikimedia Commons, API resmi tanpa kunci):
  - `node alat/cari-foto.mjs "teacher classroom Indonesia" --pratinjau`. Bahasa Inggris biasanya memberi hasil lebih banyak. Alat ini hanya menampilkan foto mendatar ≥1600 px dengan lisensi yang boleh, plus isian `foto` siap tempel.
  - Kategori yang kaya foto Indonesia: "Teachers in Indonesia", "Classrooms in Indonesia", "Students in Indonesia", "School uniforms of Indonesia", "Madrasas in Indonesia", "Education in Indonesia", "Banknotes of Indonesia", "Meetings in Indonesia".
  - Kalau `cari-foto.mjs` gagal karena jaringan (lingkungan cloud), pakai WebFetch ke API Commons yang sama, mis. `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search&gsrnamespace=6&gsrsearch=teacher%20Indonesia%20filetype:bitmap&gsrlimit=20&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1920&iiextmetadatafilter=Artist|LicenseShortName|ImageDescription`, atau buka halaman `File:` fotonya dengan WebFetch untuk menyalin kredit dan lisensi. Kalau `cek` memberi PERINGATAN jaringan, itu bukan kegagalan; GitHub Actions mengunduh dan memeriksa ulang fotonya.
  - **Lihat pratinjaunya dulu** (buka berkas di `sampul/_pratinjau/` dengan Read). Pilih foto yang nyambung dengan topik, utamakan suasana sekolah/madrasah/pesantren Indonesia. Hindari foto yang memuat logo merek, wajah anak yang sedang dalam situasi memalukan, atau teks besar yang tidak berhubungan.
- Isi kolom `foto` di `artikel.json`:

```json
"foto": {
  "berkas": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../1920px-....jpg",
  "halaman": "https://commons.wikimedia.org/wiki/File:....jpg",
  "situs": "Wikimedia Commons",
  "kredit": "Nama fotografer/pemilik persis seperti di halaman sumber",
  "lisensi": "CC BY-SA 4.0",
  "keterangan": "Isi foto dalam bahasa Indonesia, 10-160 karakter",
  "posisi": "center"
}
```

  - `berkas` = alamat gambar langsung (untuk Commons pakai ukuran 1920 px dari `cari-foto.mjs`); `halaman` = halaman foto itu di situs sumber.
  - `kredit` dan `lisensi` disalin dari halaman sumber, jangan dikarang.
  - `keterangan` menjelaskan apa yang tampak di foto (jadi teks alternatif dan keterangan di situs), bukan judul artikel.
  - `posisi` (opsional) menggeser potongan 16:9, mis. `"top"` atau `"50% 30%"` bila wajah terpotong.
- Satu foto hanya untuk satu artikel. Pemeriksa menolak foto yang sudah dipakai artikel lain, foto yang lebih kecil dari 1000 px, foto tegak (perbandingan < 1,2:1), lisensi yang tidak boleh, atau isian yang kosong.

## Format `antrean/<id>/artikel.json`

`<id>` = `YYYY-MM-DD-HHMM-judul-pendek`, mis. `2026-11-23-0700-lima-laporan-keuangan-yayasan`. Gunakan huruf kecil, angka, dan tanda hubung; tanggal dan jamnya sama dengan `terbit`.

```json
{
  "judul": "5 Laporan Keuangan yang Wajib Dibaca Pengurus Yayasan Setiap Bulan",
  "ringkasan": "Laporan keuangan bukan formalitas. Lima laporan ini membantu pengurus melihat kesehatan yayasan sebelum masalah membesar.",
  "kategori": "manajemen-yayasan",
  "terbit": "2026-11-23T07:00:00+07:00",
  "isi_html": "<p>...</p><h2>...</h2><p>...</p>",
  "sumber": [{ "judul": "Nama halaman - Nama situs", "url": "https://..." }],
  "produk": ["akadiva"],
  "foto": { "berkas": "https://...", "halaman": "https://...", "situs": "Wikimedia Commons", "kredit": "...", "lisensi": "CC BY-SA 4.0", "keterangan": "..." },
  "batal": false
}
```

- `isi_html`: hanya tag `p h2 h3 ul ol li strong em a blockquote br table thead tbody tr th td`. Tanpa `h1`, gambar, `style`, atau markdown. Tautan di isi wajib `https://`.
- `sumber`: minimal 1 untuk `manajemen-yayasan`, minimal 2 untuk `isu-pendidikan` dan `bantuan-dan-lomba`. Semua `https://` dan semuanya sudah dibuka.
- `foto`: wajib, lihat bagian "Foto sampul".
- Jangan membuat `sampul.jpg` dan jangan mengubah `daftar.json`; keduanya dibuat GitHub Actions.

## Langkah routine harian

1. Jalankan `git checkout -q main && git pull -q`. Lalu `TZ=Asia/Jakarta date` untuk tanggal hari ini; BESOK = tanggal sesudahnya.
2. Cek slot besok yang masih kosong: `ls antrean | grep ^<BESOK>`. Isi **hanya slot kosong** (0700, 1200, 1900).
3. Baca `laporan-cek.txt`. Artikel yang tidak lolos dan jamnya belum lewat **diperbaiki dulu**.
4. Riset, lalu tulis setiap artikel ke `antrean/<id>/artikel.json`.
5. Cari foto sampul tiap artikel (`node alat/cari-foto.mjs "<kata kunci>" --pratinjau`), lihat pratinjaunya, lalu isi kolom `foto`.
6. Jalankan `node alat/siapkan.mjs cek <id1> <id2> <id3>`. Perintah ini juga mengunduh fotonya. Perbaiki sampai semuanya "lolos".
7. `git add antrean && git commit -m "Artikel <BESOK>" && git pull -q --rebase && git push -q`.
8. Kalau push ditolak, ulangi pull --rebase lalu push.

## Membatalkan atau memperbaiki

- **Membatalkan** artikel yang belum tayang: ubah `"batal": true` di `artikel.json` lalu push. Situs mengembalikannya ke draf.
- **Artikel yang sudah tayang** diubah atau dihapus lewat panel ptsabiha.com/admin. Repo tidak lagi menyentuh isi artikel yang sudah tayang, sudah dihapus, atau sudah diedit orang di panel. **Pengecualian: sampul.** Kalau kolom `foto` artikel yang sudah tayang diganti lalu di-push, situs mengganti sampul dan keterangan sumbernya saja (kecuali artikel itu sudah diedit di panel).
- **Memperbaiki** artikel yang belum tayang: ubah `artikel.json` lalu push. Situs memperbaruinya, kecuali kalau sudah diedit di panel.

## Batas wajib

- Jangan menyentuh token, kata sandi, atau berkas `.env` apa pun.
- Jangan login ke situs mana pun dan jangan mengisi formulir pendaftaran bantuan atau lomba.
- Jangan menulis tentang PonpesGo (dihentikan 2 Nov 2026).
