import Image from "next/image";
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
} from "lucide-react";

export default function Home() {
	const features = [
		{
			title: "100% Organik",
			description: "Ditanam tanpa pestisida atau bahan kimia sintetis.",
			icon: Carrot,
			image:
				"/images/panen-kangkung.png",
		},
		{
			title: "Kualitas Premium",
			description: "Hanya produk terbaik dan tersegar yang kami kirimkan.",
			icon: ShieldCheck,
			image: "/images/kualitas-premium.jpg",
		},
		{
			title: "Petani Lokal",
			description: "Mendukung komunitas petani lokal di wilayah Batu.",
			icon: CheckCircle2,
			image:
				"https://i1.wp.com/www.agroindustri.id/wp-content/uploads/2017/06/perkebunan-teh-1000x600-1.jpg",
		},
		{
			title: "Pengiriman Cepat",
			description: "Pesanan sampai di depan pintu Anda dalam kondisi segar.",
			icon: Truck,
			image:
				"https://monitorday.com/wp-content/uploads/2025/03/kurirpaket.webp",
		},
	];

	return (
		<div className="flex flex-col">
			{/* Hero Section */}
			<section className="relative flex items-start overflow-hidden bg-white pt-2 md:pt-4 lg:pt-8 pb-20 lg:pb-28">
				{/* Background Glowing Orbs - Spaced Out for White Center */}
				<div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-primary rounded-full blur-[140px] opacity-[0.25] -translate-y-1/3 translate-x-1/4 pointer-events-none z-0"></div>
				<div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-secondary rounded-full blur-[140px] opacity-[0.20] translate-y-1/3 -translate-x-1/4 pointer-events-none z-0"></div>

				<div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
					{/* Text Content */}
					<div className="flex flex-col items-center w-full max-w-4xl mx-auto">
						<span
							className="inline-block bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold mb-8 mt-0"
							data-aos="fade-up"
						>
							Kini Hadir di Bandung & Sekitarnya
						</span>

						<h1
							className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-8 text-gray-900 max-w-5xl tracking-tight"
							data-aos="fade-up"
							data-aos-delay="100"
						>
							Sayuran <span className="text-primary">Segar</span>, <br />
							Langsung dari{" "}
							<span className="text-secondary">Pasar Tradisional</span>
						</h1>

						<p
							className="text-lg md:text-xl text-gray-500 mb-12 leading-relaxed max-w-2xl mx-auto font-medium"
							data-aos="fade-up"
							data-aos-delay="200"
						>
							SegarTani menyediakan platform belanja bahan masakan kualitas
							premium dengan harga terbaik. Penuhi kebutuhan dapur Anda hari
							ini.
						</p>

						<div className="flex flex-col sm:flex-row gap-6 justify-center">
							<Link
								href="/about"
								className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
								data-aos="fade-up"
								data-aos-delay="300"
							>
								Pelajari Tentang Kami
							</Link>
							<Link
								href="/contact"
								className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-3.5 rounded-full font-bold text-lg transition-all flex items-center justify-center shadow-sm"
								data-aos="fade-up"
								data-aos-delay="400"
							>
								Hubungi Kami
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-24 bg-white">
				<div
					className="container mx-auto px-6 text-center mb-16"
					data-aos="fade-up"
					data-aos-delay={200}
				>
					<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
						Mengapa SegarTani?
					</h2>
					<div className="w-20 h-1 bg-secondary mx-auto rounded-full" />
				</div>
				<div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
					{features.map((feature, idx) => (
						<div
							key={idx}
							className="text-center group"
							data-aos="fade-up"
							data-aos-delay={idx * 100}
						>
							{feature.image ? (
								<div className="relative w-full h-40 rounded-2xl overflow-hidden mx-auto mb-6">
									<Image
										src={feature.image}
										alt={feature.title}
										fill
										sizes="(max-width: 768px) 100vw, 25vw"
										priority={idx <= 1}
										className="object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
							) : (
								<div className="w-16 h-16 bg-natural rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors duration-300">
									<feature.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
								</div>
							)}
							<h3 className="text-xl font-bold text-gray-900 mb-3">
								{feature.title}
							</h3>
							<p className="text-gray-600 leading-relaxed text-sm">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-20 bg-[#FAFAFA]">
				<div className="container mx-auto px-6">
					<div
						className="bg-white rounded-[3rem] shadow-xl p-10 md:p-16 border border-gray-50"
						data-aos="zoom-in"
					>
						<div className="text-center mb-16 overflow-hidden">
							<h2 className="text-xl md:text-3xl lg:text-4xl font-black text-black leading-tight whitespace-nowrap">
								Bersama, Kami Tumbuhkan{" "}
								<span className="text-primary">Pangan Sehat.</span>
							</h2>
						</div>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
							<div className="flex flex-col items-center">
								<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
									<Store className="w-8 h-8 text-primary" />
								</div>
								<h3 className="text-4xl md:text-5xl font-black text-primary mb-3">
									25+
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm">
									Pasar Mitra
								</p>
							</div>
							<div className="flex flex-col items-center">
								<div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
									<ShoppingBag className="w-8 h-8 text-secondary" />
								</div>
								<h3 className="text-4xl md:text-5xl font-black text-secondary mb-3">
									50k+
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm">
									Produk Terjual
								</p>
							</div>
							<div className="flex flex-col items-center">
								<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
									<Users className="w-8 h-8 text-primary" />
								</div>
								<h3 className="text-4xl md:text-5xl font-black text-primary mb-3">
									10k+
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm">
									Pelanggan Aktif
								</p>
							</div>
							<div className="flex flex-col items-center">
								<div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
									<Headset className="w-8 h-8 text-secondary" />
								</div>
								<h3 className="text-4xl md:text-5xl font-black text-secondary mb-3">
									24/7
								</h3>
								<p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm">
									Layanan
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Combined Style Testimonial Section */}
			<section className="py-24 bg-white border-t border-gray-100">
				<div className="container mx-auto px-6 text-left">
					<div className="max-w-6xl mb-16 pl-4 md:pl-12" data-aos="fade-right">
						<h2 className="text-5xl md:text-6xl font-black text-black leading-tight tracking-tighter mb-2">
							Gabung Bersama
						</h2>
						<h2 className="text-5xl md:text-6xl font-black text-primary leading-tight tracking-tighter mb-8">
							5000+ Ibu Rumah Tangga
						</h2>
						<p className="text-xl text-gray-500 font-medium">
							Jangan Lewatkan Promo &quot;Dapur Sehat&quot; Setiap Minggunya.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
						{/* Card 1 */}
						<div
							className="bg-white p-10 rounded-[2.5rem] text-left border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
							data-aos="fade-up"
							data-aos-delay={100}
						>
							<p className="text-gray-600 italic text-lg mb-10 leading-relaxed">
								&quot;Sayurnya segar banget, pengiriman juga cepat. Sangat membantu
								untuk ibu pekerja seperti saya!&quot;
							</p>
							<p className="text-primary font-bold text-lg">
								- Rina, Jakarta
							</p>
						</div>

						{/* Card 2 */}
						<div
							className="bg-white p-10 rounded-[2.5rem] text-left border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
							data-aos="fade-up"
							data-aos-delay={200}
						>
							<p className="text-gray-600 italic text-lg mb-10 leading-relaxed">
								&quot;Harganya lebih murah dari supermarket, kualitasnya jauh lebih
								bagus. Mantap SegarTani!&quot;
							</p>
							<p className="text-primary font-bold text-lg">- Siti, Depok</p>
						</div>

						{/* Card 3 */}
						<div
							className="bg-white p-10 rounded-[2.5rem] text-left border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
							data-aos="fade-up"
							data-aos-delay={300}
						>
							<p className="text-gray-600 italic text-lg mb-10 leading-relaxed">
								&quot;Bumbu dapurnya lengkap dan selalu fresh. Langganan bulanan
								sekarang.&quot;
							</p>
							<p className="text-primary font-bold text-lg">
								- Anisa, Tangerang
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
