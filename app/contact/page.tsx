'use client';

import React, { useState, useId, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ShoppingBag,
  Store,
  CreditCard,
  Truck,
  ShieldCheck,
  MessageCircle,
  Mail,
  MapPin,
  Send,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  category: 'buyer' | 'seller' | 'payment' | 'shipping';
  categoryLabel: string;
  question: string;
  answer: string | React.ReactNode;
}

const FAQ_DATA: FAQItem[] = [
  // ===== KATEGORI: PEMBELI =====
  {
    id: 'b-1',
    category: 'buyer',
    categoryLabel: 'Pembeli',
    question: 'Bagaimana cara berbelanja sayur dan buah segar di SegarTani?',
    answer:
      'Untuk berbelanja, Anda cukup membuka halaman "Katalog Belanja", pilih produk sayuran atau buah yang diinginkan, tentukan jumlahnya, lalu klik "Tambah ke Keranjang". Setelah selesai memilih, buka keranjang belanja Anda, periksa ringkasan pesanan, gunakan voucher diskon jika ada, lalu lanjutkan ke halaman Checkout untuk mengisi alamat pengiriman dan konfirmasi pembayaran.',
  },
  {
    id: 'b-2',
    category: 'buyer',
    categoryLabel: 'Pembeli',
    question: 'Apakah produk sayuran dan buah benar-benar dipetik segar langsung dari petani?',
    answer:
      'Ya, 100% segar! SegarTani bermitra langsung dengan kelompok tani lokal di area Batu dan Malang. Produk sayuran dan buah baru dipanen sesuai pesanan yang masuk sehingga menjaga tingkat nutrisi, kesegaran, dan kerenyahan maksimal sampai ke dapur Anda tanpa perantara berbelit.',
  },
  {
    id: 'b-3',
    category: 'buyer',
    categoryLabel: 'Pembeli',
    question: 'Bagaimana jika produk yang saya terima layu, rusak, atau busuk? (Garansi Kesegaran 100%)',
    answer:
      'Kami memiliki Kebijakan Garansi Kesegaran 100%. Jika ada produk yang rusak, layu tidak wajar, atau tidak sesuai pesanan, segera foto produk tersebut bersama nota pesanan dalam waktu 1x24 jam setelah barang diterima. Hubungi kami via WhatsApp Layanan Pelanggan atau Chat Penjual, dan kami akan segera mengirimkan produk pengganti baru atau pengembalian dana (refund) tanpa proses yang rumit.',
  },
  {
    id: 'b-4',
    category: 'buyer',
    categoryLabel: 'Pembeli',
    question: 'Bagaimana cara melacak pesanan saya yang sedang dikirim?',
    answer:
      'Anda dapat memantau status pesanan kapan saja melalui menu panel "Pesanan Saya" (/orders). Di sana status akan terupdate secara real-time: Menunggu Konfirmasi → Sedang Diproses Petani → Dalam Pengiriman Kurir → Pesanan Selesai. Anda juga akan menerima notifikasi otomatis saat kurir mulai mengantar pesanan Anda.',
  },
  {
    id: 'b-5',
    category: 'buyer',
    categoryLabel: 'Pembeli',
    question: 'Apakah saya bisa berkonsultasi atau bertanya langsung ke petani sebelum membeli?',
    answer:
      'Tentu saja! SegarTani menyediakan fitur "Chat Penjual" (/chat). Anda dapat langsung mengirim pesan kepada pemilik toko/petani untuk menanyakan ketersediaan panen hari ini, tingkat kematangan buah, atau permintaan kemasan khusus.',
  },
  {
    id: 'b-6',
    category: 'buyer',
    categoryLabel: 'Pembeli',
    question: 'Bagaimana cara memberikan ulasan dan rating untuk produk yang telah saya beli?',
    answer:
      'Setelah pesanan Anda berstatus "Selesai", Anda dapat membuka menu "Ulasan Saya" (/reviews) atau riwayat pesanan Anda. Klik tombol "Beri Ulasan", berikan rating bintang 1 hingga 5, serta tuliskan pengalaman kesegaran produk dan pelayanan penjual. Ulasan Anda sangat berharga bagi kemajuan petani lokal!',
  },

  // ===== KATEGORI: PENJUAL & PETANI =====
  {
    id: 's-1',
    category: 'seller',
    categoryLabel: 'Penjual & Petani',
    question: 'Bagaimana cara mendaftar sebagai Penjual atau Mitra Petani di SegarTani?',
    answer:
      'Untuk mendaftar, buka halaman Registrasi (/register) dan pilih tab "Daftar sebagai Penjual", atau akses menu "Daftar Penjual" (/daftar-penjual). Isi formulir berupa nama toko, nomor WhatsApp aktif, lokasi kebun/gudang, dan jenis komoditas hasil tani yang Anda kelola. Akun toko Anda akan langsung aktif dan siap digunakan untuk memajang produk panen.',
  },
  {
    id: 's-2',
    category: 'seller',
    categoryLabel: 'Penjual & Petani',
    question: 'Apa saja kriteria produk hasil tani yang boleh dipasarkan di SegarTani?',
    answer:
      'SegarTani mengutamakan komoditas sayuran segar, buah-buahan organik, rempah & bumbu dapur, umbi-umbian, serta produk olahan hasil panen lokal yang higienis, bebas bahan kimia berbahaya berlebih, dan layak konsumsi. Penjual wajib mencantumkan deskripsi kondisi barang, tanggal panen jika ada, dan foto asli produk.',
  },
  {
    id: 's-3',
    category: 'seller',
    categoryLabel: 'Penjual & Petani',
    question: 'Bagaimana cara mengunggah produk baru dan memperbarui stok barang?',
    answer:
      'Masuk ke "Mode Penjual", lalu buka menu "Produk" (/admin/products). Klik tombol "Tambah Produk", masukkan nama produk, kategori, harga per kilogram/ikat, stok panen yang tersedia, serta unggah foto produk berkualitas baik. Anda dapat mengedit harga dan menambah stok kapan saja dengan satu kali klik.',
  },
  {
    id: 's-4',
    category: 'seller',
    categoryLabel: 'Penjual & Petani',
    question: 'Apa yang harus dilakukan penjual saat ada pesanan baru masuk?',
    answer:
      'Ketika ada pesanan masuk, Anda akan menerima notifikasi lonceng secara langsung. Buka menu "Pesanan" (/admin/orders), periksa rincian barang yang dipesan dan alamat pembeli, lalu ubah status menjadi "Sedang Diproses" untuk mulai menyiapkan panen dan packing. Setelah barang diserahkan ke kurir, ubah status menjadi "Dalam Pengiriman".',
  },
  {
    id: 's-5',
    category: 'seller',
    categoryLabel: 'Penjual & Petani',
    question: 'Bagaimana panduan pengemasan (packing) sayur & buah agar tidak rusak di perjalanan?',
    answer:
      'Pastikan sayuran berdaun dalam kondisi kering dari tetesan air berlebih sebelum dibungkus kertas/plastik berpori agar tidak mudah busuk. Untuk buah-buahan yang mudah memar, gunakan jaring busa (foam net) atau sekat kardus. Jangan mencampur komoditas yang menghasilkan gas etilen tinggi (seperti pisang/tomat matang) dengan sayuran hijau sensitif dalam satu kantong rapat.',
  },
  {
    id: 's-6',
    category: 'seller',
    categoryLabel: 'Penjual & Petani',
    question: 'Kapan dan bagaimana dana hasil penjualan masuk ke penjual?',
    answer:
      'Dana hasil penjualan pesanan Anda akan otomatis dicatat ke akun penjual setelah pembeli mengonfirmasi penerimaan barang atau saat pesanan diselesaikan oleh sistem. Anda dapat memantau akumulasi penjualan di menu "Dashboard Penjual" (/admin/dashboard).',
  },

  // ===== KATEGORI: PEMBAYARAN & VOUCHER =====
  {
    id: 'p-1',
    category: 'payment',
    categoryLabel: 'Pembayaran & Voucher',
    question: 'Metode pembayaran apa saja yang diterima di SegarTani?',
    answer:
      'SegarTani mendukung berbagai metode pembayaran yang mudah dan aman: Transfer Bank Otomatis (BCA, Mandiri, BRI, BNI), QRIS (GoPay, OVO, Dana, ShopeePay, LinkAja), serta fitur pembayaran langsung saat kurir mengantar pesanan (COD - Cash on Delivery) untuk wilayah tertentu.',
  },
  {
    id: 'p-2',
    category: 'payment',
    categoryLabel: 'Pembayaran & Voucher',
    question: 'Bagaimana cara mengklaim dan menggunakan voucher promo diskon?',
    answer:
      'Kunjungi halaman "Voucher & Promo Saya" (/vouchers). Di sana Anda bisa melihat berbagai kupon seperti SEGAR10 (Diskon 10%), DISKON20K (Potongan Rp 20.000), atau ONGKIRSEGAR (Potongan Ongkir). Klik tombol "Gunakan Voucher", maka diskon akan otomatis memotong total belanjaan Anda saat di halaman Checkout.',
  },
  {
    id: 'p-3',
    category: 'payment',
    categoryLabel: 'Pembayaran & Voucher',
    question: 'Apakah kode voucher bisa digabungkan dengan promo lainnya?',
    answer:
      'Dalam satu kali transaksi checkout, Anda dapat memasangkan 1 kode voucher diskon belanja utama. Namun, harga produk yang sudah memiliki diskon coret di katalog tetap berlaku dan dapat diakumulasikan dengan potongan voucher Anda.',
  },

  // ===== KATEGORI: PENGIRIMAN & KURIR =====
  {
    id: 'k-1',
    category: 'shipping',
    categoryLabel: 'Pengiriman',
    question: 'Wilayah mana saja yang dijangkau oleh pengiriman SegarTani?',
    answer:
      'Saat ini pengiriman kilat panen segar kami melayani seluruh area Kota Batu, Kota Malang, dan Kabupaten Malang. Untuk produk hasil tani tahan lama (umbi-umbian, rempah kering, olahan agribisnis), kami juga melayani pengiriman ke seluruh Jawa Timur dan kota-kota besar di Indonesia melalui ekspedisi reguler bergaransi.',
  },
  {
    id: 'k-2',
    category: 'shipping',
    categoryLabel: 'Pengiriman',
    question: 'Kapan jadwal waktu pengiriman panen dilakukan?',
    answer:
      'Untuk menjamin sayur dan buah tetap segar, pengiriman harian dilakukan dalam dua sesi: Sesi Pagi (07.00 - 11.00 WIB) untuk pesanan yang masuk malam sebelumnya, dan Sesi Sore (14.00 - 17.30 WIB). Pesanan panen pagi akan langsung diantar pada hari yang sama.',
  },
  {
    id: 'k-3',
    category: 'shipping',
    categoryLabel: 'Pengiriman',
    question: 'Berapa tarif ongkos kirim dan bagaimana cara mendapatkan gratis ongkir?',
    answer:
      'Tarif ongkos kirim dihitung berdasarkan jarak kilometer dari kebun petani mitra ke alamat penerima. Anda bisa mendapatkan gratis ongkir atau potongan ongkir hingga Rp 15.000 dengan menggunakan voucher "ONGKIRSEGAR" pada transaksi minimal Rp 75.000 di halaman checkout.',
  },
];

export default function ContactPage() {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // FAQ State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'buyer' | 'seller' | 'payment' | 'shipping'>('all');
  const [openIds, setOpenIds] = useState<string[]>(['b-1', 'b-3', 's-1']); // default open questions

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setOpenIds(FAQ_DATA.map((f) => f.id));
  };

  const collapseAll = () => {
    setOpenIds([]);
  };

  const filteredFAQs = FAQ_DATA.filter((item) => {
    // Filter Kategori
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    // Filter Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = typeof item.answer === 'string' && item.answer.toLowerCase().includes(q);
      return matchQ || matchA;
    }
    return true;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = `Halo SegarTani, saya ingin menghubungi Pusat Bantuan.%0A%0A*Nama:* ${name}%0A*Email:* ${email}%0A*Pertanyaan/Pesan:*%0A${message}`;
    window.open(`https://wa.me/6287789727616?text=${text}`, '_blank');
  };

  const categoryTabs = [
    { id: 'all', label: 'Semua Pertanyaan', count: FAQ_DATA.length, icon: HelpCircle },
    { id: 'buyer', label: 'Pembeli', count: FAQ_DATA.filter((f) => f.category === 'buyer').length, icon: ShoppingBag },
    { id: 'seller', label: 'Penjual & Petani', count: FAQ_DATA.filter((f) => f.category === 'seller').length, icon: Store },
    { id: 'payment', label: 'Pembayaran & Voucher', count: FAQ_DATA.filter((f) => f.category === 'payment').length, icon: CreditCard },
    { id: 'shipping', label: 'Pengiriman', count: FAQ_DATA.filter((f) => f.category === 'shipping').length, icon: Truck },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-primary/10 via-white to-gray-50 pt-24 pb-16 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4">
            <HelpCircle size={15} />
            Pusat Bantuan & FAQ SegarTani
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Ada yang Bisa <span className="text-primary">Kami Bantu?</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Temukan jawaban lengkap seputar cara belanja sayur & buah organik, panduan berjualan bagi petani lokal, pembayaran, pengiriman, dan garansi kesegaran.
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto shadow-lg shadow-gray-200/50 rounded-2xl">
            <Search
              size={20}
              className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan (misal: ongkir, garansi sayur busuk, cara jadi penjual)..."
              className="w-full pl-12 sm:pl-14 pr-4 py-4 sm:py-4.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded-md"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main FAQ Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategory === tab.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <tab.icon size={15} className="shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      activeCategory === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Expand / Collapse Controls */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-primary transition-colors"
              >
                Buka Semua
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="hover:text-primary transition-colors"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {/* Results Counter if searching */}
          {searchQuery && (
            <div className="mb-4 text-xs sm:text-sm font-semibold text-gray-500">
              Menampilkan {filteredFAQs.length} hasil pencarian untuk &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {/* FAQ Accordion List */}
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-3">
                <HelpCircle size={32} />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">
                Pertanyaan tidak ditemukan
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Coba gunakan kata kunci lain, atau langsung tanyakan kepada kami melalui WhatsApp di bawah.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Tampilkan Semua Pertanyaan
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredFAQs.map((faq) => {
                const isOpen = openIds.includes(faq.id);

                return (
                  <motion.div
                    key={faq.id}
                    layout
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                      isOpen
                        ? 'border-primary/40 ring-2 ring-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Question Header (Clickable) */}
                    <button
                      type="button"
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {faq.categoryLabel}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                          {faq.question}
                        </h3>
                      </div>

                      <div
                        className={`p-2 rounded-xl transition-all flex-shrink-0 mt-0.5 ${
                          isOpen
                            ? 'bg-primary text-white rotate-180'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    {/* Answer Dropdown (Animated) */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 font-normal leading-relaxed border-t border-gray-50">
                            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/60 text-gray-800">
                              {faq.answer}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help? Contact & WhatsApp Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
              Layanan Bantuan Pelanggan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 mb-2">
              Belum Menemukan Jawaban?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Tim dukungan SegarTani siap membantu Anda setiap hari (07.00 - 21.00 WIB). Jangan ragu untuk menghubungi kami langsung.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Quick Contact Cards */}
            <div className="space-y-4">
              <a
                href="https://wa.me/6287789727616"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-50 to-green-50/50 border border-emerald-200/70 rounded-2xl hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <MessageCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                      WhatsApp CS SegarTani
                    </h4>
                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Respon Cepat
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">+62 877 8972 7616 (Chat Langsung)</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-200">
                  <Mail size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                    Email Bantuan Resmi
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">info@segartani.com / support@segartani.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-200">
                  <MapPin size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                    Kantor & Kebun Sentral
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Jl. Agribisnis No. 123, Batu, Jawa Timur, Indonesia
                  </p>
                </div>
              </div>

              {/* Quick links banner */}
              <div className="p-5 rounded-2xl bg-primary text-white flex items-center justify-between gap-4 shadow-lg shadow-primary/20">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-200">
                    Ingin Memulai?
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    Mulai belanja produk panen segar sekarang
                  </p>
                </div>
                <Link
                  href="/ecommerce"
                  className="px-4 py-2 bg-white text-primary text-xs font-black rounded-xl hover:bg-gray-100 transition-colors shrink-0 shadow-sm"
                >
                  Ke Katalog
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 p-6 sm:p-8 rounded-3xl border border-gray-200">
              <h3 className="text-lg font-black text-gray-900 mb-1">
                Kirim Pertanyaan Khusus
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                Kirimkan pesan Anda dan tim kami akan segera membalasnya via WhatsApp.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor={nameId} className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                    placeholder="Nama Anda"
                  />
                </div>

                <div>
                  <label htmlFor={emailId} className="block text-xs font-bold text-gray-700 mb-1">
                    Alamat Email (Opsional)
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                    placeholder="email@contoh.com"
                  />
                </div>

                <div>
                  <label htmlFor={messageId} className="block text-xs font-bold text-gray-700 mb-1">
                    Pertanyaan / Kendala Anda
                  </label>
                  <textarea
                    id={messageId}
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                    placeholder="Tuliskan kendala atau hal yang ingin Anda tanyakan seputar SegarTani..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Send size={16} />
                  <span>Kirim Pesan ke WhatsApp CS</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
