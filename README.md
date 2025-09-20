# Project Management Platform (Evolved from AbsensiApp)

Aplikasi web yang awalnya merupakan aplikasi absensi sederhana, kini telah berkembang menjadi platform manajemen proyek yang fungsional dengan papan Kanban interaktif. Dibangun dengan Node.js, Express, dan Tailwind CSS, dengan penyimpanan data yang persisten.

## Evolusi Proyek

Proyek ini dimulai sebagai aplikasi absensi karyawan dengan fitur check-in dan perencana tugas sederhana. Melalui serangkaian pengembangan, fungsionalitas inti telah dirombak total untuk fokus pada manajemen proyek, mengadopsi metodologi Kanban sebagai pusatnya.

## Fitur Utama

*   **Otentikasi Google:** Login yang aman dan mudah menggunakan akun Google (OAuth 2.0).
*   **Papan Proyek Kanban:** Visualisasikan alur kerja dengan papan Kanban yang interaktif.
    *   **Drag & Drop:** Pindahkan kartu tugas antar kolom dengan mudah.
    *   **Kolom Dinamis:** Atur tugas dalam kolom seperti "Backlog", "In Progress", dan "Done".
*   **Manajemen Tugas (CRUD):**
    *   **Create:** Tambah kartu tugas baru ke kolom mana pun.
    *   **Read:** Klik kartu untuk membuka modal dan melihat detail (judul dan deskripsi).
    *   **Update:** Edit judul dan deskripsi tugas langsung dari modal.
    *   **Delete:** Hapus kartu tugas dari papan.
*   **Penyimpanan Data Persisten:** Semua data papan, kolom, dan kartu disimpan dalam file `db.json` menggunakan `lowdb`, sehingga semua perubahan akan tetap ada bahkan setelah server dimulai ulang.
*   **UI Modern & Responsif:** Antarmuka yang bersih dan fungsional dibangun dengan Tailwind CSS.

## Prasyarat

*   [Node.js](https://nodejs.org/) (versi 14 atau lebih baru)

## Memulai Secara Lokal

1.  **Kloning repositori:**

    ```bash
    git clone https://github.com/ariefnurbekti/Absensi.git
    cd Absensi
    ```

2.  **Instal dependensi:**

    ```bash
    npm install
    ```

3.  **Konfigurasi Variabel Lingkungan:**
    Buat file `.env` di root proyek dan tambahkan kredensial Google OAuth Anda:
    ```
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

4.  **Mulai server pengembangan:**

    ```bash
    node index.js
    ```

5.  Buka browser Anda dan navigasikan ke `http://localhost:3000`.

## Deployment

Aplikasi ini dikonfigurasi untuk deployment otomatis ke [Vercel](https://vercel.com/). Setiap `git push` ke branch `main` akan memicu build dan deployment baru.
