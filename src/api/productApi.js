import API from "./axios";

/**                                                         
PRODUCT API — Placeholder for DEV 3                      
                                                     
Backend endpoints expected:                                
GET  /api/products          → paginated product list     
GET  /api/products/{id}     → single product detail      
GET  /api/categories        → category list              
GET  /api/brands            → brand list                 
                                                              
Expected response format (PagedResponse):                  
    {                                                          
        "content": [ ...products ],                              
        "page": 0,                                               
        "size": 10,                                              
        "totalElements": 50,                                     
        "totalPages": 5,                                         
        "last": false                                            
    }                                                          

  Expected ProductResponse fields:
  id, name, slug, description, price,
  imageUrl, category (object with .name),
  brand (object with .name), stock, status
 */

// GET /api/products?page=0&size=10&sort=createdAt,desc
export const getProducts = (params = {}) => {
  return API.get("/products", { params });
};

// GET /api/products/:id
export const getProductById = (id) => {
  return API.get(`/products/${id}`);
};

// GET /api/categories (DEV 3: implement when ready)
export const getCategories = () => {
  return API.get("/categories");
};

// GET /api/brands (DEV 3: implement when ready)
export const getBrands = () => {
  return API.get("/brands");
};

// Admin endpoints
export const createProduct = (productData) => {
  return API.post("/products", productData);
};

export const updateProduct = (id, productData) => {
  return API.put(`/products/${id}`, productData);
};

export const deleteProduct = (id) => {
  return API.delete(`/products/${id}`);
};

export const createCategory = (categoryData) => {
  return API.post("/categories", categoryData);
};

export const deleteCategory = (id) => {
  return API.delete(`/categories/${id}`);
};

export const createBrand = (brandData) => {
  return API.post("/brands", brandData);
};

export const deleteBrand = (id) => {
  return API.delete(`/brands/${id}`);
};