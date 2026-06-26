import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  clearProductStatus 
} from '../redux/ProductSlice';
import { ShoppingBag, Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import toast from '../components/Toast';
import ProductFormDrawer from '../components/ProductFormDrawer';
import Pagination from '../components/Pagination';


const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};


const Products = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: products, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.products);

  // UI state
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Query params
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    brand_id: '',
    category_id: '',
    is_published: '',
    is_featured: '',
  });


  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, search: searchInputValue, ...filters }));
  }, [currentPage, filters]);

  // Notifications
  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearProductStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductStatus());
      setIsDrawerOpen(false);
      setEditingProduct(null);
    }
  }, [error, successMessage, dispatch]);

  // Debounced search — resets to page 1
  const debouncedFetch = useCallback(
    debounce((str) => {
      setCurrentPage(1);
      dispatch(fetchProducts({ page: 1, search: str, ...filters }));
    }, 400),
    [dispatch, filters]
  );

  const handleSearchChange = (e) => {
    setSearchInputValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const openCreateDrawer = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (e, product) => {
    e.stopPropagation();
    setEditingProduct(product);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = (cleanedData) => {
    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, productData: cleanedData }));
    } else {
      dispatch(createProduct(cleanedData));
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handlers
  // ---------------------------------------------------------------------------
  const handleDeleteTrigger = (e, product) => {
    e.stopPropagation();
    setItemToDelete(product);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteProduct(itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Products</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage premium items, stock controls, wine attributes, variants, and pairing structures.
          </p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200/60">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchInputValue}
            onChange={handleSearchChange}
            className="w-full text-xs bg-transparent border-none text-zinc-800 focus:outline-none"
          />
          {loading && <Loader2 className="animate-spin text-zinc-400" size={14} />}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <input type="text" name="brand_id" placeholder="Filter Brand ID" value={filters.brand_id}
            onChange={handleFilterChange} className="px-3 py-1.5 border border-zinc-200 rounded-lg bg-white" />
          <input type="text" name="category_id" placeholder="Filter Category ID" value={filters.category_id}
            onChange={handleFilterChange} className="px-3 py-1.5 border border-zinc-200 rounded-lg bg-white" />
          <select name="is_published" value={filters.is_published} onChange={handleFilterChange}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg bg-white text-zinc-500">
            <option value="">Visibility (All)</option>
            <option value="true">Published Only</option>
            <option value="false">Drafts</option>
          </select>
          <select name="is_featured" value={filters.is_featured} onChange={handleFilterChange}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg bg-white text-zinc-500">
            <option value="">Status (All)</option>
            <option value="true">Featured</option>
            <option value="false">Standard</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
            <span className="text-xs text-zinc-400">Loading catalog items...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No matching products found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5">Item Details / SKU</th>
                    <th className="py-3 px-5">Price</th>
                    <th className="py-3 px-5">Stock</th>
                    <th className="py-3 px-5">Badges</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {products.map((prod) => (
                    <tr
                      key={prod.id}
                      onClick={() => navigate(`/dashboard/products/${prod.id}`)}
                      className="hover:bg-zinc-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-zinc-900 group-hover:text-zinc-700">{prod.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{prod.sku || 'No SKU'}</div>
                      </td>
                      <td className="py-4 px-5 font-semibold text-zinc-900">
                        ₵{Number(prod.price).toFixed(2)}
                        {prod.sale_price > 0 && (
                          <span className="text-[10px] font-normal text-red-500 line-through ml-1">₵{Number(prod.sale_price).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-[11px] font-semibold ${prod.stock_quantity > 10 ? 'text-zinc-700' : 'text-amber-600'}`}>
                          {prod.stock_quantity} units
                        </span>
                      </td>
                      <td className="py-4 px-5 space-x-1">
                        {prod.is_published && (
                          <span className="bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-green-100 uppercase">Live</span>
                        )}
                        {prod.is_featured && (
                          <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-100 uppercase">Featured</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => openEditDrawer(e, prod)}
                          className="inline-flex p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 shadow-xs">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={(e) => handleDeleteTrigger(e, prod)}
                          className="inline-flex p-1.5 rounded-md border border-red-100 bg-white text-red-600 hover:bg-red-50 shadow-xs">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      {/* FORM DRAWER */}
      <ProductFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setEditingProduct(null); }}
        editingProduct={editingProduct}
        onSubmit={handleFormSubmit}
        mutationLoading={mutationLoading}
      />

      {/* DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        isDeleting={mutationLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Catalog Item"
        message={`Are you completely sure you want to drop "${itemToDelete?.name}" from store records? This wipes all historical structures and variations tied to this SKU.`}
      />
    </div>
  );
};

export default Products;