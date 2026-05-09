import Image from "next/image";
import { Leaf, Target, History, Users } from "lucide-react";

export default function AboutPage() {
	return (
		<div className="flex flex-col">
			{/* Header Section */}
			<section className="bg-white py-20 border-b border-gray-50">
				<div className="container mx-auto px-6 text-center" data-aos="fade-up">
					<h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
						Tentang <span className="text-[#00AA13]">Segar</span>
						<span className="text-[#FF9F1C]">Tani</span>
					</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Lahir dari sebuah proyek pembelajaran di Bandung, kami membawa
						teknologi untuk mempermudah akses belanja dari pasar tradisional
						langsung ke depan pintu Anda.
					</p>
				</div>
			</section>

			{/* History Section */}
			<section className="py-24 bg-white">
				<div className="container mx-auto px-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
						<div
							className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl"
							data-aos="fade-right"
							data-aos-delay="100"
						>
							<Image
								src="/images/hero.png"
								alt="Sejarah SegarTani"
								fill
								sizes="(max-width: 768px) 100vw, 50vw"
								className="object-cover"
							/>
						</div>
						<div data-aos="fade-left" data-aos-delay="100">
							<div className="flex items-center space-x-3 text-secondary font-bold mb-4 uppercase tracking-widest text-sm">
								<History size={20} />
								<span>Sejarah Kami</span>
							</div>
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Dimulai dari Kecintaan pada Alam
							</h2>
							<p className="text-gray-600 leading-relaxed mb-6">
								<span className="text-[#00AA13]">Segar</span>
								<span className="text-[#FF9F1C]">Tani</span> didirikan pada
								tahun 2018 di kota Batu, Jawa Timur. Berawal dari sebidang tanah
								kecil dan keinginan untuk mengonsumsi makanan yang lebih sehat
								tanpa bahan kimia, kami mulai menanam sayuran organik untuk
								keluarga dan teman terdekat.
							</p>
							<p className="text-gray-600 leading-relaxed">
								Antusiasme yang tinggi dari komunitas sekitar mendorong kami
								untuk mengembangkan lahan dan merangkul petani lokal lainnya.
								Saat ini, <span className="text-[#00AA13]">Segar</span>
								<span className="text-[#FF9F1C]">Tani</span> telah menjadi mitra
								bagi puluhan petani lokal dalam mendistribusikan hasil bumi
								organik yang jujur dan segar.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Vision & Mission */}
			<section className="py-24 bg-white border-y border-gray-50">
				<div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
					<div
						className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100"
						data-aos="fade-right"
						data-aos-delay="100"
					>
						<div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
							<Target className="text-primary h-8 w-8" />
						</div>
						<h3 className="text-2xl font-bold text-gray-900 mb-4">Visi Kami</h3>
						<p className="text-gray-600 leading-relaxed">
							Menjadi jembatan utama antara petani lokal dengan konsumen
							perkotaan dalam menciptakan ekosistem pangan organik yang
							berkelanjutan dan menyehatkan bagi seluruh keluarga di Indonesia.
						</p>
					</div>
					<div
						className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100"
						data-aos="fade-left"
						data-aos-delay="100"
					>
						<div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
							<Leaf className="text-secondary h-8 w-8" />
						</div>
						<h3 className="text-2xl font-bold text-gray-900 mb-4">Misi Kami</h3>
						<ul className="space-y-4 text-gray-600">
							<li className="flex items-start space-x-3">
								<div className="h-1.5 w-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
								<span>
									Menjamin kualitas dan kesegaran produk organik di setiap tahap
									distribusi.
								</span>
							</li>
							<li className="flex items-start space-x-3">
								<div className="h-1.5 w-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
								<span>
									Memberdayakan petani lokal melalui pelatihan metode pertanian
									organik modern.
								</span>
							</li>
							<li className="flex items-start space-x-3">
								<div className="h-1.5 w-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
								<span>
									Mengedukasi masyarakat tentang pentingnya pola makan sehat
									berbasis organik.
								</span>
							</li>
						</ul>
					</div>
				</div>
			</section>

			{/* Values Section */}
			<section className="py-24 bg-white text-center">
				<div className="container mx-auto px-6">
					<h2
						className="text-3xl font-bold text-gray-900 mb-16"
						data-aos="fade-up"
						data-aos-delay="100"
					>
						Nilai-Nilai Kami
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
						<div
							className="flex flex-col items-center"
							data-aos="fade-up"
							data-aos-delay="100"
						>
							<div className="mb-4 flex items-center justify-center h-20 w-20 rounded-full bg-white overflow-hidden p-3 shadow-sm border border-gray-100">
								<Image
									src="/images/trust.jfif"
									alt="Kejujuran"
									width={80}
									height={80}
									className="w-full h-full object-contain"
								/>
							</div>
							<h4 className="text-xl font-bold text-primary mb-3">Kejujuran</h4>
							<p className="text-gray-600">
								Kami terbuka mengenai asal-usul dan cara penanaman setiap produk
								kami.
							</p>
						</div>
						<div
							className="flex flex-col items-center"
							data-aos="fade-up"
							data-aos-delay="200"
						>
							<div className="mb-4 flex items-center justify-center h-20 w-20 rounded-full bg-white overflow-hidden p-3 shadow-sm border border-gray-100">
								<Image
									src="/images/keberlanjutan.jfif"
									alt="Keberlanjutan"
									width={80}
									height={80}
									className="w-full h-full object-contain"
								/>
							</div>
							<h4 className="text-xl font-bold text-primary mb-3">
								Keberlanjutan
							</h4>
							<p className="text-gray-600">
								Menjaga kelestarian tanah untuk generasi mendatang adalah
								prioritas kami.
							</p>
						</div>
						<div
							className="flex flex-col items-center"
							data-aos="fade-up"
							data-aos-delay="300"
						>
							<div className="mb-4 flex items-center justify-center h-20 w-20 rounded-full bg-white overflow-hidden shadow-sm border border-gray-100">
								<Image
									src="/images/preview.jpg"
									alt="Kebersamaan"
									width={80}
									height={80}
									className="w-full h-full object-cover"
								/>
							</div>
							<h4 className="text-xl font-bold text-primary mb-3">
								Kebersamaan
							</h4>
							<p className="text-gray-600">
								Membangun hubungan yang adil dan saling menguntungkan dengan
								petani lokal.
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
