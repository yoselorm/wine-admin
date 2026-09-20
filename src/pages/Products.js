import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchProducts,
  clearProductStatus
} from '../redux/ProductSlice';
import { ShoppingBag, Plus, Search, Loader2, Star } from 'lucide-react';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Pagination from '../components/Pagination';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const swatchColor = (prod) => {
  const cat = (prod.categories?.[0]?.name || prod.category?.name || '').toLowerCase();
  if (cat.includes('red')) return '#7C2D3A';
  if (cat.includes('white')) return '#C9A227';
  if (cat.includes('spark')) return '#E8A0B4';
  if (cat.includes('dessert')) return '#4A0E1F';
  if (cat.includes('ros')) return '#E0A0A8';
  return '#9CA3AF';
};

const statusInfo = (prod) => {
  if (prod.stock_quantity <= 0) return { label: 'Out of Stock', tone: 'red' };
  if (prod.stock_quantity <= 10) return { label: 'Low Stock', tone: 'yellow' };
  return { label: 'In Stock', tone: 'green' };
};

// GET /admin/products lifts `links`/`meta` beside `data` (ApiResponser::paginated()) — real page
// numbers and a real total, not a flat array to infer paging from. Leave per_page unset and take
// the API's own default (15) rather than overriding it.
const Products = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: products, pagination, loading, error, successMessage } = useSelector(s => s.products);

  const [searchInputValue, setSearchInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, search: searchInputValue }));
  }, [currentPage]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearProductStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductStatus());
    }
  }, [error, successMessage, dispatch]);

  const debouncedFetch = useCallback(
    debounce((str) => {
      setCurrentPage(1);
      dispatch(fetchProducts({ page: 1, search: str }));
    }, 400),
    [dispatch]
  );

  const handleSearchChange = (e) => {
    setSearchInputValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          Products
          <span className="text-2xl font-bold text-gray-300">{pagination?.total ?? products.length}</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or SKU..."
              value={searchInputValue}
              onChange={handleSearchChange}
              className="w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <Button icon={Plus} onClick={() => navigate('/dashboard/products/new')}>Add Product</Button>
        </div>
      </div>

      {/* TABLE */}
      <Card padded={false}>
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-gray-500" size={24} />
            <span className="text-sm text-gray-400">Loading catalog items...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No matching products found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-center">Featured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((prod) => {
                    const status = statusInfo(prod);
                    const primaryImage = prod.images?.find((img) => img.is_primary) || prod.images?.[0];
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => navigate(`/dashboard/products/${prod.id}/edit`)}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {primaryImage?.image_url ? (
                              <span className="w-11 h-11 rounded-full flex-shrink-0 bg-white border border-gray-100 overflow-hidden flex items-center justify-center p-1">
                                <img src={primaryImage.image_url} alt={primaryImage.alt_text || prod.name}
                                  className="w-full h-full object-contain" />
                              </span>
                            ) : (
                              <span className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: swatchColor(prod) }} />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{prod.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{prod.brand?.name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-gray-500">{prod.sku || '—'}</td>
                        <td className="py-4 px-4 text-gray-600">{prod.categories?.[0]?.name || prod.category?.name || '—'}</td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-semibold text-gray-900">₵{Number(prod.price).toFixed(0)}</span>
                          {prod.sale_price > 0 && (
                            <span className="text-xs text-gray-400 ml-1">· was ₵{Number(prod.price).toFixed(0)}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-700">{prod.stock_quantity}</td>
                        <td className="py-4 px-4">
                          <Badge tone={status.tone} size="lg">{status.label}</Badge>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {prod.is_featured && <Star size={16} className="inline fill-yellow-400 text-yellow-400" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <Pagination meta={pagination} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Products;
