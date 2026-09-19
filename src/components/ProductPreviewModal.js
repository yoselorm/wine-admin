import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Star, ImageOff } from 'lucide-react';
import Badge from './ui/Badge';

// Mirrors GET /products/{slug} for a saved product, published or not — see frontend.md §4.11.
// Approved reviews only, same as the real page.
const ProductPreviewModal = ({ isOpen, onClose, loading, error, message, product }) => {
  const [activeImage, setActiveImage] = useState(0);
  if (!isOpen) return null;

  const images = product?.images || [];
  const isLive = /live on the storefront/i.test(message || '');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-3xl w-full relative z-50 overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Storefront Preview</h3>
            {message && (
              <p className={`text-xs mt-0.5 ${isLive ? 'text-green-600' : 'text-yellow-600'}`}>{message}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Loading preview...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-sm text-red-500">{error}</div>
          ) : !product ? null : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                {images.length > 0 ? (
                  <>
                    <div className="aspect-square rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
                      <img src={images[activeImage]?.image_url} alt={images[activeImage]?.alt_text || product.name}
                        className="w-full h-full object-cover" />
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {images.map((img, i) => (
                          <button key={img.id || i} onClick={() => setActiveImage(i)}
                            className={`w-14 h-14 flex-shrink-0 rounded-md border overflow-hidden ${i === activeImage ? 'border-violet-500' : 'border-gray-200'}`}>
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-square rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-300">
                    <ImageOff size={28} />
                    <span className="text-xs mt-2">No image</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                    <Badge tone={product.is_published ? 'green' : 'yellow'}>{product.is_published ? 'Published' : 'Draft'}</Badge>
                  </div>
                  {product.brand?.name && <p className="text-xs text-gray-400 mt-0.5">{product.brand.name}</p>}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">GHS {Number(product.sale_price ?? product.price ?? 0).toFixed(2)}</span>
                  {product.sale_price && product.sale_price !== product.price && (
                    <span className="text-sm text-gray-400 line-through">GHS {Number(product.price).toFixed(2)}</span>
                  )}
                </div>

                {product.short_description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
                )}

                {product.description && (
                  <div className="text-sm text-gray-600 leading-relaxed prose-sm"
                    dangerouslySetInnerHTML={{ __html: product.description }} />
                )}

                {product.local_pairing_notes && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ghanaian Pairing</p>
                    <p className="text-sm text-gray-600">{product.local_pairing_notes}</p>
                  </div>
                )}

                {Array.isArray(product.reviews) && product.reviews.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Reviews ({product.reviews.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {product.reviews.map((r) => (
                        <div key={r.id} className="text-xs">
                          <div className="flex items-center gap-1 text-yellow-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} fill={i < r.rating ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                          <p className="text-gray-600 mt-0.5">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductPreviewModal;
