"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Home,
	Camera,
	Loader2,
	CheckCircle2,
	ArrowLeft,
	Package,
	ShoppingBag,
	ChevronRight,
	Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState(false);
	const [profile, setProfile] = useState({
		full_name: "",
		phone: "",
		address: "",
		city: "",
		province: "",
		postal_code: "",
		is_admin: false,
		is_seller: false,
	});
	const [userEmail, setUserEmail] = useState("");

	useEffect(() => {
		async function loadProfile() {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/login");
				return;
			}
			setUserEmail(user.email || "");

			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.single();

			if (data) {
				setProfile({
					full_name: data.full_name || "",
					phone: data.phone || "",
					address: data.address || "",
					city: data.city || "",
					province: data.province || "",
					postal_code: data.postal_code || "",
					is_admin: data.is_admin || false,
					is_seller: data.is_seller || false,
				});
			}
			setLoading(false);
		}

		loadProfile();
	}, [router]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setSuccess(false);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User tidak ditemukan");

			const { error } = await supabase.from("profiles").upsert({
				id: user.id,
				...profile,
				updated_at: new Date().toISOString(),
			});

			if (error) throw error;
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			const error = err as Error;
			alert("Gagal menyimpan profil: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Loader2 className="animate-spin text-[#00AA13]" size={40} />
			</div>
		);
	}

	return (
		<div className="bg-gray-50 min-h-screen pt-12 pb-20 font-sans">
			<div className="container mx-auto px-6 max-w-4xl" data-aos="fade-up">
				<header className="mb-8 flex justify-between items-end">
					<div>
						<Link
							href="/ecommerce"
							className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-4 group"
						>
							<ArrowLeft
								size={18}
								className="group-hover:-translate-x-1 transition-transform"
							/>
							Kembali Belanja
						</Link>
						<h1 className="text-4xl font-black text-gray-900">Profil Saya</h1>
						<p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
							KELOLA INFORMASI PRIBADI DAN ALAMAT ANDA
						</p>
					</div>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
					{/* Left: Avatar & Quick Links */}
					<div className="lg:col-span-1 space-y-6">
						<div className="bg-white rounded-[2.5rem] shadow-xl p-8 text-center border border-gray-100">
							<div className="relative inline-block mb-6">
								<div className="w-32 h-32 bg-[#00AA13]/10 rounded-full flex items-center justify-center text-[#00AA13] font-black text-4xl border-4 border-white shadow-inner">
									{profile.full_name
										? profile.full_name.charAt(0).toUpperCase()
										: userEmail.charAt(0).toUpperCase()}
								</div>
								<button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-400 hover:text-[#00AA13] transition-colors">
									<Camera size={18} />
								</button>
							</div>
							<h2 className="text-xl font-black text-gray-900 mb-1">
								{profile.full_name || "User SegarTani"}
							</h2>
							<p className="text-sm font-bold text-gray-400 mb-8">
								{userEmail}
							</p>

							<div className="space-y-3">
								<Link
									href="/orders"
									className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-[#00AA13]/5 transition-colors group"
								>
									<div className="flex items-center gap-3">
										<ShoppingBag
											size={18}
											className="text-gray-400 group-hover:text-[#00AA13]"
										/>
										<span className="text-sm font-black text-gray-700 group-hover:text-[#00AA13]">
											Pesanan Saya
										</span>
									</div>
									<ChevronRight size={16} className="text-gray-300 group-hover:text-[#00AA13]" />
								</Link>

								<Link
									href={profile.is_seller ? "/admin/store-profile" : "/daftar-penjual"}
									className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#00AA13]/5 to-emerald-50 rounded-2xl hover:from-[#00AA13]/10 hover:to-emerald-100 transition-all group border border-[#00AA13]/10"
								>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-xl bg-[#00AA13]/10 flex items-center justify-center">
											<Store size={16} className="text-[#00AA13]" />
										</div>
										<div className="text-left">
											<span className="text-sm font-black text-gray-700 group-hover:text-[#00AA13] block">
												{profile.is_seller ? "Profil Penjual" : "Daftar Akun Penjual"}
											</span>
											<span className="text-[9px] font-bold text-gray-400">
												{profile.is_seller ? "Kelola toko dan produk Anda" : "Mulai jualan di SegarTani"}
											</span>
										</div>
									</div>
									<ChevronRight size={16} className="text-[#00AA13]/40 group-hover:text-[#00AA13] group-hover:translate-x-0.5 transition-all" />
								</Link>
							</div>
						</div>
					</div>

					{/* Right: Form */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100">
							<form onSubmit={handleSave} className="space-y-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
											NAMA LENGKAP
										</label>
										<div className="relative">
											<User
												size={18}
												className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
											/>
											<input
												type="text"
												value={profile.full_name}
												onChange={(e) =>
													setProfile({ ...profile, full_name: e.target.value })
												}
												placeholder="Nama Anda"
												className="w-full bg-gray-50 border-none rounded-2xl px-14 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-bold transition-all"
											/>
										</div>
									</div>
									<div>
										<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
											NOMOR TELEPON
										</label>
										<div className="relative">
											<Phone
												size={18}
												className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
											/>
											<input
												type="tel"
												value={profile.phone}
												onChange={(e) =>
													setProfile({ ...profile, phone: e.target.value })
												}
												placeholder="0812xxxx"
												className="w-full bg-gray-50 border-none rounded-2xl px-14 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-bold transition-all"
											/>
										</div>
									</div>
								</div>

								<div>
									<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
										ALAMAT LENGKAP
									</label>
									<div className="relative">
										<Home
											size={18}
											className="absolute left-5 top-6 text-gray-300"
										/>
										<textarea
											value={profile.address}
											onChange={(e) =>
												setProfile({ ...profile, address: e.target.value })
											}
											placeholder="Nama jalan, nomor rumah, RT/RW..."
											rows={3}
											className="w-full bg-gray-50 border-none rounded-2xl px-14 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-bold transition-all"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div>
										<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
											KOTA
										</label>
										<input
											type="text"
											value={profile.city}
											onChange={(e) =>
												setProfile({ ...profile, city: e.target.value })
											}
											placeholder="Batu"
											className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-bold transition-all"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
											PROVINSI
										</label>
										<input
											type="text"
											value={profile.province}
											onChange={(e) =>
												setProfile({ ...profile, province: e.target.value })
											}
											placeholder="Jawa Timur"
											className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-bold transition-all"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
											KODE POS
										</label>
										<input
											type="text"
											value={profile.postal_code}
											onChange={(e) =>
												setProfile({ ...profile, postal_code: e.target.value })
											}
											placeholder="65311"
											className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-bold transition-all"
										/>
									</div>
								</div>

								<div className="pt-6 flex items-center gap-6">
									<button
										type="submit"
										disabled={saving}
										className="flex-1 bg-[#00AA13] hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-[#00AA13]/20 flex items-center justify-center gap-3 text-lg"
									>
										{saving ? (
											<Loader2 size={24} className="animate-spin" />
										) : (
											"Simpan Perubahan"
										)}
									</button>
									{success && (
										<motion.div
											initial={{ scale: 0, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											className="flex items-center gap-2 text-[#00AA13] font-black uppercase tracking-widest text-[10px]"
										>
											<CheckCircle2 size={20} /> Berhasil!
										</motion.div>
									)}
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
