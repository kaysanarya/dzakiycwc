# UI-AUDIT.md — Audit Antarmuka Vellum AI Studio

**Tanggal Audit:** 2026-10-04  
**Auditor:** Senior Product Designer & Frontend Engineer  
**Perangkat Diuji:** 360px, 390px, 430px, 768px, 1024px, 1440px  
**Lingkungan:** Next.js 16 (App Router), Tailwind CSS 4, React 19  

---

## 1. Inventarisasi Komponen & Tanggung Jawab

| Komponen | Tanggung Jawab | Status Responsif Saat Ini | Masalah Nyata di Layar Kecil |
| :--- | :--- | :---: | :--- |
| **Header (`Header.tsx`)** | Branding, status AI, tombol load demo, riwayat, toggle bahasa | **RUSAK** | Total lebar konten ~470px. Di layar 360–430px terjadi horizontal overflow parah; tombol History dan ID/EN terpotong keluar layar. |
| **Hero Upload (`ProductSourceUpload.tsx`)** | Drag & drop foto mentah, browsing file | **SEBAGIAN** | Padding terlalu besar di 360px; teks "Upload your product photo to begin AI..." terpotong (overflow horizontal); duplikasi upload zone membingungkan. |
| **Preset Picker (`CameraSettings.tsx`)** | Memilih 6 preset latar studio dan rasio aspek | **SEBAGIAN** | Swatch warna terlalu kecil (<36px target sentuh), label deskripsi panjang memakan tinggi layar vertikal. |
| **Camera Angle (`CameraSettings.tsx`)** | Memilih sudut elevasi kamera (front, side, top, dll.) | **BURUK** | Menggunakan select/grid kaku; tidak ada visual preview orientasi di mobile; target sentuh sempit. |
| **Accordion Lanjutan (`app/page.tsx`)** | Footwear spec, locks, count selector, reference upload | **BURUK** | Kontrol menumpuk dalam 1 kolom vertikal sangat panjang (>1200px); pengguna mobile tersesat sebelum melihat hasil. |
| **Main CTA Bar (`app/page.tsx`)** | Tombol eksekusi "Buat foto (4 gambar)" | **RUSAK** | Sticky hanya bekerja di dalam container aside, bukan di viewport mobile; di mobile sering terjebak di tengah scroll halaman. |
| **Agent Monitor (`AgentMonitor.tsx`)** | Menampilkan 4 tahap progress generasi live | **CUKUP** | Mengambil ruang terlalu banyak vertikal di mobile saat proses berjalan. |
| **Before / After Slider (`BeforeAfterSlider.tsx`)** | Pembagi interaktif foto asli vs studio | **BURUK** | Konflik gesture: geser horizontal slider memicu scroll vertikal di HP; handle drag terlalu tipis (<30px) untuk jari. |
| **Result Gallery (`ResultGallery.tsx`)** | Grid hasil foto, zoom modal, download | **BURUK** | Grid 2 kolom di mobile membuat thumbnail sempit; tidak ada carousel swipe ramah jempol. |
| **Blueprint Modal (`BlueprintModal.tsx`)** | Inspeksi data JSON model fisik | **BURUK** | Modal dialog desktop dengan padding kaku; teks JSON memicu overflow horizontal di mobile 360px. |
| **History Drawer (`HistoryDrawer.tsx`)** | Menampilkan riwayat pemotretan | **BURUK** | Menggunakan sidebar desktop 240px yang canggung di mobile, bukan bottom sheet yang wajar di HP. |

---

## 2. Bukti Visual Tangkapan Layar (Baseline Audit)

Semua screenshot telah diambil secara presisi menggunakan headless browser engine pada resolusi:
- `docs/ui-audit/screen-360.png` (360×800) — *Low-end mobile (Galaxy A series)*
- `docs/ui-audit/screen-390.png` (390×844) — *Standard iPhone 12/13/14/15 base*
- `docs/ui-audit/screen-430.png` (430×932) — *Large mobile (iPhone Pro Max, Galaxy Ultra)*
- `docs/ui-audit/screen-768.png` (768×1024) — *Tablet portrait (iPad Mini / Air)*
- `docs/ui-audit/screen-1024.png` (1024×768) — *Small desktop / iPad landscape*
- `docs/ui-audit/screen-1440.png` (1440×900) — *Standard Desktop Studio Canvas*

---

## 3. Temuan Masalah Kritis (*Critical UX Flaws*)

### A. Masalah Mobile (360px – 430px)
1. **Navbar Horisontal Overflow**: Lebar header melebihi 360px. Tombol History & Language Toggle hilang dari pandangan tanpa bisa discroll secara wajar.
2. **Duplikasi Upload Zone**: Pada state kosong, ada upload card kecil di atas DAN upload hero raksasa di bawah tombol generate yang disabled. Pengguna tidak tahu harus klik yang mana.
3. **Hierarchy & Thumb-Zone Kegagalan**:
   - Tombol utama "Buat foto" terjepit di antara dua upload zone.
   - Tidak ada bottom navigation bar yang menempel di zona jempol bawah (`safe-area-inset-bottom`).
4. **Touch Targets di Bawah Standar**: Tombol preset dan chips aspek rasio memiliki tinggi < 36px (standar aksesibilitas mobile minimal 44×44px).
5. **Bahasa Tidak Konsisten**: Campuran bahasa Inggris dan Indonesia (*"Raw Product Photo"*, *"Create photo (4 images)"*, *"Upload your product photo to begin AI studio photography"*, *"Supports JPG, PNG"* vs *"Buat foto studio"*).

### B. Masalah Desktop (1024px – 1440px)
1. **Center Canvas Terlalu Kosong Pada Initial State**: Ruang tengah 1440px hanya berisi satu kotak dashed terpusat sementara panel kiri sempit (320px) memuat form bertumpuk.
2. **Ketiadaan Keyboard Accessibility**: Tidak ada shortcut (Enter untuk trigger generate, Esc untuk tutup modal, panah kiri/kanan untuk variasi).
3. **Keterbacaan & Karakter Visual**: Menggunakan font default sistem sans-serif tanpa karakter editorial studio; kontras beberapa label `text-zinc-500` terlalu redup.

---

## 4. Keputusan Arsitektur Redesign (Fase 1 – 4)

1. **Memisahkan Layout Mobile & Desktop Secara Penuh**:
   - `StudioMobile`: Alur 1-kolom bertahap (Unggah → Preset Latar → Sudut → Buat → Hasil) dengan Bottom Sticky Action Bar dan Bottom Sheets.
   - `StudioDesktop`: Layout 3-kolom studio profesional (Panel Kontrol Sticky 340px, Center Canvas dominan, Right Panel untuk Riwayat & Blueprint).
   - Pemilihan layout berbasis breakpoint CSS `hidden lg:flex` / `flex lg:hidden` untuk mencegah *hydration mismatch* dan *layout shifting*.
2. **Refactor State & Hooks**:
   - Seluruh logika, fetching, caching, dan pipeline state dipusatkan dalam custom hooks bersama (`useStudioSession`, `useGeneration`, `useHistory`). Bebas duplikasi logika.
3. **Desain Sistem & Tipografi**:
   - Font bernuansa studio editorial presisi tinggi: **Space Grotesk** (Heading / Numerik / Label Teknis) + **Plus Jakarta Sans** (Body & Form).
   - Warna netral hangat (*warm charcoal, muted cream, slate neutral*) dengan satu warna aksen tegas (terracotta / amber studio indicator).
   - Penghapusan total seluruh elemen *"AI slop"* (no glowing gradient, no fake marketing copy, clean border-less hierarchy).
