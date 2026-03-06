import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getBrands, createCategory, createBrand } from "../../api/productApi";
import { getDashboardStats } from "../../api/adminApi";

const Dashboard = () => {
  const { showError, showSuccess } = useToast();

  // Dashboard & Product State
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    originalPrice: "",
    stock: "",
    categoryId: "",
    brandId: "",
    imageUrl: "",
    tags: "",
    status: "DRAFT"
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "", imageUrl: "" });

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandFormData, setBrandFormData] = useState({ name: "", description: "", logoUrl: "" });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Stats
      try {
        const statsRes = await getDashboardStats();
        setStats(statsRes.data?.data || statsRes.data);
      } catch (e) {
        console.warn("Failed to load dashboard stats", e);
      }

      // Fetch Products
      const productsRes = await getProducts({ page, size: 10 });
      const pd = productsRes.data?.data || productsRes.data;
      if (pd.content !== undefined) {
        setProducts(pd.content);
        setTotalPages(pd.totalPages || 1);
        setTotalElements(pd.totalElements || pd.content.length);
      } else if (Array.isArray(pd)) {
        setProducts(pd);
      }

      // Fetch Categories and Brands for the form
      try {
        const catRes = await getCategories();
        setCategories(catRes.data?.data || catRes.data || []);
      } catch (e) { }

      try {
        const brandRes = await getBrands();
        setBrands(brandRes.data?.data || brandRes.data || []);
      } catch (e) { }

    } catch (err) {
      showError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      showSuccess("Product deleted successfully");
      fetchData();
    } catch (err) {
      showError("Failed to delete product");
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        price: product.salePrice || product.basePrice || "",
        originalPrice: product.salePrice ? product.basePrice : "",
        stock: product.stock || "",
        categoryId: product.category?.id || "",
        brandId: product.brand?.id || "",
        imageUrl: product.imageUrl || (product.images && product.images[0]) || "",
        tags: product.tags ? product.tags.join(", ") : "",
        status: product.status || "DRAFT"
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "", description: "", sku: "", price: "", originalPrice: "", stock: "",
        categoryId: "", brandId: "", imageUrl: "", tags: "", status: "DRAFT"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data mimicking a form submittal or json payload (matching existing controllers)
      const payload = {
        name: formData.name,
        description: formData.description,
        basePrice: formData.originalPrice ? parseFloat(formData.originalPrice) : (parseFloat(formData.price) || 0),
        salePrice: formData.originalPrice ? parseFloat(formData.price) : null,
        sku: formData.sku || `SKU-${Date.now()}`,
        stock: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        imageUrls: formData.imageUrl ? formData.imageUrl.split(",").map(t => t.trim()) : []
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showSuccess("Product updated successfully");
      } else {
        await createProduct(payload);
        showSuccess("Product created successfully");
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || err.message || "Operation failed");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory(categoryFormData);
      showSuccess("Category created successfully");
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: "", description: "", imageUrl: "" });
      fetchData(); // Refresh dropdowns
    } catch (err) {
      showError("Failed to create category");
    }
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBrand(brandFormData);
      showSuccess("Brand created successfully");
      setIsBrandModalOpen(false);
      setBrandFormData({ name: "", description: "", logoUrl: "" });
      fetchData(); // Refresh dropdowns
    } catch (err) {
      showError("Failed to create brand");
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard & Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your store products and view stats</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">category</span>
            Add Category
          </button>
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">stars</span>
            Add Brand
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Basic Stats Summary (condensed) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts ?? totalElements}</p>
          </div>
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined">people</span>
          </div>
        </div>
      </div>

      {/* Product Management Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Products Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No products found. Create one.
                  </td>
                </tr>
              ) : products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 h-full w-full flex items-center justify-center">image</span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 max-w-[200px] truncate">{product.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">${parseFloat(product.salePrice || product.basePrice || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{product.category?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full border ${product.status === 'ACTIVE' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>
                      {product.status || 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="h-8 w-8 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {page * 10 + 1} to {Math.min((page + 1) * 10, totalElements)} of {totalElements} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input required type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (Optional)</label>
                  <input type="number" step="0.01" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input required type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select required name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select name="brandId" value={formData.brandId} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select a brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL(s) (comma separated)</label>
                  <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://..." className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="4" name="description" value={formData.description} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">Create New Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input required type="text" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="text" value={categoryFormData.imageUrl} onChange={(e) => setCategoryFormData({ ...categoryFormData, imageUrl: e.target.value })} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Form Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">Create New Brand</h3>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleBrandSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <input required type="text" value={brandFormData.name} onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={brandFormData.description} onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input type="text" value={brandFormData.logoUrl} onChange={(e) => setBrandFormData({ ...brandFormData, logoUrl: e.target.value })} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">Create Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
