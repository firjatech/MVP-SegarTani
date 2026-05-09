import React from "react";
import Link from "next/link";
import {
	Leaf,
	Truck,
	BookOpen,
	Users,
	ShoppingBag,
	Sprout,
	Star,
} from "lucide-react";
import FAQAccordion from "@/components/FAQAccordion";

const services = [
	{
		title: "Pertanian Organik",
		description:
			"Kami menerapkan standar pertanian organik ketat tanpa pestisida kimia untuk hasil bumi yang murni dan sehat.",
		icon: Sprout,
		color: "bg-green-100 text-green-700",
	},
	{
		title: "Distribusi Grosir",
		description:
			"Menyediakan pasokan sayur dan buah rutin untuk restoran, supermarket, dan hotel dengan harga kompetitif.",
		icon: ShoppingBag,
		color: "bg-blue-100 text-blue-700",
	},
	{
		title: "Pengiriman Langsung",
		description:
			"Layanan pesan antar ke rumah yang menjamin kesegaran produk maksimal dalam waktu kurang dari 24 jam setelah panen.",
		icon: Truck,
		color: "bg-orange-100 text-orange-700",
	},
	{
		title: "Edukasi Petani",
		description:
			"Program kemitraan dengan petani lokal untuk beralih ke metode pertanian berkelanjutan yang ramah lingkungan.",
		icon: BookOpen,
		color: "bg-yellow-100 text-yellow-700",
	},
	{
		title: "Paket Langganan",
		description:
			"Berlangganan paket sayur mingguan yang dikurasi khusus untuk memenuhi kebutuhan nutrisi keluarga Anda.",
		icon: Leaf,
		color: "bg-emerald-100 text-emerald-700",
	},
	{
		title: "Komunitas Sehat",
		description:
			"Mengadakan workshop dan kunjungan kebun untuk membangun kesadaran gaya hidup sehat berbasis organik.",
		icon: Users,
		color: "bg-purple-100 text-purple-700",
	},
];

