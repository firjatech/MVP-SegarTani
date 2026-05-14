"use client";

import { useId, useState, type FormEvent } from "react";
import {
	Mail,
	MapPin,
	MessageCircle,
	Navigation,
	Send,
} from "lucide-react";

export default function ContactPage() {
	const nameId = useId();
	const emailId = useId();
	const messageId = useId();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const text = `Halo SegarTani, saya ingin menghubungi Anda.%0A%0A*Nama:* ${name}%0A*Email:* ${email}%0A*Pesan:*%0A${message}`;
		window.open(`https://wa.me/6287789727616?text=${text}`, '_blank');
	};

	return (
		<div className="flex flex-col min-h-screen bg-white">
			{/* Header */}
			<section className="bg-white pt-32 pb-20 border-b border-gray-50">
				<div
					className="container mx-auto px-6 text-center"
					data-aos="fade-up"
					data-aos-delay="100"
				>
					<h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
						Hubungi <span className="text-primary">Kami</span>
					</h1>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
						Kami siap membantu Anda. Silakan hubungi kami melalui informasi di
						bawah ini atau kirimkan pesan langsung melalui formulir yang
						tersedia.
					</p>
				</div>
			</section>

			<section className="py-24">
				<div className="container mx-auto px-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
						{/* Information Card */}
						<div data-aos="fade-right">
							<h2 className="text-3xl font-bold text-gray-900 mb-8">
								Informasi Kontak
							</h2>
							<div className="space-y-8">
								<div className="flex items-start space-x-4 p-6 bg-natural rounded-2xl">
									<div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
										<MapPin className="text-primary" />
									</div>
									<div>
										<h4 className="font-bold text-gray-900">
											Alamat Kantor & Kebun
										</h4>
										<p className="text-gray-600">
											Jl. Agribisnis No. 123, Batu, Jawa Timur, Indonesia
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-4 p-6 bg-natural rounded-2xl">
									<div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
										<MessageCircle className="text-secondary" />
									</div>
									<div>
										<h4 className="font-bold text-gray-900">WhatsApp</h4>
										<p className="text-gray-600">+62 877 8972 7616</p>
									</div>
								</div>

								<div className="flex items-start space-x-4 p-6 bg-natural rounded-2xl">
									<div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
										<Mail className="text-primary" />
									</div>
									<div>
										<h4 className="font-bold text-gray-900">Email</h4>
										<p className="text-gray-600">info@segartani.com</p>
									</div>
								</div>
							</div>

							{/* Social Media or Other Info could go here if needed */}
							<div
								className="mt-12 p-8 rounded-3xl bg-white border border-gray-100"
								data-aos="fade-right"
							>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Ingin Berkunjung?
								</h3>
								<p className="text-gray-600 mb-6">
									Silakan lihat halaman lokasi kami untuk mendapatkan petunjuk
									arah yang lengkap dan jam operasional kebun.
								</p>
								<a
									href="/location"
									className="text-primary font-black flex items-center gap-2 hover:translate-x-2 transition-transform"
								>
									Buka Halaman Lokasi <Navigation size={16} />
								</a>
							</div>
						</div>

						{/* Contact Form */}
						<div
							className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 h-fit"
							data-aos="fade-left"
							data-aos-delay="300"
						>
							<h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
								Kirim Pesan
							</h3>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label htmlFor={nameId} className="block text-sm font-bold text-gray-700 mb-2">
										Nama Lengkap
									</label>
									<input
										id={nameId}
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-4 transition-all"
										placeholder="Masukkan nama Anda"
									/>
								</div>
								<div>
									<label htmlFor={emailId} className="block text-sm font-bold text-gray-700 mb-2">
										Alamat Email
									</label>
									<input
										id={emailId}
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-4 transition-all"
										placeholder="email@contoh.com"
									/>
								</div>
								<div>
									<label htmlFor={messageId} className="block text-sm font-bold text-gray-700 mb-2">
										Pesan Anda
									</label>
									<textarea
										id={messageId}
										rows={4}
										required
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-4 transition-all"
										placeholder="Tuliskan pesan atau pesanan Anda di sini..."
									></textarea>
								</div>
								<button
									type="submit"
									className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
								>
									<Send size={20} />
									<span>Kirim Pesan via WhatsApp</span>
								</button>
							</form>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
