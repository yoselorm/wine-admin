import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, Save, LayoutTemplate, Globe, 
  Settings, Type, FileText, CheckCircle 
} from 'lucide-react';

// Adjust path to match your slice location
import { 
  fetchPageDetails, 
  createPage, 
  updatePage, 
  clearCurrentPageDetails,
  clearPagesStatus 
} from '../redux/PagesSlice';

const PageForm = () => {
  const { id } = useParams(); // If present, we are in Edit mode
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isEditing = Boolean(id);

  // Redux State
  const { 
    currentPageDetails, 
    detailsLoading, 
    mutationLoading, 
    error 
  } = useSelector((state) => state.pages);

  // Local Form State mapped to your JSON structure
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    is_published: false,
    meta_title: '',
    meta_keywords: '',
    meta_description: ''
  });

  // 1. Fetch data if in Edit Mode
  useEffect(() => {
    if (isEditing) {
      dispatch(fetchPageDetails(id));
    }
    
    // Cleanup when leaving form
    return () => {
      dispatch(clearCurrentPageDetails());
      dispatch(clearPagesStatus());
    };
  }, [dispatch, id, isEditing]);

  // 2. Populate form when data arrives
  useEffect(() => {
    if (isEditing && currentPageDetails) {
      setFormData({
        title: currentPageDetails.title || '',
        slug: currentPageDetails.slug || '',
        content: currentPageDetails.content || '',
        is_published: Boolean(currentPageDetails.is_published),
        meta_title: currentPageDetails.meta_title || '',
        meta_keywords: currentPageDetails.meta_keywords || '',
        meta_description: currentPageDetails.meta_description || ''
      });
    }
  }, [isEditing, currentPageDetails]);

  // Handle standard input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // .unwrap() allows us to catch the error locally or proceed on success
        await dispatch(updatePage({ pageKey: id, data: formData })).unwrap();
      } else {
        await dispatch(createPage(formData)).unwrap();
      }
      // On success, redirect back to the table
      navigate('/admin/pages');
    } catch (err) {
      // Errors are handled by the Redux slice and displayed in the UI via the `error` state
      console.error("Submission failed:", err);
    }
  };

  // Auto-generate slug from title (only if not editing, or if user wants to)
  const generateSlug = () => {
    if (!formData.title) return;
    const autoSlug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug: autoSlug }));
  };

  if (detailsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 text-xs text-zinc-700">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Sticky Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-lg transition-colors border border-zinc-200/50"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <LayoutTemplate size={16} />
                {isEditing ? `Edit Page: ${currentPageDetails?.title || ''}` : 'Create New Page'}
              </h1>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isEditing ? 'Modify existing static page content and SEO routing.' : 'Draft a new static page for your application.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error && <span className="text-red-500 font-medium text-[11px]">{error}</span>}
            <button 
              type="button" 
              onClick={() => navigate('/admin/pages')}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutationLoading}
              className="flex items-center gap-2 px-6 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-70 transition-all shadow-xs"
            >
              {mutationLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {mutationLoading ? 'Saving...' : 'Save Page'}
            </button>
          </div>
        </div>

        {/* Form Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Content Blocks */}
          <div className="md:col-span-8 space-y-6">
            
            <div className="bg-white p-6 rounded-xl border border-zinc-200/60 shadow-xs space-y-5">
              <h3 className="font-bold text-zinc-900 border-b pb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-zinc-400">
                <Type size={12} /> Core Content
              </h3>

              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Page Title <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., About Us"
                  className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg p-3 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Slug Field */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label htmlFor="slug" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    URL Route Slug <span className="text-red-400">*</span>
                  </label>
                  {!isEditing && (
                    <button 
                      type="button" 
                      onClick={generateSlug}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold"
                    >
                      Auto-generate from title
                    </button>
                  )}
                </div>
                <div className="flex">
                  <span className="bg-zinc-100 border border-zinc-200/60 border-r-0 rounded-l-lg px-3 flex items-center text-zinc-400 font-mono text-[11px]">
                    /
                  </span>
                  <input 
                    type="text" 
                    id="slug"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="about-us"
                    className="w-full bg-zinc-50 border border-zinc-200/60 rounded-r-lg p-2.5 font-mono text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Content Editor area */}
              <div>
                <label htmlFor="content" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
                   <FileText size={11} /> Body Content
                </label>
                <textarea 
                  id="content"
                  name="content"
                  rows="15"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Enter the main HTML or text content for this page..."
                  className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg p-3 text-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none leading-relaxed"
                ></textarea>
                <p className="text-[10px] text-zinc-400 mt-1.5">Standard text and structural layout support.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings & SEO */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Publishing Status Card */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                <Settings size={13} className="text-zinc-400" />
                Visibility Settings
              </h3>
              
              <label className="flex items-start gap-3 p-3 border border-zinc-200/60 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                <div className="relative flex items-center pt-0.5">
                  <input 
                    type="checkbox" 
                    name="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="peer sr-only"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <div>
                  <span className="block font-bold text-zinc-900 text-[11px] uppercase tracking-wider mb-0.5">
                    {formData.is_published ? 'Published Live' : 'Draft Mode'}
                  </span>
                  <span className="text-[10px] text-zinc-500 leading-tight block">
                    {formData.is_published 
                      ? 'This page is visible to all public visitors.' 
                      : 'This page is hidden and only visible to administrators.'}
                  </span>
                </div>
              </label>
            </div>

            {/* SEO Metadata Card */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                <Globe size={13} className="text-zinc-400" />
                SEO Search Engine
              </h3>

              <div>
                <label htmlFor="meta_title" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Meta Title
                </label>
                <input 
                  type="text" 
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  placeholder="Leave blank to use Page Title"
                  className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg p-2 text-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none"
                />
              </div>

              <div>
                <label htmlFor="meta_keywords" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Meta Keywords
                </label>
                <input 
                  type="text" 
                  id="meta_keywords"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  placeholder="e.g. about, company, history"
                  className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg p-2 text-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none"
                />
                <p className="text-[9px] text-zinc-400 mt-1">Separate tags with commas.</p>
              </div>

              <div>
                <label htmlFor="meta_description" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Meta Description
                </label>
                <textarea 
                  id="meta_description"
                  name="meta_description"
                  rows="4"
                  value={formData.meta_description}
                  onChange={handleChange}
                  placeholder="A short summary for search engine results..."
                  className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg p-2 text-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all outline-none resize-none leading-relaxed"
                ></textarea>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default PageForm;