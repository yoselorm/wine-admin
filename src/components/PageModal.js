import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save, LayoutTemplate, Globe, FileText, Settings } from 'lucide-react';

import { createPage, updatePage } from '../redux/PagesSlice';

const PageModal = ({ isOpen, onClose, pageData = null }) => {
  const dispatch = useDispatch();
  const isEditing = Boolean(pageData);

  const { actionLoading } = useSelector((state) => state.adminPages);

  const [formData, setFormData] = useState({
    title: '', slug: '', content: '', is_published: false,
    meta_title: '', meta_keywords: '', meta_description: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && pageData) {
        setFormData({
          title: pageData.title || '', slug: pageData.slug || '', content: pageData.content || '',
          is_published: Boolean(pageData.is_published), meta_title: pageData.meta_title || '',
          meta_keywords: pageData.meta_keywords || '', meta_description: pageData.meta_description || ''
        });
      } else {
        setFormData({
          title: '', slug: '', content: '', is_published: false, 
          meta_title: '', meta_keywords: '', meta_description: ''
        });
      }
    }
  }, [isOpen, pageData, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const generateSlug = () => {
    if (!formData.title) return;
    const autoSlug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug: autoSlug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updatePage({ pageIdentifier: pageData.id, pageData: formData })).unwrap();
      } else {
        await dispatch(createPage(formData)).unwrap();
      }
      onClose();
    } catch (err) {
      console.error("Form submission failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    // Increased z-index to ensure it sits over the sidebar
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        
        {/* --- HEADER (shrink-0 prevents it from squishing) --- */}
        <div className="shrink-0 flex items-center justify-between p-5 border-b border-zinc-100 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <LayoutTemplate size={18} className="text-zinc-500" /> 
              {isEditing ? 'Edit Page' : 'Create New Page'}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-1">
              {isEditing ? 'Update static page content and SEO.' : 'Draft a new static page.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* --- BODY (flex-1 lets it fill space, min-h-0 enables inner scrolling) --- */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto bg-zinc-50/50">
          
          {/* Added pb-4 here to give extra breathing room at the very bottom of the scrollable area */}
          <form id="page-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
            
            {/* Core Content */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-sm space-y-5">
              <h3 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-zinc-500">
                <FileText size={12} /> Core Content
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Page Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g., About Us"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-400" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    {!isEditing && (
                      <button type="button" onClick={generateSlug} className="text-[10px] text-blue-500 hover:underline font-medium">
                        Auto-generate
                      </button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="bg-zinc-100 border border-zinc-200 border-r-0 rounded-l-lg px-3 flex items-center text-zinc-400 font-mono text-sm">/</span>
                    <input 
                      type="text" 
                      name="slug" 
                      required 
                      value={formData.slug} 
                      onChange={handleChange} 
                      placeholder="about-us"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-r-lg font-mono text-sm focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-400" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Body Content
                </label>
                <textarea 
                  name="content" 
                  rows="8" 
                  value={formData.content} 
                  onChange={handleChange} 
                  placeholder="Enter HTML or plain text content..."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all resize-y placeholder:text-zinc-400" 
                />
              </div>
            </div>

            {/* Bottom Grid: Visibility & SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Visibility */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-sm space-y-4">
                <h3 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-zinc-500">
                  <Settings size={12} /> Visibility
                </h3>
                
                <label className="flex items-start gap-3 p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                  <div className="relative flex items-center pt-0.5">
                    <input 
                      type="checkbox" 
                      name="is_published" 
                      checked={formData.is_published} 
                      onChange={handleChange} 
                      className="peer sr-only" 
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                  </div>
                  <div>
                    <span className="block font-bold text-zinc-900 text-[11px] uppercase tracking-wider mb-0.5">
                      {formData.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[10px] text-zinc-500 leading-tight block">
                      {formData.is_published ? 'Page is live to the public.' : 'Page is hidden from visitors.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* SEO Data */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-sm space-y-4">
                <h3 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-zinc-500">
                  <Globe size={12} /> SEO Metadata
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Meta Title</label>
                    <input type="text" name="meta_title" value={formData.meta_title} onChange={handleChange} className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Meta Keywords</label>
                    <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleChange} placeholder="Comma separated..." className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Meta Description</label>
                    <textarea name="meta_description" rows="2" value={formData.meta_description} onChange={handleChange} className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs resize-none outline-none focus:ring-1 focus:ring-zinc-900" />
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* --- FOOTER (shrink-0 ensures it stays anchored at the bottom) --- */}
        <div className="shrink-0 p-5 border-t border-zinc-100 flex items-center justify-end gap-4 bg-white z-10">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="page-form" 
            disabled={actionLoading} 
            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 disabled:opacity-70 transition-all shadow-sm"
          >
            {actionLoading ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {actionLoading ? 'Saving...' : 'Save Page'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default PageModal;