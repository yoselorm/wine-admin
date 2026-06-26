import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { fetchBlogs, createBlog, updateBlog, deleteBlog, clearBlogStatus } from '../redux/BlogSlice';
import { fetchBlogCategories } from '../redux/BlogCategorySlice';
import { FileText, Plus, Search, Edit2, Trash2, X, Loader2, Link, Upload } from 'lucide-react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import toast from '../components/Toast';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Blogs = () => {
  const dispatch = useDispatch();
  const { posts, loading, mutationLoading, error, message } = useSelector((state) => state.blogs);
  const { categories } = useSelector((state) => state.blogCategories);

  // Search & Modals state handles
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Field source toggle state selectors ('url' vs 'upload')
  const [imageSource, setImageSource] = useState('url');
  const [videoSource, setVideoSource] = useState('url');

  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', featured_image: '',
    video_url: '', tags: '', type: 'article', is_featured: false,
    is_published: true, published_at: '', meta_title: '',
    meta_description: '', meta_keywords: '', category_id: ''
  });

  useEffect(() => {
    dispatch(fetchBlogs());
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearBlogStatus()); }
    if (message) { toast.success(message); dispatch(clearBlogStatus()); closeDrawer(); }
  }, [error, message, dispatch]);

  const debouncedFetch = useCallback(
    debounce((str) => dispatch(fetchBlogs({ search: str })), 400),
    [dispatch]
  );

  const handleSearchChange = (e) => {
    setSearchInputValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const openCreateDrawer = () => {
    setEditingPost(null);
    setImageSource('url');
    setVideoSource('url');
    setFormData({
      title: '', slug: '', excerpt: '', content: '', featured_image: '',
      video_url: '', tags: '', type: 'article', is_featured: false,
      is_published: true, published_at: new Date().toISOString().slice(0, 16),
      meta_title: '', meta_description: '', meta_keywords: '', category_id: ''
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (post) => {
    setEditingPost(post);
    setImageSource(typeof post.featured_image === 'string' && post.featured_image ? 'url' : 'upload');
    setVideoSource(typeof post.video_url === 'string' && post.video_url ? 'url' : 'upload');
    setFormData({
      title: post.title || '', slug: post.slug || '', excerpt: post.excerpt || '',
      content: post.content || '', featured_image: post.featured_image || '',
      video_url: post.video_url || '', tags: post.tags || '', type: post.type || 'article',
      is_featured: post.is_featured ?? false, is_published: post.is_published ?? true,
      published_at: post.published_at ? post.published_at.slice(0, 16) : '',
      meta_title: post.meta_title || '', meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || '', category_id: post.category_id || ''
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => { setIsDrawerOpen(false); setEditingPost(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPost) {
      dispatch(updateBlog({ id: editingPost.id, blogData: formData }));
    } else {
      dispatch(createBlog(formData));
    }
  };

  const handleDeleteTrigger = (post) => {
    setItemToDelete(post);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteBlog(itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Editorial Registry</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Draft stories, manage analytical parameters, and link asset attachments.</p>
        </div>
        <button onClick={openCreateDrawer} className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm">
          <Plus size={14} /> Write Post
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-3">
        <Search size={16} className="text-zinc-400" />
        <input type="text" placeholder="Search blog titles or paths..." value={searchInputValue} onChange={handleSearchChange} className="w-full text-xs bg-transparent border-none text-zinc-800 focus:outline-none" />
        {loading && <Loader2 className="animate-spin text-zinc-400" size={14} />}
      </div>

      {/* CORE DATA TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#c4945c]" size={24} />
            <span className="text-xs text-zinc-400 font-medium">Syncing stories...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3"><FileText size={20} /></div>
            <h3 className="text-xs font-bold text-zinc-700">No entries written</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="py-3 px-5">Headline / Slug</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Visibility Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-zinc-900 flex items-center gap-2">
                        {post.title}
                        {post.is_featured && <span className="bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[9px] tracking-wide px-1.5 py-0.2 rounded">Featured</span>}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{post.slug}</div>
                    </td>
                    <td className="py-4 px-5 capitalize font-mono text-zinc-500">{post.type}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${post.is_published ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
                        {post.is_published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button onClick={() => openEditDrawer(post)} className="inline-flex p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900"><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteTrigger(post)} className="inline-flex p-1.5 rounded-md border border-red-100 bg-white text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PORTAL ARTICLE DRAWER PANEL */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-lg h-screen bg-white shadow-2xl flex flex-col justify-between z-50 animate-slide-in">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-serif font-bold text-zinc-900 text-sm">{editingPost ? 'Edit Story Specs' : 'Draft Core Content'}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Inject metrics, binary attachments, and metadata scopes.</p>
              </div>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs pb-28 custom-scrollbar">
              <div className="space-y-3 border-b border-zinc-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4945c]">Story Parameters</span>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Headline Title *</label>
                  <input type="text" required value={formData.title} onChange={handleTitleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Assigned Category</label>
                    <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white">
                      <option value="">Unassigned</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white capitalize">
                      <option value="article">article</option>
                      <option value="video">video</option>
                      <option value="gallery">gallery</option>
                    </select>
                  </div>
                </div>

                {/* FEATURED IMAGE DOUBLE-INPUT ROUTINE */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-700">Featured Display Image</label>
                    <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                      <button type="button" onClick={() => setImageSource('url')} className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${imageSource === 'url' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}><Link size={10}/>URL</button>
                      <button type="button" onClick={() => setImageSource('upload')} className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${imageSource === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}><Upload size={10}/>Upload</button>
                    </div>
                  </div>
                  {imageSource === 'url' ? (
                    <input type="url" name="featured_image" value={typeof formData.featured_image === 'string' ? formData.featured_image : ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-[11px]" placeholder="https://example.com/image.png" />
                  ) : (
                    <input type="file" name="featured_image" accept="image/*" onChange={handleFileChange} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-zinc-100 file:text-zinc-700 cursor-pointer" />
                  )}
                </div>

                {/* FEATURED VIDEO DOUBLE-INPUT ROUTINE */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-700">Embedded Video Content</label>
                    <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                      <button type="button" onClick={() => setVideoSource('url')} className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${videoSource === 'url' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}><Link size={10}/>URL</button>
                      <button type="button" onClick={() => setVideoSource('upload')} className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${videoSource === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}><Upload size={10}/>Upload</button>
                    </div>
                  </div>
                  {videoSource === 'url' ? (
                    <input type="url" name="video_url" value={typeof formData.video_url === 'string' ? formData.video_url : ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-[11px]" placeholder="https://example.com/video.mp4" />
                  ) : (
                    <input type="file" name="video_url" accept="video/*" onChange={handleFileChange} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-zinc-100 file:text-zinc-700 cursor-pointer" />
                  )}
                </div>

                <div><label className="block font-semibold text-zinc-700 mb-1">Short Excerpt Summary</label><textarea name="excerpt" rows="2" value={formData.excerpt} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none" /></div>
                <div><label className="block font-semibold text-zinc-700 mb-1">Full Article Canvas Payload *</label><textarea name="content" required rows="5" value={formData.content} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block font-semibold text-zinc-700 mb-1">Tags</label><input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" placeholder="wine, harvest" /></div>
                  <div><label className="block font-semibold text-zinc-700 mb-1">Publication Timestamp Calendar</label><input type="datetime-local" name="published_at" value={formData.published_at} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-zinc-800" /></div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 font-semibold text-zinc-700"><input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="accent-zinc-900 w-4 h-4" /> Feature Post</label>
                  <label className="flex items-center gap-2 font-semibold text-zinc-700"><input type="checkbox" name="is_published" checked={formData.is_published} onChange={handleInputChange} className="accent-zinc-900 w-4 h-4" /> Go Live Immediately</label>
                </div>
              </div>

              {/* SEO SUB-MODULE */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4945c]">SERP SEO Architecture Tuning</span>
                <div><label className="block font-semibold text-zinc-700 mb-1">Meta Customize Title</label><input type="text" name="meta_title" value={formData.meta_title} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" /></div>
                <div><label className="block font-semibold text-zinc-700 mb-1">Meta Data Description String</label><textarea name="meta_description" rows="2" value={formData.meta_description} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none" /></div>
                <div><label className="block font-semibold text-zinc-700 mb-1">Target Keyword Bundles</label><input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg" placeholder="keyword1, keyword2" /></div>
              </div>
            </form>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg font-semibold">Cancel</button>
              <button type="submit" disabled={mutationLoading} onClick={handleSubmit} className="flex items-center justify-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg font-semibold disabled:opacity-50">
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                {editingPost ? 'Update Story Data' : 'Publish Story Node'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DETACHED GLOBAL DELETE MODAL INSTANTIATION */}
      <ConfirmDeleteModal isOpen={deleteModalOpen} isDeleting={mutationLoading} onClose={() => setDeleteModalOpen(false)} onConfirm={executeDelete} title="Delete Blog Post" message={`Are you entirely sure you want to delete "${itemToDelete?.title}"? This will drop all structural metrics recorded for this story node across the public cache indexes.`} />
    </div>
  );
};

export default Blogs;