'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Star, ShoppingCart, ChevronDown, ArrowRight } from 'lucide-react';

// Data Katalog Bahan Masakan SegarTani (Static Data untuk Demo Berkualitas)
const products = [
  // Sayuran
  { id: 1, name: "Bayam Hijau Segar", category: "Sayuran", price: 5000, discount: 0, rating: 4.8, image: "https://image.astronauts.cloud/product-images/2025/5/1Cover6_c8dc0d4f-3883-47c7-8a5d-a528cc767576_900x900.png" },
  { id: 2, name: "Wortel Organik", category: "Sayuran", price: 12000, discount: 10, rating: 4.7, image: "https://image.astronauts.cloud/product-images/2026/2/Wortel2_e84e65b4-7b9d-4e8f-aa1d-8f4b79c9556d_900x900.jpg" },
  { id: 3, name: "Brokoli Premium", category: "Sayuran", price: 18000, discount: 5, rating: 4.9, image: "https://image.astronauts.cloud/product-images/2024/11/1Cover1509dc8276ad894d9a9bb69dead8712275900x900_421814ec-b39e-40ca-8761-e60c9075186c_900x900.png" },
  { id: 4, name: "Kentang Dieng", category: "Sayuran", price: 15000, discount: 0, rating: 4.6, image: "https://image.astronauts.cloud/product-images/2024/5/1Cover12_923a9c26-62a8-44cf-82b9-11ddee85b330_900x900.png" },

  // Buah
  { id: 5, name: "Apel Fuji Manis", category: "Buah", price: 35000, discount: 15, rating: 4.9, image: "https://image.astronauts.cloud/product-images/2024/5/1CoverApelFujiEnvyPremium_ba07531f-71cb-4cd2-b6a7-a30b8869c932_900x900.png" },
  { id: 6, name: "Jeruk Sunkist", category: "Buah", price: 28000, discount: 0, rating: 4.7, image: "https://image.astronauts.cloud/product-images/2024/7/1Cover_e0f99659-92d9-454e-9815-92b0961c4902_900x900.png" },
  { id: 7, name: "Pisang Cavendish", category: "Buah", price: 20000, discount: 0, rating: 4.8, image: "https://image.astronauts.cloud/product-images/2025/10/PisangCavendish3_f3285ad7-0b8e-4b0a-ba71-77bc9442dccb_900x900.jpg" },
  { id: 8, name: "Mangga Harum Manis", category: "Buah", price: 25000, discount: 10, rating: 4.9, image: "https://image.astronauts.cloud/product-images/2024/6/Cover212_8c6bbfd8-6cc7-494f-bc4f-5799569dc167_900x900.png" },

  // Daging
  { id: 9, name: "Daging Sapi Sirloin", category: "Daging", price: 145000, discount: 5, rating: 4.9, image: "https://image.astronauts.cloud/product-images/2024/6/1Cover_38a78651-9a82-4b63-b185-98b17e7c510b_900x900.png" },
  { id: 10, name: "Ayam Kampung Utuh", category: "Daging", price: 85000, discount: 0, rating: 4.7, image: "https://image.astronauts.cloud/product-images/2024/12/ayamutuh_ae270fca-101e-48bb-9db2-d4669b4a2fd5_700x697.jpg" },
  { id: 11, name: "Telur Ayam Negeri (1kg)", category: "Daging", price: 28000, discount: 0, rating: 4.6, image: "https://image.astronauts.cloud/product-images/2024/10/telur15pcs_9c2d284a-ad27-496e-b43a-522eed5a0d57_900x900.jpg" },
  { id: 12, name: "Ikan Gurame Segar", category: "Daging", price: 45000, discount: 10, rating: 4.8, image: "https://image.astronauts.cloud/product-images/2024/1/gurame_b3af22e0-8b6d-4cd7-9763-dcfa4e31d55f_900x900.jpg" },

  // Bumbu Masak
  { id: 13, name: "Bawang Merah", category: "Bumbu Masak", price: 32000, discount: 0, rating: 4.6, image: "https://image.astronauts.cloud/product-images/2024/5/1Cover48_c11abbc8-ed8b-4bc3-b955-f383e49883c8_900x900.png" },
  { id: 14, name: "Bawang Putih", category: "Bumbu Masak", price: 30000, discount: 0, rating: 4.5, image: "https://down-id.img.susercontent.com/file/eaf0edba07a24a79e3de6b668a39aaf3" },
  { id: 15, name: "Cabai Merah Keriting", category: "Bumbu Masak", price: 45000, discount: 20, rating: 4.7, image: "https://image.astronauts.cloud/product-images/2024/5/1CoverCabeMerahKeriting_64c962aa-74c6-4242-a0d9-a4800850560c_900x900.png" },
  { id: 16, name: "Jahe", category: "Bumbu Masak", price: 22000, discount: 0, rating: 4.6, image: "https://image.astronauts.cloud/product-images/2024/5/1Cover_ded25d79-1793-43d8-a703-a8595ac4b3a5_900x900.jpg" },
  { id: 17, name: "Kunyit", category: "Bumbu Masak", price: 15000, discount: 0, rating: 4.5, image: "https://desagrogol.gunungkidulkab.go.id/assets/files/artikel/sedang_1724401291KUNYIT.jpg" },
  { id: 18, name: "Lengkuas", category: "Bumbu Masak", price: 12000, discount: 0, rating: 4.7, image: "https://image.astronauts.cloud/product-images/2025/4/1Cover620f070ad9e4d441239ff305bad8ca1036900x900_915c9b4e-ebaf-48fb-86c8-15b5670d27fa_900x900.png" },
  { id: 19, name: "Tomat Merah", category: "Sayuran", price: 10000, discount: 5, rating: 4.7, image: "https://image.astronauts.cloud/product-images/2024/5/1Cover70_440135bb-63c8-43d8-b2ca-b4f2cbfdecf6_900x900.png" },
  { id: 20, name: "Semangka", category: "Buah", price: 30000, discount: 0, rating: 4.9, image: "https://image.astronauts.cloud/product-images/2025/12/semangkamerah1e2d514cbb12a4c29a3aae53d852f4171900x900_70acf90d-4f7b-48f6-86ce-736ae6b4e284_900x900.jpg" },
];

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

function ProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'Semua');

  const categories = ['Semua', 'Sayuran', 'Buah', 'Daging', 'Bumbu Masak'];

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    
    if (activeCategory && activeCategory !== 'Semua') {
      params.set('category', activeCategory);
    } else {
      params.delete('category');
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchQuery, activeCategory, pathname, router, searchParams]);

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      {/* Header Section - Clean White with Green Accent */}
      <div className="bg-white pt-24 pb-12 px-6 text-center border-b border-gray-100 shadow-sm">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
          Katalog Bahan Masakan <span className="text-[#00AA13]">Segar</span><span className="text-[#FF9F1C]">Tani</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg mb-6">
          Kebutuhan dapur lengkap mulai dari sayuran, buah, hingga bumbu masak berkualitas.
        </p>
        <Link
          href="/ecommerce"
          className="inline-flex items-center gap-2 bg-[#00AA13] text-white px-6 py-3 rounded-full font-bold hover:bg-[#008810] transition-all shadow-lg"
        >
          Belanja Sekarang <ArrowRight size={18} />
        </Link>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Combined Filter Bar */}
        <div className="max-w-6xl mx-auto py-12 px-0 md:px-6">
          <div className="flex flex-col sm:flex-row items-center bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-md focus-within:border-[#2E7D32] focus-within:ring-4 focus-within:ring-[#2E7D32]/10 transition-all duration-300">

            {/* Search Input Part */}
            <div className="relative flex-grow w-full border-b sm:border-b-0 sm:border-r border-gray-100">
              <input
                type="text"
                placeholder="Cari bahan masakan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 md:py-5 focus:outline-none bg-transparent text-gray-800 placeholder-gray-400 font-bold"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2E7D32] h-6 w-6" />
            </div>

            {/* Category Dropdown Part */}
            <div className="relative w-full sm:w-72 bg-white">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none bg-transparent text-gray-700 py-4 md:py-5 px-6 pr-12 focus:outline-none font-black cursor-pointer text-xs uppercase tracking-wider"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="font-sans normal-case">
                    {cat === 'Semua' ? 'Semua Kategori' : cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-[#2E7D32]">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const discountPrice = product.price - (product.price * product.discount / 100);

              return (
                <div key={product.id} className="group flex flex-col h-full bg-white rounded-[2rem] border border-gray-100 hover:border-[#2E7D32] transition-all duration-500 overflow-hidden hover:shadow-2xl">
                  {/* Image Container */}
                  <div className="relative aspect-square w-full bg-white flex justify-center items-center overflow-hidden">
                    {product.discount > 0 && (
                      <div className="absolute top-5 left-5 z-10">
                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                          DISKON {product.discount}%
                        </span>
                      </div>
                    )}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                    <div className="absolute top-5 right-5">
                      <span className="bg-white/90 backdrop-blur-sm text-[#2E7D32] text-[10px] font-black px-3 py-1 rounded-lg border border-[#2E7D32]/20">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Details Container */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-1 text-yellow-400 mb-2">
                      <Star size={14} className="fill-current" />
                      <span className="text-xs font-bold text-gray-400 ml-1">{product.rating.toFixed(1)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-4 group-hover:text-[#2E7D32] transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                      <div className="flex flex-col">
                        {product.discount > 0 && (
                          <span className="text-xs text-gray-400 line-through font-medium">
                            {formatIDR(product.price)}
                          </span>
                        )}
                        <span className="text-xl font-black text-[#2E7D32]">
                          {formatIDR(discountPrice)}
                        </span>
                      </div>
                      <Link 
                        href="/ecommerce"
                        className="p-3.5 rounded-2xl bg-white border border-gray-100 text-gray-900 hover:bg-[#2E7D32] hover:text-white transition-all shadow-sm"
                      >
                        <ShoppingCart size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Produk Tidak Ditemukan</h3>
              <p className="text-gray-400 max-w-sm mx-auto mb-10">
                Maaf, bahan masakan yang Anda cari tidak tersedia dalam kategori ini.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
                className="bg-[#2E7D32] text-white px-10 py-4 rounded-full font-bold shadow-xl hover:shadow-[#2E7D32]/30 active:scale-95 transition-all"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 font-bold animate-pulse">Memuat...</p>
      </div>
    }>
      <ProductContent />
    </React.Suspense>
  );
}
