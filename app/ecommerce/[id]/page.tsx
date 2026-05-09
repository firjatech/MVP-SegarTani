"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
	Star,
	ShoppingCart,
	ArrowLeft,
	Loader2,
	Minus,
	Plus,
	ShieldCheck,
	Truck,
	Heart,
	MessageSquare,
	Send,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface Product {
	id: number;
	name: string;
	category: string;
	price: number;
	discount: number;
	rating: number;
	image: string;
	description: string;
	stock: number;
	seller_id: string;
}

interface Review {
	id: number;
	product_id: string;
	user_id: string;
	user_name: string;
	rating: number;
	comment: string;
	created_at: string;
}

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

export default function ProductDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const { addToCart } = useCart();
	const { toggleWishlist, isInWishlist } = useWishlist();
	const [quantity, setQuantity] = useState(1);
	const [reviews, setReviews] = useState<Review[]>([]);
	const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
	const [submittingReview, setSubmittingReview] = useState(false);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		async function fetchProduct() {
			try {
				const { data, error } = await supabase
					.from("products")
					.select("*")
					.eq("id", id)
					.single();

				if (error) throw error;
				setProduct(data);
			} catch (err) {
				console.error("Error fetching product:", err);
			} finally {
				setLoading(false);
			}
		}

		if (id) {
			fetchProduct();
			fetchReviews();

			supabase.auth.getUser().then(({ data: { user } }) => {
				setUser(user);
			});
		}

		async function fetchReviews() {
			const { data, error } = await supabase
				.from("reviews")
				.select("*")
				.eq("product_id", id)
				.order("created_at", { ascending: false });

			if (data) setReviews(data);
		}
	}, [id]);

	const handleReviewSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			alert("Silakan login untuk memberikan ulasan");
			return;
		}

		setSubmittingReview(true);
		const { error } = await supabase.from("reviews").insert({
			product_id: id,
			user_id: user.id,
			user_name:
				user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
			rating: newReview.rating,
			comment: newReview.comment,
		});

		if (error) {
			alert("Gagal mengirim ulasan: " + error.message);
		} else {
			setNewReview({ rating: 5, comment: "" });
			// Refresh reviews
			const { data } = await supabase
				.from("reviews")
				.select("*")
				.eq("product_id", id)
				.order("created_at", { ascending: false });
			if (data) setReviews(data);
		}
		setSubmittingReview(false);
	};

	const handleQuantity = (type: "plus" | "minus") => {
		if (type === "plus" && product && quantity < product.stock)
			setQuantity((prev) => prev + 1);
		else if (type === "minus" && quantity > 1) setQuantity((prev) => prev - 1);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
				<Loader2 className="w-12 h-12 text-[#00AA13] animate-spin mb-4" />
				<p className="text-gray-500 font-bold">Mengambil detail produk...</p>
			</div>
		);
	}

	if (!product) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
				<h2 className="text-2xl font-black text-gray-900 mb-4">
					Produk tidak ditemukan
				</h2>
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-[#00AA13] font-bold hover:underline"
				>
					<ArrowLeft size={18} /> Kembali
				</button>
			</div>
		);
	}

	const discountPrice =
		product.price - (product.price * product.discount) / 100;
	const isOutOfStock = product.stock <= 0;

	return (
		<div className="bg-gray-50 min-h-screen pt-16 pb-20">
			<div className="container mx-auto px-6 max-w-7xl">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#00AA13] transition-colors mb-2 group"
				>
					<div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-[#00AA13]/10">
						<ArrowLeft size={20} />
					</div>
					Kembali ke Katalog
				</button>

				<div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
					<div className="flex flex-col lg:flex-row items-start">
						{/* Left: Image */}
						<div className="lg:w-1/2 p-8 md:p-12 bg-white flex items-start justify-center border-b lg:border-b-0 lg:border-r border-gray-50">
							<div className="relative aspect-square w-full max-w-md mt-4">
								{product.discount > 0 && (
									<div className="absolute top-0 left-0 z-10">
										<span className="bg-red-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg">
											DISKON {product.discount}%
										</span>
									</div>
								)}

								{isOutOfStock && (
									<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[2rem]">
										<span className="bg-red-500 text-white text-lg font-black px-8 py-3 rounded-full shadow-2xl transform -rotate-12 border-4 border-white">
											STOK HABIS
										</span>
									</div>
								)}

								<Image
									src={product.image}
									alt={product.name}
									fill
									className={`object-contain transition-transform duration-500 ${isOutOfStock ? "opacity-50" : "hover:scale-105"}`}
								/>
							</div>
						</div>

						{/* Right: Info */}
						<div className="lg:w-1/2 p-8 md:p-16">
							<div className="mb-6 flex items-center gap-3">
								<span className="bg-[#00AA13]/10 text-[#00AA13] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
									{product.category}
								</span>
								<div className="flex items-center gap-1 text-yellow-400">
									<Star size={16} className="fill-current" />
									<span className="text-sm font-bold text-gray-900">
										{Number(product.rating).toFixed(1)}
									</span>
								</div>
								<span
									className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isOutOfStock ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}`}
								>
									Stok: {product.stock} pcs
								</span>
							</div>

							<h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
								{product.name}
							</h1>

							<div className="flex items-end gap-3 mb-8">
								<div className="flex flex-col">
									{product.discount > 0 && (
										<span className="text-lg text-gray-400 line-through font-bold">
											{formatIDR(product.price)}
										</span>
									)}
									<span className="text-4xl font-black text-[#00AA13]">
										{formatIDR(discountPrice)}
									</span>
								</div>
								<span className="text-gray-400 text-sm font-bold mb-1">
									/ Paket
								</span>
							</div>

							<div className="h-px bg-gray-100 w-full mb-8"></div>

							<div className="mb-8">
								<h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
									Deskripsi Produk
								</h3>
								<p className="text-gray-600 leading-relaxed font-medium">
									{product.description || "Produk berkualitas dari SegarTani."}
								</p>
							</div>

							{/* Quantity Picker */}
							{!isOutOfStock && (
								<div className="mb-10">
									<h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
										Jumlah Pesanan
									</h3>
									<div className="flex items-center gap-6">
										<div className="flex items-center bg-gray-100 rounded-2xl p-1">
											<button
												onClick={() => handleQuantity("minus")}
												className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-[#00AA13] transition-colors"
											>
												<Minus size={20} />
											</button>
											<span className="w-12 text-center font-black text-lg">
												{quantity}
											</span>
											<button
												onClick={() => handleQuantity("plus")}
												className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-[#00AA13] transition-colors"
											>
												<Plus size={20} />
											</button>
										</div>
										<span className="text-sm font-bold text-gray-400 tracking-wide uppercase">
											Tersedia: {product.stock}
										</span>
									</div>
								</div>
							)}

							<div className="flex flex-col sm:flex-row gap-4 mb-4">
								<button
									disabled={isOutOfStock}
									onClick={() =>
										addToCart({
											id: product.id,
											name: product.name,
											price: discountPrice,
											image: product.image,
											quantity: quantity,
											category: product.category,
										})
									}
									className={`flex-1 font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-lg active:scale-95 ${
										isOutOfStock
											? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
											: "bg-[#00AA13] hover:bg-[#008810] text-white shadow-[#00AA13]/20"
									}`}
								>
									<ShoppingCart size={22} />
									{isOutOfStock ? "Maaf, Stok Habis" : "Tambah ke Keranjang"}
								</button>
								<button
									onClick={() =>
										toggleWishlist({
											id: product.id,
											name: product.name,
											price: discountPrice,
											image: product.image,
											category: product.category,
										})
									}
									className={`p-5 rounded-2xl transition-all shadow-xl flex items-center justify-center border-2 active:scale-95 ${
										isInWishlist(product.id)
											? "bg-red-50 border-red-200 text-red-500 shadow-red-100"
											: "bg-white border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 shadow-gray-100"
									}`}
								>
									<Heart
										size={24}
										className={isInWishlist(product.id) ? "fill-current" : ""}
									/>
								</button>
							</div>



							{/* Badges */}
							<div className="mt-12 grid grid-cols-2 gap-4">
								<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
									<ShieldCheck className="text-[#00AA13]" size={24} />
									<div>
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
											Kualitas
										</p>
										<p className="text-xs font-bold text-gray-900">
											100% Organik
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
									<Truck className="text-[#00AA13]" size={24} />
									<div>
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
											Pengiriman
										</p>
										<p className="text-xs font-bold text-gray-900">
											Sameday Service
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Reviews Section */}
				<div className="mt-16 bg-white rounded-[3rem] shadow-xl p-8 md:p-16 border border-gray-100">
					<div className="flex items-center gap-4 mb-12">
						<div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600">
							<MessageSquare size={28} />
						</div>
						<div>
							<h2 className="text-3xl font-black text-gray-900">
								Ulasan Produk
							</h2>
							<p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
								APA KATA MEREKA TENTANG PRODUK INI
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
						{/* Review List */}
						<div className="lg:col-span-2 space-y-8">
							{reviews.length === 0 ? (
								<div className="py-12 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
									<p className="text-gray-400 font-bold">
										Belum ada ulasan untuk produk ini.
									</p>
								</div>
							) : (
								reviews.map((review, idx) => (
									<div
										key={idx}
										className="border-b border-gray-100 pb-8 last:border-0"
									>
										<div className="flex justify-between items-start mb-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-[#00AA13]/10 text-[#00AA13] rounded-full flex items-center justify-center font-black text-sm uppercase">
													{review.user_name.charAt(0)}
												</div>
												<div>
													<h4 className="font-black text-gray-900">
														{review.user_name}
													</h4>
													<p className="text-[10px] font-bold text-gray-400">
														{new Date(review.created_at).toLocaleDateString(
															"id-ID",
														)}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-1 text-yellow-400 bg-yellow-50 px-3 py-1 rounded-lg">
												<Star size={14} className="fill-current" />
												<span className="text-xs font-black">
													{review.rating}
												</span>
											</div>
										</div>
										<p className="text-gray-600 font-medium leading-relaxed italic">
											&quot;{review.comment}&quot;
										</p>
									</div>
								))
							)}
						</div>

						{/* Review Form */}
						<div className="lg:col-span-1">
							<div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 sticky top-24">
								<h3 className="text-xl font-black text-gray-900 mb-6">
									Tulis Ulasan
								</h3>
								{user ? (
									<form onSubmit={handleReviewSubmit} className="space-y-6">
										<div>
											<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
												RATING ANDA
											</label>
											<div className="flex gap-2">
												{[1, 2, 3, 4, 5].map((num) => (
													<button
														key={num}
														type="button"
														onClick={() =>
															setNewReview({ ...newReview, rating: num })
														}
														className={`p-2 rounded-xl transition-all ${
															newReview.rating >= num
																? "text-yellow-400 bg-yellow-50"
																: "text-gray-300 bg-white"
														}`}
													>
														<Star
															size={24}
															className={
																newReview.rating >= num ? "fill-current" : ""
															}
														/>
													</button>
												))}
											</div>
										</div>
										<div>
											<label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
												KOMENTAR
											</label>
											<textarea
												required
												value={newReview.comment}
												onChange={(e) =>
													setNewReview({
														...newReview,
														comment: e.target.value,
													})
												}
												placeholder="Apa pendapat Anda tentang produk ini?"
												rows={4}
												className="w-full bg-white border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/5 text-gray-700 font-medium transition-all"
											/>
										</div>
										<button
											type="submit"
											disabled={submittingReview}
											className="w-full bg-[#00AA13] hover:bg-[#008810] disabled:bg-gray-300 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#00AA13]/20 flex items-center justify-center gap-3 active:scale-95"
										>
											{submittingReview ? (
												<Loader2 size={20} className="animate-spin" />
											) : (
												<>
													<Send size={18} /> Kirim Ulasan
												</>
											)}
										</button>
									</form>
								) : (
									<div className="text-center py-6">
										<p className="text-gray-400 font-bold text-sm mb-6">
											Silakan login untuk memberikan ulasan produk ini.
										</p>
										<Link
											href="/login"
											className="inline-block bg-white text-gray-900 font-black px-8 py-3 rounded-xl border border-gray-100 hover:bg-[#00AA13] hover:text-white transition-all shadow-sm"
										>
											Login Sekarang
										</Link>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
