"use client";

import React from "react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import {
	Heart,
	ShoppingCart,
	Trash2,
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const formatIDR = (amount: number) => {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	})
		.format(amount)
		.replace(/\s/g, "");
};

export default function WishlistPage() {
	const { wishlist, removeFromWishlist, totalWishlistItems } = useWishlist();
	const { addToCart } = useCart();

	return (
		<div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
			<div className="container mx-auto px-6 max-w-6xl">
				<header className="mb-12">
					<Link
						href="/ecommerce"
						className="items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors mb-6 group inline-flex"
					>
						<ArrowLeft
							size={20}
							className="group-hover:-translate-x-1 transition-transform"
						/>
						Kembali ke Katalog
					</Link>
					<div className="flex items-center gap-4">
						<div className="bg-red-500 p-3 rounded-2xl text-white shadow-lg shadow-red-200">
							<Heart size={28} className="fill-current" />
						</div>
						<div>
							<h1 className="text-4xl font-black text-gray-900">
								Wishlist Saya
							</h1>
							<p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
								{totalWishlistItems} PRODUK TERSIMPAN
							</p>
						</div>
					</div>
				</header>

				{wishlist.length === 0 ? (
					<div
						className="bg-white rounded-5xl p-16 text-center shadow-xl border border-gray-100 flex flex-col items-center"
						data-aos="fade-up"
					>
						<div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-8">
							<Heart size={48} />
						</div>
						<h2 className="text-2xl font-black text-gray-900 mb-4">
							Wishlist Masih Kosong
						</h2>
						<p className="text-gray-400 max-w-sm mb-12 font-medium leading-relaxed">
							Belum ada produk yang Anda simpan. Cari produk favorit Anda dan
							klik ikon hati untuk menyimpannya di sini.
						</p>
						<Link
							href="/ecommerce"
							className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
						>
							Cari Produk
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						<AnimatePresence>
							{wishlist.map((item) => (
								<motion.div
									key={item.id}
									layout
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									className="bg-white rounded-4xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500"
								>
									<div className="relative aspect-square">
										<Image
											src={item.image}
											alt={item.name}
											fill
											className="object-cover group-hover:scale-110 transition-transform duration-700"
										/>
										<div className="absolute top-5 left-5">
											<span className="bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black px-3 py-1 rounded-lg border border-primary/20 uppercase">
												{item.category}
											</span>
										</div>
										<button
											type="button"
											onClick={() => removeFromWishlist(item.id)}
											className="absolute top-5 right-5 p-3 bg-white/80 backdrop-blur-md text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
										>
											<Trash2 size={18} />
										</button>
									</div>

									<div className="p-8">
										<h3 className="text-xl font-black text-gray-900 mb-2 truncate">
											{item.name}
										</h3>
										<p className="text-2xl font-black text-primary mb-8">
											{formatIDR(item.price)}
										</p>

										<div className="flex gap-3">
											<Link
												href={`/ecommerce/${item.id}`}
												className="flex-1 bg-gray-50 text-gray-900 font-black py-4 rounded-2xl text-center hover:bg-gray-100 transition-colors"
											>
												Detail
											</Link>
											<button
												type="button"
												onClick={() =>
													addToCart({
														id: item.id,
														name: item.name,
														price: item.price,
														image: item.image,
														category: item.category,
														quantity: 1,
													})
												}
												className="bg-primary text-white p-4 rounded-2xl hover:bg-[#008810] transition-all shadow-lg shadow-primary/20 active:scale-95"
											>
												<ShoppingCart size={22} />
											</button>
										</div>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}
			</div>
		</div>
	);
}
