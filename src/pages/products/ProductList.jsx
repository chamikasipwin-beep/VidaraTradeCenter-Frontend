import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../../api/productApi";
import { useToast } from "../../context/ToastContext";

const ProductList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { showError } = useToast();

    // State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 0,
        totalPages: 1,
        totalElements: 0,
    });

    // Filters
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "createdAt,desc");
    const [priceRange, setPriceRange] = useState(searchParams.get("maxPrice") || 1000);
    const [minRating, setMinRating] = useState(searchParams.get("minRating") || 0);

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const page = parseInt(searchParams.get("page") || "0", 10);
        fetchProducts(page, selectedCategory, sortBy, priceRange, minRating);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, selectedCategory, sortBy, priceRange, minRating]);

    const fetchInitialData = async () => {
        try {
            // Attempt to fetch categories, fail gracefully if not yet implemented
            try {
                const catRes = await getCategories();
                setCategories(catRes.data?.data || catRes.data || []);
            } catch (catErr) {
                console.warn("Categories API not yet available", catErr);
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchProducts = async (page = 0, category = "", sort = "createdAt,desc", maxPrice = 1000, minRate = 0) => {
        setLoading(true);
        try {
            const [sortBy, sortDir] = sort.split(",");
            const params = {
                page,
                size: 12,
                sortBy,
                sortDir,
                ...(category && { categoryId: category }), // Backend expects categoryId
                ...(maxPrice < 1000 && { maxPrice }), // Backend expects maxPrice
                ...(minRate > 0 && { minRating: minRate }) // Leave this in case we add it later
            };

            const response = await getProducts(params);
            const data = response.data?.data || response.data;

            // Handle both Page<Product> and List<Product> responses depending on backend standard
            if (data.content !== undefined) {
                setProducts(data.content);
                setPagination({
                    page: data.pageNumber || data.page || 0,
                    totalPages: data.totalPages || 1,
                    totalElements: data.totalElements || data.content.length,
                });
            } else if (Array.isArray(data)) {
                setProducts(data);
                setPagination({ page: 0, totalPages: 1, totalElements: data.length });
            } else {
                setProducts([]);
            }

        } catch (err) {
            console.error("Failed to fetch products:", err);
            showError("Failed to load products. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            searchParams.set("page", newPage);
            setSearchParams(searchParams);
        }
    };

    const handleCategoryClick = (categoryId) => {
        const newCategory = categoryId === selectedCategory ? "" : categoryId;
        setSelectedCategory(newCategory);

        if (newCategory) {
            searchParams.set("category", newCategory);
        } else {
            searchParams.delete("category");
        }
        searchParams.set("page", 0);
        setSearchParams(searchParams);
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        setSortBy(newSort);
        searchParams.set("sort", newSort);
        searchParams.set("page", 0);
        setSearchParams(searchParams);
    };

    const handlePriceChange = (e) => {
        setPriceRange(e.target.value);
    }

    // Helper to commit price change after sliding
    const handlePriceCommit = () => {
        searchParams.set("maxPrice", priceRange);
        searchParams.set("page", 0);
        setSearchParams(searchParams);
    }

    const handleRatingChange = (rating) => {
        const newRating = rating === parseInt(minRating) ? 0 : rating;
        setMinRating(newRating);

        if (newRating > 0) {
            searchParams.set("minRating", newRating);
        } else {
            searchParams.delete("minRating");
        }
        searchParams.set("page", 0);
        setSearchParams(searchParams);
    }

    const renderStars = (rating = 0) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                stars.push(<span key={i} className="material-symbols-outlined text-base fill-1">star</span>);
            } else if (rating >= i - 0.5) {
                stars.push(<span key={i} className="material-symbols-outlined text-base">star_half</span>);
            } else {
                stars.push(<span key={i} className="material-symbols-outlined text-base text-slate-300 dark:text-slate-600">star</span>);
            }
        }
        return <div className="flex text-amber-400">{stars}</div>;
    };

    return (
        <div className="flex-1 mx-auto max-w-[1440px] w-full px-4 lg:px-20 py-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <Link to="/" className="text-slate-500 hover:text-primary transition-colors">Home</Link>
                <span className="text-slate-400">/</span>
                <span className="text-primary dark:text-white font-medium">All Products</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar: CategoryFilter */}
                <aside className="w-full lg:w-64 shrink-0 space-y-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Categories</h3>
                        <nav className="space-y-1">
                            <button
                                onClick={() => handleCategoryClick("")}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${!selectedCategory
                                    ? "bg-primary text-white"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">grid_view</span>
                                <span className="text-sm">All Products</span>
                            </button>

                            {/* Render categories from API if available, else static placeholders */}
                            {categories.length > 0 ? (
                                categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryClick(cat.id || cat.name)}
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${selectedCategory === (cat.id || cat.name)
                                            ? "bg-primary text-white"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">category</span>
                                        <span className="text-sm">{cat.name}</span>
                                    </button>
                                ))
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleCategoryClick("electronics")}
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${selectedCategory === "electronics"
                                            ? "bg-primary text-white"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">devices</span>
                                        <span className="text-sm">Electronics</span>
                                    </button>
                                    <button
                                        onClick={() => handleCategoryClick("home-living")}
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${selectedCategory === "home-living"
                                            ? "bg-primary text-white"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">chair</span>
                                        <span className="text-sm">Home & Living</span>
                                    </button>
                                    <button
                                        onClick={() => handleCategoryClick("fashion")}
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${selectedCategory === "fashion"
                                            ? "bg-primary text-white"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">apparel</span>
                                        <span className="text-sm">Fashion</span>
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-500">Price Range</h3>
                        <div className="px-2">
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                value={priceRange}
                                onChange={handlePriceChange}
                                onMouseUp={handlePriceCommit}
                                onTouchEnd={handlePriceCommit}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                                <span>$0</span>
                                <span className="text-primary dark:text-white">${priceRange}</span>
                                <span>$1,000+</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-500">Rating</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={parseInt(minRating) === 4}
                                    onChange={() => handleRatingChange(4)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 bg-transparent"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">4 Stars & Above</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={parseInt(minRating) === 3}
                                    onChange={() => handleRatingChange(3)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 bg-transparent"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">3 Stars & Above</span>
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Main Area: ProductGrid */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-1 text-slate-900 dark:text-white">Explore Products</h1>
                            <p className="text-slate-500 text-sm">
                                Showing {pagination.totalElements > 0 ? (pagination.page * 12) + 1 : 0}-{Math.min((pagination.page + 1) * 12, pagination.totalElements)} of {pagination.totalElements} results
                            </p>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                            <div className="relative flex items-center bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg">
                                <select
                                    value={sortBy}
                                    onChange={handleSortChange}
                                    className="appearance-none bg-transparent pl-4 pr-10 py-2 border-none text-sm font-medium focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200"
                                >
                                    <option value="createdAt,desc">Sort by: Newest</option>
                                    <option value="basePrice,asc">Sort by: Price (Low to High)</option>
                                    <option value="basePrice,desc">Sort by: Price (High to Low)</option>
                                    <option value="name,asc">Sort by: Name (A-Z)</option>
                                </select>
                                <span className="absolute right-3 material-symbols-outlined text-base pointer-events-none text-slate-500">expand_more</span>
                            </div>
                            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-background-dark sm:hidden text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">inventory_2</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
                            <p className="text-slate-500 max-w-md">We couldn't find any products matching your current filters. Try selecting a different category or adjusting the price range.</p>
                            <button
                                onClick={() => {
                                    setSearchParams({});
                                    setSelectedCategory("");
                                    setPriceRange(1000);
                                    setMinRating(0);
                                }}
                                className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Grid of ProductCards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div key={product.id} className="group bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
                                        <Link to={`/products/${product.id}`} className="aspect-[4/3] w-full overflow-hidden relative block">
                                            <img
                                                src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <button
                                                onClick={(e) => { e.preventDefault(); /* Handle Wishlist */ }}
                                                className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm text-slate-900 dark:text-white hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">favorite</span>
                                            </button>

                                            {/* Optional Badges based on logic */}
                                            {/* <span className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded tracking-wider">New</span> */}
                                        </Link>
                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                                {product.category?.name || "Uncategorized"}
                                            </p>
                                            <Link to={`/products/${product.id}`}>
                                                <h3 className="font-bold text-lg mb-1 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors text-slate-900 dark:text-slate-100 line-clamp-1">
                                                    {product.name}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-1 mb-3">
                                                {renderStars(product.rating || 4.5)}
                                                <span className="text-xs text-slate-500 ml-1">({product.reviewsCount || Math.floor(Math.random() * 200) + 10})</span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-4">
                                                <span className="text-xl font-black text-primary dark:text-white">
                                                    ${parseFloat(product.salePrice || product.basePrice || 0).toFixed(2)}
                                                </span>
                                                <button className="px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-primary text-white rounded-lg text-sm font-bold hover:bg-primary dark:hover:bg-indigo-50 transition-colors flex items-center gap-2">
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <nav className="mt-12 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 0}
                                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>

                                    {[...Array(pagination.totalPages)].map((_, idx) => {
                                        // Show first, last, and pages around current page
                                        if (
                                            idx === 0 ||
                                            idx === pagination.totalPages - 1 ||
                                            (idx >= pagination.page - 1 && idx <= pagination.page + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handlePageChange(idx)}
                                                    className={`w-10 h-10 rounded-lg border font-bold transition-colors cursor-pointer ${pagination.page === idx
                                                        ? "bg-primary text-white border-primary"
                                                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                        }`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            );
                                        } else if (
                                            idx === pagination.page - 2 ||
                                            idx === pagination.page + 2
                                        ) {
                                            return <span key={idx} className="px-2 text-slate-400">...</span>;
                                        }
                                        return null;
                                    })}

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages - 1}
                                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Global style injection for star filled icon if not present in main css */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .fill-1 { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            `}} />
        </div>
    );
};

export default ProductList;
