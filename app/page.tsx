import Link from "next/link";
import {
	CheckCircle2,
	Truck,
	Carrot,
	ShieldCheck,
	Users,
	Store,
	ShoppingBag,
	Headset,
	ArrowRight,
	Sparkles,
} from "lucide-react";

export default function Home() {
	const features = [
		{
			title: "100% Organik",
			description: "Ditanam tanpa pestisida atau bahan kimia sintetis demi kesehatan keluarga Anda.",
			icon: Carrot,
			image: "/images/panen-kangkung.png",
		},
		{
			title: "Kualitas Premium",
			description: "Dipilih dengan standar tinggi, hanya sayur dan buah tersegar yang kami kirimkan.",
			icon: ShieldCheck,
			image: "/images/kualitas-premium.jpg",
		},
		{
			title: "Mitra Petani Lokal",
			description: "Mendukung kesejahteraan komunitas petani lokal dengan harga yang adil.",
			icon: CheckCircle2,
			image: "/images/panen-kangkung.png",
		},
		{
			title: "Pengiriman Cepat",
			description: "Pesanan sampai di depan pintu Anda di hari yang sama dalam kondisi segar.",
			icon: Truck,
			image: "/images/kualitas-premium.jpg",
		},
	];

	return (
		<div className="flex flex-col font-sans">
			{/* Hero Section */}
			<section className="relative flex items-start overflow-hidden bg-white pt-6 md:pt-10 lg:pt-14 pb-20 lg:pb-28">
				{/* Background Glowing Orbs */}
				<div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none z-0"></div>
				<div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-secondary/15 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none z-0"></div>

				<div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center justify-center text-center">
					{/* Text Content */}
					<div className="flex flex-col items-center w-full max-w-4xl mx-auto">
						<div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold mb-6 shadow-xs">
							<Sparkles size={16} className="text-primary" />
							<span>Kini Hadir di Bandung & Sekitarnya</span>
						</div>

						<h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-gray-900 max-w-5xl tracking-tight">
							Sayuran <span className="text-primary">Segar</span>, <br />
							Langsung dari{" "}
							<span className="text-secondary">Pasar Tradisional</span>
						</h1>

						<p className="text-base md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
							SegarTani menyediakan platform belanja bahan masakan kualitas
							premium dengan harga terbaik. Penuhi kebutuhan dapur Anda hari ini langsung ke depan pintu rumah.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
							<Link
								href="/ecommerce"
								className="bg-primary hover:bg-[#008810] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-black text-sm sm:text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
							>
								<ShoppingBag size={22} />
								<span>Mulai Belanja Sekarang</span>
								<ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
							</Link>

							<Link
								href="/daftar-penjual"
								className="bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 hover:border-amber-400 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
							>
								<Store size={20} className="text-amber-700" />
								<span>Daftar Jadi Penjual</span>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-gray-50/60 border-t border-gray-100">
				<div className="container mx-auto px-4 sm:px-6 text-center mb-14">
					<span className="text-primary font-black uppercase tracking-wider text-xs">KEUNGGULAN KAMI</span>
					<h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-1 mb-3">
						Mengapa Memilih SegarTani?
					</h2>
					<div className="w-16 h-1 bg-secondary mx-auto rounded-full" />
				</div>

				<div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
					{features.map((feature, idx) => (
						<div
							key={idx}
							className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
						>
							<div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-300 shadow-2xs">
								<feature.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
							</div>
							<h3 className="text-lg font-black text-gray-900 mb-2">
								{feature.title}
							</h3>
							<p className="text-gray-500 leading-relaxed text-xs sm:text-sm">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-20 bg-white">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="bg-linear-to-b from-[#f8fafc] to-[#f1f5f9] rounded-3xl sm:rounded-4xl shadow-xl p-4 sm:p-8 md:p-14 border border-gray-200/80">
						<div className="text-center mb-12">
							<span className="text-xs font-black uppercase tracking-widest text-primary">DAMPAK SOSIAL & EKONOMI</span>
							<h2 className="text-2xl md:text-4xl font-black text-gray-900 mt-1 leading-tight">
								Bersama, Kami Tumbuhkan{" "}
								<span className="text-primary">Pangan Sehat.</span>
							</h2>
						</div>

						<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 text-center">
							<div className="flex flex-col items-center bg-white p-3.5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
								<div className="w-11 sm:w-14 h-11 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary">
									<Store size={26} />
								</div>
								<h3 className="text-2xl sm:text-4xl font-black text-primary mb-1">
									25+
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
									Pasar Mitra
								</p>
							</div>

							<div className="flex flex-col items-center bg-white p-3.5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
								<div className="w-11 sm:w-14 h-11 sm:h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-3 text-secondary">
									<ShoppingBag size={26} />
								</div>
								<h3 className="text-2xl sm:text-4xl font-black text-secondary mb-1">
									50k+
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
									Produk Terjual
								</p>
							</div>

							<div className="flex flex-col items-center bg-white p-3.5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
								<div className="w-11 sm:w-14 h-11 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary">
									<Users size={26} />
								</div>
								<h3 className="text-2xl sm:text-4xl font-black text-primary mb-1">
									10k+
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
									Pelanggan Aktif
								</p>
							</div>

							<div className="flex flex-col items-center bg-white p-3.5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
								<div className="w-11 sm:w-14 h-11 sm:h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-3 text-secondary">
									<Headset size={26} />
								</div>
								<h3 className="text-2xl sm:text-4xl font-black text-secondary mb-1">
									24/7
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
									Layanan Pelanggan
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonial Section */}
			<section className="py-20 bg-gray-50/50 border-t border-gray-100">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="max-w-4xl mx-auto text-center mb-14">
						<span className="text-xs font-black uppercase tracking-widest text-primary">TESTIMONI PELANGGAN</span>
						<h2 className="text-3xl md:text-5xl font-black text-gray-900 mt-2 mb-3">
							Gabung Bersama 5.000+ Dapur Sehat
						</h2>
						<p className="text-sm md:text-base text-gray-500 font-medium">
							Ibu rumah tangga dan keluarga cerdas yang mempercayakan kebutuhan sayur segar harian bersama SegarTani.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
						<div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
							<p className="text-gray-600 italic text-sm md:text-base mb-6 leading-relaxed">
								&quot;Sayurnya segar banget, pengiriman juga cepat. Sangat membantu
								untuk ibu pekerja seperti saya!&quot;
							</p>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
									R
								</div>
								<div>
									<p className="text-gray-900 font-bold text-sm">Rina</p>
									<p className="text-gray-400 text-xs">Ibu Rumah Tangga, Jakarta</p>
								</div>
							</div>
						</div>

						<div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
							<p className="text-gray-600 italic text-sm md:text-base mb-6 leading-relaxed">
								&quot;Harganya lebih hemat dari supermarket, kualitasnya jauh lebih segar dan tidak layu. Mantap SegarTani!&quot;
							</p>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
									S
								</div>
								<div>
									<p className="text-gray-900 font-bold text-sm">Siti</p>
									<p className="text-gray-400 text-xs">Pelanggan Setia, Depok</p>
								</div>
							</div>
						</div>

						<div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
							<p className="text-gray-600 italic text-sm md:text-base mb-6 leading-relaxed">
								&quot;Bumbu dapurnya lengkap dan selalu fresh. Packing rapi dan higienis. Langganan bulanan sekarang.&quot;
							</p>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm">
									A
								</div>
								<div>
									<p className="text-gray-900 font-bold text-sm">Anisa</p>
									<p className="text-gray-400 text-xs">Pengusaha Kuliner, Tangerang</p>
								</div>
							</div>
						</div>
					</div>

					{/* Banner CTA Bawah */}
					<div className="mt-16 bg-primary text-white rounded-3xl p-8 md:p-12 text-center max-w-5xl mx-auto shadow-xl shadow-primary/20 flex flex-col items-center">
						<h3 className="text-2xl md:text-4xl font-black mb-3">
							Siap Menikmati Sayuran Segar Hari Ini?
						</h3>
						<p className="text-white/80 max-w-xl text-sm md:text-base mb-8">
							Pesan sebelum jam 10 pagi untuk mendapatkan pengiriman di hari yang sama dengan garansi kesegaran 100%.
						</p>
						<Link
							href="/ecommerce"
							className="bg-white text-primary hover:bg-gray-100 font-black px-8 py-4 rounded-full text-base transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-2"
						>
							<ShoppingBag size={20} />
							<span>Lihat Semua Produk di Katalog</span>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
