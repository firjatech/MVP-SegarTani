"use client";

import React, { useState } from "react";
import {
	Search,
	MapPin,
	Phone,
	Clock,
	Navigation,
	ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

const locations = [
	{
		id: 1,
		name: "Hub Pusat Bandung",
		type: "PUSAT",
		status: "Beroperasi 24 Jam",
		address: "Jl. Pertanian Raya No. 12, Lengkong, Bandung, Jawa Barat 40264",
		phone: "+62 812-3456-7890",
		isPusat: true,
	},
	{
		id: 2,
		name: "Cabang Cimahi",
		type: "CABANG",
		status: "Buka - Tutup Pukul 20.00",
		address:
			"Kawasan Niaga Cimahi Selatan Blok C No. 4, Cimahi, Jawa Barat 40533",
		phone: "+62 813-9876-5432",
		isPusat: false,
	},
	{
		id: 3,
		name: "Titik Jemput Lembang",
		type: "TITIK JEMPUT",
		status: "Buka - Tutup Pukul 15.00",
		address: "Pasar Panorama Lembang Lt. 2, Kabupaten Bandung Barat 40391",
		phone: "+62 811-2233-4455",
		isPusat: false,
	},
];

export default function LocationPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [mapQuery, setMapQuery] = useState("Bandung");
	const router = useRouter();

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setMapQuery(searchQuery.trim() ? searchQuery : "Bandung");
		}, 800);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

	return (
		<div className="bg-white min-h-screen font-sans">
			{/* Hero Header Section */}
			<section className="pt-16 pb-12 px-6 bg-[#f8fcf9]">
				<div className="container mx-auto max-w-4xl" data-aos="fade-down">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-8 group"
					>
						<ArrowLeft
							size={18}
							className="group-hover:-translate-x-1 transition-transform"
						/>
						Kembali
					</button>

					<div className="text-center" data-aos="fade-up">
						<h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
							Cari Lokasi <span className="text-[#00AA13]">Segar</span>
							<span className="text-[#FF9F1C]">Tani</span>
						</h1>
						<p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
							Cek apakah area Anda sudah masuk dalam jangkauan layanan
							pengiriman kilat kami.
						</p>

						{/* Search Bar */}
						<form 
							onSubmit={(e) => { e.preventDefault(); setMapQuery(searchQuery.trim() || "Bandung"); }}
							className="relative max-w-2xl mx-auto bg-white rounded-full shadow-2xl shadow-gray-200/50 p-2 flex items-center border border-gray-100"
						>
							<div className="flex-grow flex items-center px-4">
								<MapPin className="text-gray-400 mr-3" size={20} />
								<input
									type="text"
									placeholder="Masukkan kota atau kodepos Anda..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full py-3 focus:outline-none text-gray-700 font-medium"
								/>
							</div>
							<button type="submit" className="bg-[#00AA13] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#00880F] transition-all shadow-lg active:scale-95">
								Cek Lokasi
							</button>
						</form>
					</div>
				</div>
			</section>

			{/* Main Content Section */}
			<section className="py-20 px-6">
				<div className="container mx-auto max-w-7xl">
					<h2
						className="text-3xl font-black text-gray-900 mb-12"
						data-aos="fade-right"
					>
						Cabang & Titik Pengambilan
					</h2>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
						{/* Left Column: Location List */}
						<div className="space-y-4">
							{locations.map((loc) => (
								<div
									key={loc.id}
									className={`p-6 rounded-[1.5rem] border transition-all duration-300 hover:shadow-lg ${
										loc.isPusat
											? "bg-[#e8f5e9]/40 border-[#00AA13]/10"
											: "bg-white border-gray-100"
									}`}
									data-aos="fade-right"
									data-aos-delay="100"
								>
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-xl font-bold text-gray-900">
											{loc.name}
										</h3>
										{loc.isPusat && (
											<span className="bg-[#00AA13] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
												PUSAT
											</span>
										)}
									</div>

									<p
										className={`text-sm font-bold mb-4 ${loc.isPusat ? "text-[#00AA13]" : "text-[#FF9F1C]"}`}
									>
										{loc.status}
									</p>

									<div className="space-y-3">
										<p className="text-sm text-gray-500 leading-relaxed max-w-sm">
											{loc.address}
										</p>
										<div className="flex items-center gap-2 text-gray-600">
											<Phone size={14} className="text-gray-400" />
											<p className="text-sm font-medium">{loc.phone}</p>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Right Column: Sticky Map */}
						<div
							className="lg:sticky lg:top-32 h-[500px] md:h-[580px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl"
							data-aos="fade-left"
						>
							<iframe
								src={mapUrl}
								width="100%"
								height="100%"
								style={{ border: 0 }}
								allowFullScreen
								loading="lazy"
								referrerPolicy="no-referrer-when-downgrade"
							></iframe>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
