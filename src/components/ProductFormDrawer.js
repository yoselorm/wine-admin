import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { X, Plus, Trash, Loader2 } from 'lucide-react';
// Adjust these paths to match your actual brand and category slice locations
import { fetchBrands } from '../redux/BrandSlice'; 
import { fetchCategories } from '../redux/CategorySlice';

const ProductFormDrawer = ({ isOpen, onClose, editingProduct, onSubmit, mutationLoading }) => {
  const dispatch = useDispatch();
  
  // Pulling relationships from your global store layers
  const { brands } = useSelector((state) => state.brands || { items: [] });
  const { categories } = useSelector((state) => state.categories || { items: [] });

  const initialFormState = {
    name: '',
    sku: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    sale_price: 0,
    stock_quantity: 0,
    is_published: true,
    is_featured: false,
    brand_id: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    category_ids: [],
    region_ids: [],
    blog_ids: [],
    variants: [],
    images: [],
    wine_attributes: [],
    pairings: []
  };

  const [formData, setFormData] = useState(initialFormState);

  // Load dependency parameters on mount
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchBrands());
      dispatch(fetchCategories());
    }
  }, [dispatch, isOpen]);

  // Sync state when entering edit mode or resetting for a new creation
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        ...initialFormState,
        ...editingProduct,
        category_ids: editingProduct.category_ids || [],
        region_ids: editingProduct.region_ids || [],
        blog_ids: editingProduct.blog_ids || [],
        variants: editingProduct.variants || [],
        images: editingProduct.images || [],
        wine_attributes: editingProduct.wine_attributes || [],
        pairings: editingProduct.pairings || []
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingProduct, isOpen]);

  // Handle standard input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Automatically compute slugs safely from the name field
  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    }));
  };

  // Handles multiple selection for category IDs
  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, category_ids: selectedOptions }));
  };

  // Dynamic primitives arrays add/remove (e.g., region_ids, blog_ids strings)
  const addStringArrayItem = (field) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const handleStringArrayChange = (index, value, field) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const removeStringArrayItem = (index, field) => {
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  // Dynamic nested objects arrays add/remove (variants, images, attributes, pairings)
  const addNestedObjectItem = (field, structureTemplate) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], structureTemplate] }));
  };

  const handleNestedObjectChange = (index, field, key, value) => {
    const updated = [...formData[field]];
    updated[index] = { ...updated[index], [key]: value };
    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const removeNestedObjectItem = (index, field) => {
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean empty placeholder items out from raw text string arrays before forwarding
    const cleanedPayload = {
      ...formData,
      region_ids: formData.region_ids.filter(id => id.trim() !== ''),
      blog_ids: formData.blog_ids.filter(id => id.trim() !== ''),
    };

    onSubmit(cleanedPayload);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={onClose} />
      
      {/* Drawer Container Panel */}
      <div className="relative w-full max-w-xl h-screen bg-white shadow-2xl flex flex-col justify-between z-50 animate-slide-in">
        
        {/* Form Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Fill out all inventory values, variations, and physical configurations.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
        </div>

        {/* Scrollable Form Window */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-zinc-700 pb-24">
          
          {/* General Block */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider border-b pb-1">General Info</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={handleNameChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900" />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">SKU *</label>
                <input type="text" required name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900" />
              </div>
            </div>
            <div>
              <label className="block font-medium text-zinc-400 mb-1">Slug (Auto-generated)</label>
              <input type="text" readOnly value={formData.slug} className="w-full px-3 py-2 border border-zinc-100 bg-zinc-50 text-zinc-500 rounded-lg font-mono" />
            </div>
          </div>

          {/* Pricing & Stock Allocation */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider border-b pb-1">Pricing & Inventory</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Price ($) *</label>
                <input type="number" required name="price" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Sale Price ($)</label>
                <input type="number" name="sale_price" value={formData.sale_price} onChange={(e) => setFormData(prev => ({ ...prev, sale_price: Number(e.target.value) }))} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Stock Quantity *</label>
                <input type="number" required name="stock_quantity" value={formData.stock_quantity} onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Dynamic Dropdowns Block */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider border-b pb-1">Brand & Categories</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Brand Mapping</label>
                <select name="brand_id" value={formData.brand_id} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none">
                  <option value="">Choose a Brand</option>
                  {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Categories (Hold Ctrl / Cmd to select multiple)</label>
                <select multiple value={formData.category_ids} onChange={handleCategoryChange} className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg h-28 focus:outline-none">
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Physical Shipping Measures */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider border-b pb-1">Dimensions & Weights</h4>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-zinc-600 mb-1">Weight</label>
                <input type="number" name="weight" value={formData.weight} onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))} className="w-full px-2 py-1.5 border border-zinc-200 rounded-md" />
              </div>
              <div>
                <label className="block text-zinc-600 mb-1">Length</label>
                <input type="number" name="length" value={formData.length} onChange={(e) => setFormData(prev => ({ ...prev, length: Number(e.target.value) }))} className="w-full px-2 py-1.5 border border-zinc-200 rounded-md" />
              </div>
              <div>
                <label className="block text-zinc-600 mb-1">Width</label>
                <input type="number" name="width" value={formData.width} onChange={(e) => setFormData(prev => ({ ...prev, width: Number(e.target.value) }))} className="w-full px-2 py-1.5 border border-zinc-200 rounded-md" />
              </div>
              <div>
                <label className="block text-zinc-600 mb-1">Height</label>
                <input type="number" name="height" value={formData.height} onChange={(e) => setFormData(prev => ({ ...prev, height: Number(e.target.value) }))} className="w-full px-2 py-1.5 border border-zinc-200 rounded-md" />
              </div>
            </div>
          </div>

          {/* Dynamic Images Block */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Product Images</h4>
              <button type="button" onClick={() => addNestedObjectItem('images', { image_url: '', alt_text: '', is_featured: false })} className="text-zinc-600 hover:text-black flex items-center gap-1 font-semibold text-[10px]"><Plus size={12}/>Add Image</button>
            </div>
            {formData.images?.map((img, index) => (
              <div key={index} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2 relative">
                <input type="text" placeholder="Image URL String" value={img.image_url} onChange={(e) => handleNestedObjectChange(index, 'images', 'image_url', e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white font-mono" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Alt Text" value={img.alt_text} onChange={(e) => handleNestedObjectChange(index, 'images', 'alt_text', e.target.value)} className="px-3 py-1 bg-white border border-zinc-200 rounded-md" />
                  <label className="flex items-center gap-2 font-medium text-zinc-600 select-none cursor-pointer">
                    <input type="checkbox" checked={img.is_featured} onChange={(e) => handleNestedObjectChange(index, 'images', 'is_featured', e.target.checked)} className="rounded text-zinc-950 focus:ring-0" /> Feature Image
                  </label>
                </div>
                <button type="button" onClick={() => removeNestedObjectItem(index, 'images')} className="absolute top-2 right-2 text-red-500 p-1 hover:bg-red-50 rounded"><Trash size={13}/></button>
              </div>
            ))}
          </div>

          {/* Dynamic Variants Setup */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Product Variants</h4>
              <button type="button" onClick={() => addNestedObjectItem('variants', { sku: '', price: 0, sale_price: 0, stock_quantity: 0, is_active: true })} className="text-zinc-600 hover:text-black flex items-center gap-1 font-semibold text-[10px]"><Plus size={12}/>Add Variant</button>
            </div>
            {formData.variants.map((v, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-center bg-zinc-50 p-2 rounded-lg border border-zinc-200 relative pr-8">
                <input type="text" placeholder="SKU" value={v.sku} onChange={(e) => handleNestedObjectChange(index, 'variants', 'sku', e.target.value)} className="w-full px-2 py-1 border border-zinc-200 rounded bg-white font-mono" />
                <input type="number" placeholder="Price" value={v.price} onChange={(e) => handleNestedObjectChange(index, 'variants', 'price', Number(e.target.value))} className="w-full px-2 py-1 border border-zinc-200 rounded bg-white" />
                <input type="number" placeholder="Sale" value={v.sale_price} onChange={(e) => handleNestedObjectChange(index, 'variants', 'sale_price', Number(e.target.value))} className="w-full px-2 py-1 border border-zinc-200 rounded bg-white" />
                <input type="number" placeholder="Stock" value={v.stock_quantity} onChange={(e) => handleNestedObjectChange(index, 'variants', 'stock_quantity', Number(e.target.value))} className="w-full px-2 py-1 border border-zinc-200 rounded bg-white" />
                <label className="flex items-center justify-center gap-1">
                  <input type="checkbox" checked={v.is_active} onChange={(e) => handleNestedObjectChange(index, 'variants', 'is_active', e.target.checked)} className="rounded text-zinc-950 focus:ring-0" /> Active
                </label>
                <button type="button" onClick={() => removeNestedObjectItem(index, 'variants')} className="absolute right-1 text-red-500 p-1 hover:bg-red-50 rounded"><Trash size={13}/></button>
              </div>
            ))}
          </div>

          {/* Wine Attributes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Wine Attributes</h4>
              <button type="button" onClick={() => addNestedObjectItem('wine_attributes', { attribute_type: '', value: '' })} className="text-zinc-600 hover:text-black flex items-center gap-1 font-semibold text-[10px]"><Plus size={12}/>Add Attribute</button>
            </div>
            {formData.wine_attributes?.map((attr, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input type="text" placeholder="Type (e.g., Year, Tannin)" value={attr.attribute_type} onChange={(e) => handleNestedObjectChange(index, 'wine_attributes', 'attribute_type', e.target.value)} className="w-1/2 px-3 py-1.5 border border-zinc-200 rounded-md" />
                <input type="text" placeholder="Value (e.g., 2021, Medium)" value={attr.value} onChange={(e) => handleNestedObjectChange(index, 'wine_attributes', 'value', e.target.value)} className="w-1/2 px-3 py-1.5 border border-zinc-200 rounded-md" />
                <button type="button" onClick={() => removeNestedObjectItem(index, 'wine_attributes')} className="text-red-500 p-1.5 hover:bg-red-50 rounded-md"><Trash size={14}/></button>
              </div>
            ))}
          </div>

          {/* Pairings */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Dish Pairings</h4>
              <button type="button" onClick={() => addNestedObjectItem('pairings', { dish_id: '', reason: '' })} className="text-zinc-600 hover:text-black flex items-center gap-1 font-semibold text-[10px]"><Plus size={12}/>Add Pairing</button>
            </div>
            {formData.pairings?.map((pair, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input type="text" placeholder="Dish ID Key" value={pair.dish_id} onChange={(e) => handleNestedObjectChange(index, 'pairings', 'dish_id', e.target.value)} className="w-1/3 px-3 py-1.5 border border-zinc-200 rounded-md font-mono" />
                <input type="text" placeholder="Reasoning explanation" value={pair.reason} onChange={(e) => handleNestedObjectChange(index, 'pairings', 'reason', e.target.value)} className="w-2/3 px-3 py-1.5 border border-zinc-200 rounded-md" />
                <button type="button" onClick={() => removeNestedObjectItem(index, 'pairings')} className="text-red-500 p-1.5 hover:bg-red-50 rounded-md"><Trash size={14}/></button>
              </div>
            ))}
          </div>

          {/* Region IDs List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Region IDs</h4>
              <button type="button" onClick={() => addStringArrayItem('region_ids')} className="text-zinc-600 hover:text-black flex items-center gap-1 font-semibold text-[10px]"><Plus size={12}/>Add Region</button>
            </div>
            {formData.region_ids?.map((id, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input type="text" placeholder="Region ID String" value={id} onChange={(e) => handleStringArrayChange(index, e.target.value, 'region_ids')} className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono" />
                <button type="button" onClick={() => removeStringArrayItem(index, 'region_ids')} className="text-red-500 p-1.5 hover:bg-red-50 rounded-md"><Trash size={14}/></button>
              </div>
            ))}
          </div>

          {/* Blog IDs List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Blog IDs</h4>
              <button type="button" onClick={() => addStringArrayItem('blog_ids')} className="text-zinc-600 hover:text-black flex items-center gap-1 font-semibold text-[10px]"><Plus size={12}/>Add Blog Ref</button>
            </div>
            {formData.blog_ids?.map((id, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input type="text" placeholder="Blog ID String" value={id} onChange={(e) => handleStringArrayChange(index, e.target.value, 'blog_ids')} className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono" />
                <button type="button" onClick={() => removeStringArrayItem(index, 'blog_ids')} className="text-red-500 p-1.5 hover:bg-red-50 rounded-md"><Trash size={14}/></button>
              </div>
            ))}
          </div>

          {/* Flags & Switches */}
          <div className="flex gap-6 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
            <label className="flex items-center gap-2 font-medium text-zinc-700 cursor-pointer select-none">
              <input type="checkbox" name="is_published" checked={formData.is_published} onChange={handleChange} className="rounded text-zinc-950 focus:ring-0" /> Is Published
            </label>
            <label className="flex items-center gap-2 font-medium text-zinc-700 cursor-pointer select-none">
              <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="rounded text-zinc-950 focus:ring-0" /> Is Featured
            </label>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Short Description</label>
            <input type="text" name="short_description" value={formData.short_description} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Full Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none focus:outline-none" />
          </div>

        </form>

        {/* Action Elements Panel Footer */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg font-semibold hover:bg-zinc-50">Cancel</button>
          <button type="submit" disabled={mutationLoading} onClick={handleSubmit} className="flex items-center justify-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg font-semibold hover:bg-zinc-800 disabled:opacity-50">
            {mutationLoading && <Loader2 size={12} className="animate-spin" />}
            {editingProduct ? 'Update Product' : 'Save Product'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ProductFormDrawer;