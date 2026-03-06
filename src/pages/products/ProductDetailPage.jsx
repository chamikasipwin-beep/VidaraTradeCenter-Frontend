import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById } from "../../api/productApi";
import { useToast } from "../../context/ToastContext";

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        if (id) {
            fetchProductDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const response = await getProductById(id);
            setProduct(response.data?.data || response.data);
        } catch (err) {
            console.error("Failed to load product details:", err);
            showError("Could not load product details or product not found.");
            navigate("/products");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        // Assume context handles this
        showSuccess(`${product?.name} added to cart!`);
    };

    if (loading) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-16 flex justify-center items-center min-h-[60vh]">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    if (!product) return null;

    // Fallback images if the product doesn't have an array of images
    const images = product.images?.length > 0
        ? product.images
        : [product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=512`];

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Gallery Section */}
                <div className="space-y-6">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                        <img
                            src={images[selectedImage]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                        {/* Optional badging could go here */}
                    </div>

                    {images.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-colors ${selectedImage === idx
                                        ? "border-primary dark:border-indigo-500"
                                        : "border-transparent hover:border-primary/50 dark:hover:border-indigo-400/50"
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} view ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info Section */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <div className="flex gap-2 mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/30 dark:text-slate-100 uppercase tracking-wide">
                                {product.category?.name || "Uncategorized"}
                            </span>
                            {product.stock > 0 && product.stock <= 5 && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Only {product.stock} left
                                </span>
                            )}
                            {product.stock === 0 && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                            {product.name}
                        </h1>
                        {product.brand && (
                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
                                By <span className="text-primary dark:text-indigo-400">{product.brand.name}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4 py-4 border-y border-slate-200 dark:border-slate-800 mt-2">
                        <span className="text-3xl font-bold text-primary dark:text-white">
                            ${parseFloat(product.salePrice || product.basePrice || 0).toFixed(2)}
                        </span>
                        {product.salePrice && product.basePrice > product.salePrice && (
                            <>
                                <span className="text-lg text-slate-400 line-through font-normal">
                                    ${parseFloat(product.basePrice).toFixed(2)}
                                </span>
                                <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">
                                    Save {Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                                </span>
                            </>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div
                            className="text-slate-600 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
                        />

                        {/* Dummy bullet points just to match the visual style shown in HTML */}
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-sm">check_circle</span>
                                High quality materials
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-sm">check_circle</span>
                                Fast shipping available
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-sm">check_circle</span>
                                30-day return policy
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-sm">check_circle</span>
                                Secure checkout
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            className="flex-1 bg-primary text-white font-bold h-14 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">shopping_bag</span>
                            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                        <button
                            disabled={product.stock === 0}
                            className="px-8 bg-slate-100 dark:bg-slate-800 font-bold h-14 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Reviews & Social Proof Section - Static Mockup for visual parity */}
            <section className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-16">
                <h2 className="text-3xl font-bold mb-10 text-slate-900 dark:text-white">Customer Reviews</h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Summary Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col items-center text-center gap-2">
                                <span className="text-6xl font-black text-primary dark:text-white">4.8</span>
                                <div className="flex gap-1 text-amber-400">
                                    <span className="material-symbols-outlined fill-1">star</span>
                                    <span className="material-symbols-outlined fill-1">star</span>
                                    <span className="material-symbols-outlined fill-1">star</span>
                                    <span className="material-symbols-outlined fill-1">star</span>
                                    <span className="material-symbols-outlined">star_half</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Based on 1,240 verified reviews</p>
                            </div>

                            <div className="mt-8 space-y-3">
                                {[
                                    { stars: 5, pct: 80 },
                                    { stars: 4, pct: 15 },
                                    { stars: 3, pct: 3 },
                                    { stars: 2, pct: 1 },
                                    { stars: 1, pct: 1 },
                                ].map((row) => (
                                    <div key={row.stars} className="grid grid-cols-[20px_1fr_40px] items-center gap-4">
                                        <span className="text-sm font-semibold">{row.stars}</span>
                                        <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${row.pct}%` }}></div>
                                        </div>
                                        <span className="text-sm text-slate-400 text-right">{row.pct}%</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                                Write a Review
                            </button>
                        </div>
                    </div>

                    {/* Reviews Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">JD</div>
                                    <div>
                                        <p className="font-bold">Julianne Doe</p>
                                        <p className="text-xs text-slate-400">Verified Buyer • 2 days ago</p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5 text-amber-400">
                                    <span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span>
                                </div>
                            </div>
                            <h4 className="font-bold mb-2">Simply the best on the market</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                I've been using this product for three months now and the results are consistently better than any other solution I've tried. Highly recommended.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">MR</div>
                                    <div>
                                        <p className="font-bold">Marcus Reed</p>
                                        <p className="text-xs text-slate-400">Verified Buyer • 1 week ago</p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5 text-amber-400">
                                    <span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm fill-1">star</span><span className="material-symbols-outlined text-sm">star</span>
                                </div>
                            </div>
                            <h4 className="font-bold mb-2">Great value for money</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                While it's a bit more expensive than budget alternatives, the longevity makes it much more cost-effective in the long run.
                            </p>
                        </div>

                        <button className="flex items-center justify-center gap-2 text-primary dark:text-indigo-400 font-bold text-sm mx-auto hover:underline">
                            Load more reviews
                            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductDetailPage;
