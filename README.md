# Artikel Otomatis SABIHA

Antrean artikel harian untuk [ptsabiha.com/artikel](https://ptsabiha.com/artikel): 3 artikel per hari tentang yayasan pendidikan, yaitu tips manajemen, isu pendidikan, info bantuan, dan lomba.

- `antrean/<tanggal-jam-judul>/artikel.json`: naskah yang ditulis routine Claude.
- `sampul.jpg` (foto asli berlisensi bebas dari kolom `foto`, dipotong 16:9) dan `daftar.json`: dibuat GitHub Actions (`alat/siapkan.mjs`).
- `alat/cari-foto.mjs`: pencari foto sampul di Wikimedia Commons, lengkap dengan kredit dan lisensinya.
- Situs menarik artikel lewat `POST /artikel/segarkan`. Artikel tampil sesuai jam terbitnya.

Panduan lengkap ada di `CLAUDE.md`.
