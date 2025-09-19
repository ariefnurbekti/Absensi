# Absensi - Aplikasi Dasbor PT Nira Medika

Aplikasi dasbor web berfungsi penuh yang dibuat dengan Node.js, Express, dan MongoDB. Aplikasi ini menyediakan fungsionalitas pendaftaran pengguna, login, dan absensi, bersama dengan visualisasi data untuk riwayat absensi.

## Fitur

- **Autentikasi Pengguna:** Pengguna dapat membuat akun dan login. Kata sandi di-hash menggunakan `bcrypt` untuk keamanan.
- **Fungsionalitas Absensi:** Pengguna yang sudah login dapat melakukan absensi. Setiap absensi dicatat dengan nama pengguna dan stempel waktu.
- **Dasbor Dinamis:** Menampilkan riwayat absensi dalam tabel dan bagan batang yang memvisualisasikan data absensi selama seminggu terakhir.
- **Backend RESTful:** Dibangun dengan Express.js untuk menangani permintaan data.
- **Database MongoDB:** Data pengguna dan absensi disimpan dalam database NoSQL MongoDB.

## Prasyarat

Pastikan Anda telah menginstal perangkat lunak berikut:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community)

## Penyiapan & Instalasi

1.  **Kloning repositori:**
    ```bash
    git clone https://github.com/ariefnurbekti/Absensi.git
    cd Absensi
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **Pastikan Server MongoDB Anda berjalan:**
    Buka terminal terpisah dan mulai layanan MongoDB (perintah dapat bervariasi tergantung pada sistem operasi Anda).

4.  **Mulai aplikasi:**
    ```bash
    node server.js
    ```

5.  Buka browser Anda dan navigasikan ke `http://localhost:3000`.

## Struktur Proyek

- `server.js`: File server utama (backend Express).
- `index.html`: Halaman beranda.
- `login.html`: Halaman login.
- `register.html`: Halaman pendaftaran.
- `dashboard.html`: Dasbor utama setelah login.
- `package.json`: Mencantumkan dependensi proyek.
- `css/style.css`: Lembar gaya untuk frontend.