export default function ServicePage() {
	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Header */}
			<section className="bg-white py-20 border-b border-gray-50">
				<div
					className="container mx-auto px-6 text-center"
					data-aos="fade-up"
					data-aos-delay="100"
				>
					<h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
						Solusi <span className="text-[#00AA13]">Terbaik</span> Untuk Anda.
					</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
						Dari kebutuhan dapur pribadi hingga pasokan bisnis restoran berskala
						besar, <span className="text-[#00AA13] font-bold">Segar</span>
						<span className="text-[#FF9F1C] font-bold">Tani</span> hadir dengan
						layanan yang disesuaikan untuk setiap kebutuhan.
					</p>
				</div>
			</section>

			{/* Services Grid */}
			<section className="py-24">
				<div className="container mx-auto px-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
						{services.map((service, index) => (
							<div
								key={index}
								className="p-10 rounded-3xl border border-gray-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all group"
								data-aos="fade-up"
								data-aos-delay={index * 100}
							>
								<div
									className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}
								>
									<service.icon size={32} />
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-4">
									{service.title}
								</h3>
								<p className="text-gray-600 leading-relaxed">
									{service.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>
			{/* How It Works Section */}
			<section className="py-24 bg-white text-gray-900 overflow-hidden border-t border-gray-50">
				<div className="container mx-auto px-6">
					<div className="text-center mb-20">
						<h2
							className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900"
							data-aos="fade-up"
							data-aos-delay="100"
						>
							Bagaimana Kami Bekerja?
						</h2>
						<p
							className="text-gray-500 text-lg max-w-2xl mx-auto"
							data-aos="fade-up"
							data-aos-delay="100"
						>
							Proses transparan untuk memastikan kualitas terbaik sampai ke
							tangan Anda.
						</p>
					</div>

					<div className="relative" data-aos="fade-up" data-aos-delay="200">
						{/* Connection Line (Desktop) */}
						<div className="absolute top-10 left-0 w-full h-px bg-gray-100 -translate-y-1/2 hidden lg:block"></div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8 relative z-10">
							{/* Step 1 */}
							<div className="flex flex-col items-center text-center group">
								<div className="w-20 h-20 bg-[#00AA13] text-white rounded-full flex items-center justify-center text-2xl font-black mb-8 shadow-xl shadow-[#00AA13]/20 group-hover:scale-110 transition-transform duration-500 border-4 border-white">
									1
								</div>
								<h3 className="text-2xl font-bold mb-4">Pilih Produk</h3>
								<p className="text-gray-500 leading-relaxed max-w-xs group-hover:text-gray-900 transition-colors">
									Telusuri katalog kami dan pilih sayuran atau paket yang Anda
									butuhkan.
								</p>
							</div>

							{/* Step 2 */}
							<div className="flex flex-col items-center text-center group">
								<div className="w-20 h-20 bg-[#00AA13] text-white rounded-full flex items-center justify-center text-2xl font-black mb-8 shadow-xl shadow-[#00AA13]/20 group-hover:scale-110 transition-transform duration-500 border-4 border-white">
									2
								</div>
								<h3 className="text-2xl font-bold mb-4">Quality Control</h3>
								<p className="text-gray-500 leading-relaxed max-w-xs group-hover:text-gray-900 transition-colors">
									Sayuran disortir dan dibersihkan dengan standar kebersihan
									tinggi.
								</p>
							</div>

							{/* Step 3 */}
							<div className="flex flex-col items-center text-center group">
								<div className="w-20 h-20 bg-[#00AA13] text-white rounded-full flex items-center justify-center text-2xl font-black mb-8 shadow-xl shadow-[#00AA13]/20 group-hover:scale-110 transition-transform duration-500 border-4 border-white">
									3
								</div>
								<h3 className="text-2xl font-bold mb-4">Dikirim ke Anda</h3>
								<p className="text-gray-500 leading-relaxed max-w-xs group-hover:text-gray-900 transition-colors">
									Kurir kami mengantarkan pesanan langsung ke depan pintu dapur
									Anda.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* Testimonial Section */}
			<section className="py-24 bg-white">
				<div className="container mx-auto px-6 text-center">
					<h2
						className="text-4xl font-extrabold text-black mb-12"
						data-aos="fade-up"
						data-aos-delay="200"
					>
						Apa Kata Mereka?
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
						{/* Card 1 */}
						<div
							className="bg-white p-8 rounded-3xl text-left border border-gray-100 shadow-sm"
							data-aos="fade-up"
							data-aos-delay="100"
						>
							<div className="flex gap-1 mb-6">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className="w-6 h-6 text-[#ffb800] fill-[#ffb800] stroke-black stroke-1"
									/>
								))}
							</div>
							<p className="text-gray-700 italic mb-8 leading-relaxed">
								&quot;Sayurnya segar banget, pengiriman juga cepat. Sangat membantu
								untuk ibu pekerja seperti saya!&quot;
							</p>
							<p className="text-[#00AA13] font-bold">- Rina, Jakarta</p>
						</div>
						{/* Card 2 */}
						<div
							className="bg-white p-8 rounded-3xl text-left border border-gray-100 shadow-sm"
							data-aos="fade-up"
							data-aos-delay="200"
						>
							<div className="flex gap-1 mb-6">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className="w-6 h-6 text-[#ffb800] fill-[#ffb800] stroke-black stroke-1"
									/>
								))}
							</div>
							<p className="text-gray-700 italic mb-8 leading-relaxed">
								&quot;Harganya lebih murah dari supermarket, kualitasnya jauh lebih
								bagus. Mantap SegarTani!&quot;
							</p>
							<p className="text-[#00AA13] font-bold">- Siti, Depok</p>
						</div>
						{/* Card 3 */}
						<div
							className="bg-white p-8 rounded-3xl text-left border border-gray-100 shadow-sm"
							data-aos="fade-up"
							data-aos-delay="300"
						>
							<div className="flex gap-1 mb-6">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className="w-6 h-6 text-[#ffb800] fill-[#ffb800] stroke-black stroke-1"
									/>
								))}
							</div>
							<p className="text-gray-700 italic mb-8 leading-relaxed">
								&quot;Bumbu dapurnya lengkap dan selalu fresh. Langganan bulanan
								sekarang.&quot;
							</p>
							<p className="text-[#00AA13] font-bold">- Anisa, Tangerang</p>
						</div>
					</div>
				</div>
			</section>
			
			{/* FAQ Section */}
			<FAQAccordion />

			{/* CTA Section */}
			<section className="py-20 bg-white">
				<div className="container mx-auto px-6">
					<div
						className="max-w-5xl mx-auto bg-[#00AA13] rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-xl shadow-[#00AA13]/20"
						data-aos="fade-up"
					>
						{/* Subtle Pattern Overlay */}
						<div
							className="absolute inset-0 opacity-10 pointer-events-none"
							style={{
								backgroundImage:
									"radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)",
								backgroundSize: "32px 32px",
							}}
						></div>

						<div className="relative z-10">
							<h2 className="text-3xl md:text-4xl font-black mb-6">
								Siap Menikmati Layanan Kami?
							</h2>
							<p className="text-base md:text-lg mb-10 max-w-2xl mx-auto opacity-90 leading-relaxed font-medium">
								Jangan ragu untuk menghubungi tim kami jika Anda memiliki
								permintaan khusus atau pertanyaan seputar kerjasama B2B.
							</p>
							<div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
								<Link
									href="/product"
									className="bg-white text-[#00AA13] px-10 py-4 rounded-[2rem] font-bold text-base hover:bg-gray-100 transition-all shadow-lg min-w-[220px]"
								>
									Lihat Katalog Produk
								</Link>
								<Link
									href="/contact"
									className="bg-transparent text-white border-2 border-white/50 px-10 py-4 rounded-[2rem] font-bold text-base hover:bg-white/10 transition-all min-w-[220px]"
								>
									Hubungi Tim Sales
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
