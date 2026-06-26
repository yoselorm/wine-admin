import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, Star, MessageSquare, Calendar, ShieldCheck, ShieldAlert,
  Package, Tag, Globe, Wine, Utensils, Info, Layers, Eye, FileText
} from 'lucide-react';
import { fetchProductById } from '../redux/ProductSlice';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Safely extract from your product slice
  const { currentProduct:product, loading, error } = useSelector((state) => state.products || { product: null, loading: false, error: null });
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  // Keep main preview image in sync with the fetched dataset
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const featured = product.images.find(img => img.is_featured);
      setActiveImage(featured ? featured.image_url : product.images[0].image_url);
    }
  }, [product]);

  // Helper helper to render clean, readable dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Loading inventory profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-red-100 p-6 rounded-xl text-center shadow-xs">
          <Info className="mx-auto text-red-500 mb-3" size={32} />
          <h3 className="text-sm font-bold text-zinc-900">Data Fetch Failure</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 text-xs text-zinc-700">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-lg transition-colors border border-zinc-200/50"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-zinc-900">{product.name}</h1>
                <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200/40">
                  {product.sku}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Slug: <span className="font-mono">{product.slug}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full font-bold tracking-wide text-[10px] uppercase border ${
              product.is_published 
                ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' 
                : 'bg-zinc-100 border-zinc-200 text-zinc-500'
            }`}>
              {product.is_published ? 'Published' : 'Draft'}
            </span>
            {product.is_featured && (
              <span className="px-2.5 py-1 rounded-full font-bold tracking-wide text-[10px] uppercase bg-amber-50 border border-amber-200/60 text-amber-700">
                Featured Cover
              </span>
            )}
          </div>
        </div>

        {/* Operational Dashboard Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SECTION: Visual Assets & Customer Response Logs */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Image Catalog Frame */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-3">
              <div className="aspect-square bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                {activeImage ? (
                  <img src={activeImage} alt={product.name} className="object-contain max-h-full w-full p-2" />
                ) : (
                  <div className="text-zinc-400 font-medium">No Image Configured</div>
                )}
              </div>
              
              {product.images?.length > 1 && (
                <div className="grid grid-cols-5 gap-2 overflow-x-auto pt-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img.image_url)}
                      className={`aspect-square rounded border transition-all overflow-hidden p-1 bg-white ${
                        activeImage === img.image_url ? 'border-zinc-950 ring-2 ring-zinc-950/10' : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="object-contain w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Response Logs (Reviews Array Section) */}
            <div className="bg-white rounded-xl border border-zinc-200/60 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <MessageSquare size={13} className="text-zinc-500" />
                  <span>Customer Reviews ({product.reviews?.length || 0})</span>
                </div>
              </div>
              
              <div className="p-4 divide-y divide-zinc-100 max-h-[380px] overflow-y-auto">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div key={review.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          {/* Rating Engine Rendering */}
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, index) => (
                              <Star 
                                key={index} 
                                size={11} 
                                className={index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'} 
                              />
                            ))}
                            <span className="ml-1 text-[11px] font-bold text-zinc-800">{review.rating}/5</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono tracking-tight">UID: {review.user_id}</p>
                        </div>

                        {/* Mod-Approval Stamp Indicator */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                          review.is_approved 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/40' 
                            : 'bg-rose-50 text-rose-700 border-rose-200/40'
                        }`}>
                          {review.is_approved ? <ShieldCheck size={10}/> : <ShieldAlert size={10}/>}
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      {/* Comment Log Render handling null states */}
                      <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-md text-zinc-600 font-sans italic text-[11px]">
                        {review.comment ? (
                          `"${review.comment}"`
                        ) : (
                          <span className="text-zinc-400 not-italic text-[10px]">No comment left with rating score.</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <Calendar size={10} />
                        <span>Logged {formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-400 italic">No feedback submissions found on this inventory profile.</div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SECTION: Core Financials, Inventory Matrices & System Attributes */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Core Financials & Stock Ledger */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200/60 shadow-xs">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Base Price</p>
                <p className="text-lg font-bold text-zinc-900 mt-1 font-mono">₵{product.price?.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200/60 shadow-xs">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sale Price</p>
                <p className="text-lg font-bold text-amber-600 mt-1 font-mono">
                  {product.sale_price > 0 ? `₵${product.sale_price.toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200/60 shadow-xs">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Stock Available</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Package size={14} className={product.stock_quantity > 0 ? 'text-zinc-700' : 'text-rose-500'} />
                  <span className={`text-lg font-bold font-mono ${product.stock_quantity === 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
                    {product.stock_quantity}
                  </span>
                </div>
              </div>
            </div>

            {/* Mappings & System Relations */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                <Layers size={13} className="text-zinc-400" />
                System Mappings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-zinc-400 font-medium mb-1 flex items-center gap-1"><Tag size={11}/>Brand Entity</span>
                  <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200/40 rounded-lg text-zinc-800 font-semibold">
                    {product.brand?.name || product.brand_id || 'Direct / Generic'}
                  </div>
                </div>

                <div>
                  <span className="block text-zinc-400 font-medium mb-1 flex items-center gap-1"><Globe size={11}/>Wine Regions</span>
                  <div className="flex flex-wrap gap-1">
                    {product.wine_regions?.map((r) => (
                      <span key={r.id} className="bg-zinc-100 border border-zinc-200 text-zinc-800 px-2 py-0.5 rounded font-medium">{r.name}</span>
                    )) || <span className="text-zinc-400 italic">None linked</span>}
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-zinc-400 font-medium mb-1">Assigned Categories</span>
                <div className="flex flex-wrap gap-1">
                  {product.categories?.map((c) => (
                    <span key={c.id} className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">{c.name}</span>
                  )) || <span className="text-zinc-400 italic">None linked</span>}
                </div>
              </div>
            </div>

            {/* Custom Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Wine Attributes */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-3">
                <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                  <Wine size={13} className="text-zinc-400" />
                  Wine Characteristics
                </h3>
                {product.wine_attributes && product.wine_attributes.length > 0 ? (
                  <div className="space-y-1.5">
                    {product.wine_attributes.map((attr, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 last:border-0">
                        <span className="text-zinc-400 font-medium capitalize">{attr.attribute_type?.replace('_', ' ')}</span>
                        <span className="font-bold text-zinc-900 bg-zinc-50 border px-2 py-0.5 rounded-md">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 italic py-2">No structural properties defined.</p>
                )}
              </div>

              {/* Culinary Pairings */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-3">
                <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                  <Utensils size={13} className="text-zinc-400" />
                  Gourmet Dish Pairings
                </h3>
                {product.pairings && product.pairings.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {product.pairings.map((pair, i) => (
                      <div key={i} className="p-2 bg-zinc-50 border border-zinc-200/40 rounded-lg">
                        <span className="block font-bold text-zinc-950">{pair.dish?.name || `Dish ID: ${pair.dish_id}`}</span>
                        {pair.reason && <p className="text-[11px] text-zinc-500 mt-0.5 leading-normal">"{pair.reason}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 italic py-2">No menu items aligned to this product.</p>
                )}
              </div>
            </div>

            {/* Descriptions & Marketing Copy */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Eye size={12}/> Short Teaser Description
                </h4>
                <p className="text-zinc-700 bg-zinc-50/70 border border-zinc-100 p-2.5 rounded-lg leading-relaxed">
                  {product.short_description || <span className="text-zinc-400 italic">No short description written.</span>}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <FileText size={12}/> Master Presentation Description
                </h4>
                <p className="text-zinc-700 bg-zinc-50/70 border border-zinc-100 p-3 rounded-lg whitespace-pre-line leading-relaxed">
                  {product.description || <span className="text-zinc-400 italic">No main descriptive record added.</span>}
                </p>
              </div>
            </div>

            {/* Logistics Measures */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs">
              <h3 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3">Freight & Dimensional Metrics</h3>
              <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                <div className="bg-zinc-50 p-2 border rounded-md"><span className="block text-[10px] text-zinc-400 font-sans font-medium mb-0.5">Weight</span>{product.weight || 0} kg</div>
                <div className="bg-zinc-50 p-2 border rounded-md"><span className="block text-[10px] text-zinc-400 font-sans font-medium mb-0.5">Length</span>{product.length || 0} cm</div>
                <div className="bg-zinc-50 p-2 border rounded-md"><span className="block text-[10px] text-zinc-400 font-sans font-medium mb-0.5">Width</span>{product.width || 0} cm</div>
                <div className="bg-zinc-50 p-2 border rounded-md"><span className="block text-[10px] text-zinc-400 font-sans font-medium mb-0.5">Height</span>{product.height || 0} cm</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailPage;