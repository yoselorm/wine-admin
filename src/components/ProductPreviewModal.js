import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Star, ImageOff, Minus, Plus, ShoppingBag } from 'lucide-react';
import Badge from './ui/Badge';

// The four sliders shown on the storefront product page. Each pairs two attribute_type scores
// (or one score read from both ends) into a single Light↔Bold-style track — see frontend.md's
// "mapping the two sliders" note for why tannic/soft aren't simply opposites of each other.
const CHARACTERISTIC_SLIDERS = [
  { left: 'Light', right: 'Bold', axis: 'bold', invertAxis: 'light' },
  { left: 'Smooth', right: 'Tannic', axis: 'tannic', invertAxis: 'soft' },
  { left: 'Dry', right: 'Sweet', axis: 'sweet', invertAxis: 'dry' },
  { left: 'Soft', right: 'Acidic', axis: 'acidity', invertAxis: 'soft' },
];

// Attribute scores show up as either 0–1 (the AI draft's shape) or 0–10 (the stored shape) —
// normalize whichever arrives to a 0–100 track position.
const toPercent = (raw) => {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return n <= 1 ? n * 100 : (n / 10) * 100;
};

// The writable field is `characteristics` ({axis, score}); `wine_attributes`
// ({attribute_type, value}) is an older/separate shape some responses may still carry.
const findScore = (attributes, axis) => {
  const hit = attributes?.find((a) => (a.axis ?? a.attribute_type) === axis);
  if (!hit) return null;
  return toPercent(hit.score ?? hit.value);
};

const sliderPosition = (attributes, { axis, invertAxis }) => {
  const direct = findScore(attributes, axis);
  if (direct !== null) return direct;
  const inverted = findScore(attributes, invertAxis);
  return inverted !== null ? 100 - inverted : null;
};

const RatingStars = ({ rating, size = 13 }) => (
  <div className="flex items-center gap-0.5 text-yellow-500">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={size} fill={i < Math.round(rating) ? 'currentColor' : 'none'} strokeWidth={1.5} />
    ))}
  </div>
);

// Mirrors GET /products/{slug} for a saved product, published or not — see frontend.md §4.11.
// Approved reviews only, same as the real page. Laid out to match the storefront product page
// (image + buy box, then characteristics/pairings below) so an admin can sanity-check the page
// a customer will actually see, not just the raw fields.
const ProductPreviewModal = ({ isOpen, onClose, loading, error, message, product }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  if (!isOpen) return null;

  const images = product?.images || [];
  const isLive = /live on the storefront/i.test(message || '');
  const attributes = product?.characteristics || product?.wine_attributes || [];
  const pairings = product?.pairings || [];
  const rating = product?.average_rating;
  const reviewsCount = product?.reviews_count ?? product?.reviews?.length ?? 0;
  const tags = [
    ...(product?.categories?.map((c) => c.name) || []),
    product?.wine_regions?.[0]?.name,
  ].filter(Boolean);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-4xl w-full relative z-50 overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
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

        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Loading preview...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-sm text-red-500">{error}</div>
          ) : !product ? null : (
            <>
              {/* Product image + buy box — same layout as the storefront product page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6">
                <div>
                  {product.is_featured && (
                    <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wide bg-gray-900 text-white px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                  {images.length > 0 ? (
                    <>
                      <div className="aspect-square rounded-lg border border-gray-100 overflow-hidden bg-white flex items-center justify-center p-4">
                        <img src={images[activeImage]?.image_url} alt={images[activeImage]?.alt_text || product.name}
                          className="max-w-full max-h-full object-contain" />
                      </div>
                      {images.length > 1 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {images.map((img, i) => (
                            <button key={img.id || i} onClick={() => setActiveImage(i)}
                              className={`w-14 h-14 flex-shrink-0 rounded-md border overflow-hidden bg-white p-1 ${i === activeImage ? 'border-violet-500' : 'border-gray-200'}`}>
                              <img src={img.image_url} alt="" className="w-full h-full object-contain" />
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
                  {rating != null ? (
                    <div className="flex items-center gap-1.5">
                      <RatingStars rating={rating} />
                      <span className="text-xs text-gray-400">({reviewsCount})</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No reviews yet</p>
                  )}

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

                  {/* Visual only — mirrors the storefront buy box, does nothing in a preview */}
                  <div className="flex items-center gap-2" title="Preview only — not functional">
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 text-gray-500 hover:bg-gray-50">
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                      <button type="button" onClick={() => setQty((q) => q + 1)} className="p-2 text-gray-500 hover:bg-gray-50">
                        <Plus size={13} />
                      </button>
                    </div>
                    <button type="button" disabled
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md opacity-60 cursor-not-allowed">
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                  </div>

                  {product.short_description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
                  )}

                  {product.description && (
                    <div className="text-sm text-gray-600 leading-relaxed prose-sm"
                      dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((t) => (
                        <span key={t} className="text-[10px] font-bold uppercase tracking-wide border border-gray-200 text-gray-500 px-2 py-1 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Characteristics + pairings — same two-column band as the storefront page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-6 pb-6 border-t border-gray-100 pt-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Characteristics</h3>
                  <div className="space-y-4">
                    {CHARACTERISTIC_SLIDERS.map((slider) => {
                      const pos = sliderPosition(attributes, slider);
                      return (
                        <div key={slider.right}>
                          <div className="relative h-1.5 bg-gray-100 rounded-full">
                            {pos !== null && (
                              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-900"
                                style={{ left: `${Math.min(100, Math.max(0, pos))}%` }} />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-1.5">
                            <span>{slider.left}</span>
                            <span>{slider.right}</span>
                          </div>
                        </div>
                      );
                    })}
                    {attributes.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No tasting scores on this wine yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Food Pairings</h3>
                  {pairings.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {pairings.map((p, i) => (
                        <span key={p.id || i} className="text-xs font-medium border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full">
                          {p.dish?.name || p.dish_name || p.dish}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No pairings suggested yet.</p>
                  )}

                  {product.local_pairing_notes && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ghanaian Pairing</p>
                      <p className="text-sm text-gray-600">{product.local_pairing_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {Array.isArray(product.reviews) && product.reviews.length > 0 && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Reviews ({product.reviews.length})</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {product.reviews.map((r) => (
                      <div key={r.id} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <RatingStars rating={r.rating} size={11} />
                          {r.reviewer?.name && <span className="text-gray-400">{r.reviewer.name}</span>}
                        </div>
                        {r.comment && <p className="text-gray-600 mt-1">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductPreviewModal;
