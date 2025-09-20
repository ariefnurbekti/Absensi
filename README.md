# Aplikasi Absensi & Planner Karyawan

Aplikasi web modern untuk absensi dan manajemen tugas sederhana, dibangun dengan Node.js, Express, dan Google Authentication. Didesain ulang total dengan Tailwind CSS untuk antarmuka yang bersih dan profesional.

## Fitur Utama

*   **Otentikasi Aman:** Login mudah dan aman menggunakan akun Google (Google OAuth 2.0).
*   **Dasbor Interaktif:** Menampilkan status check-in, riwayat absensi, dan data pengguna.
*   **Absensi Sekali Klik:** Tombol check-in yang dinamis dan hanya bisa digunakan sekali sehari.
*   **Perencana Tugas (Planner):** Fitur untuk menambah dan menghapus tugas harian.
*   **UI Modern:** Antarmuka yang sepenuhnya didesain ulang menggunakan Tailwind CSS dengan layout yang konsisten di semua halaman.
*   **Backend Express:** Server backend yang efisien menangani logika bisnis dan API.

**Catatan:** Untuk tujuan demonstrasi dan pengembangan yang cepat, semua data (pengguna, check-in, dan tugas) disimpan di dalam memori server dan akan di-reset setiap kali server dimulai ulang.

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

3.  **Mulai server pengembangan:**

    ```bash
    node index.js
    ```

4.  Buka browser Anda dan navigasikan ke `http://localhost:3000`.

## Deployment

Aplikasi ini dikonfigurasi untuk deployment otomatis ke [Vercel](https://vercel.com/). Setiap `git push` ke branch `main` akan memicu build dan deployment baru.
