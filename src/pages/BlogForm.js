import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, UploadCloud } from 'lucide-react';
import { fetchBlogs, createBlog, updateBlog, deleteBlog, clearBlogStatus } from '../redux/BlogSlice';
import { fetchBlogCategories } from '../redux/BlogCategorySlice';
import { fetchProducts } from '../redux/ProductSlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Switch from '../components/ui/Switch';
import Pill from '../components/ui/Pill';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import RichTextEditor from '../components/RichTextEditor';
import toast from '../components/Toast';

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', featured_image: '', video_url: '',
  tags: '', type: 'article', is_featured: false, is_published: true, published_at: '',
  meta_title: '', meta_description: '', meta_keywords: '', category_id: '', author_id: '',
  product_ids: [],
};

const BlogForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { posts, mutationLoading, error, message } = useSelector((state) => state.blogs);
  const { categories } = useSelector((state) => state.blogCategories);
  const { items: products } = useSelector((state) => state.products || { items: [] });
  const { admin } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ ...emptyForm, published_at: new Date().toISOString().slice(0, 10) });
  const [productSearch, setProductSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogs());
    dispatch(fetchBlogCategories());
    dispatch(fetchProducts({ per_page: 200 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditing && posts?.length) {
      const post = posts.find((p) => String(p.id) === String(id));
      if (post) {
        setFormData({
          title: post.title || '', slug: post.slug || '', excerpt: post.excerpt || '', content: post.content || '',
          featured_image: post.featured_image || '', video_url: post.video_url || '', tags: post.tags || '',
          type: post.type || 'article', is_featured: post.is_featured ?? false, is_published: post.is_published ?? true,
          published_at: post.published_at ? post.published_at.slice(0, 10) : '',
          meta_title: post.meta_title || '', meta_description: post.meta_description || '',
          meta_keywords: post.meta_keywords || '', category_id: post.category_id || '',
          author_id: post.author_id || admin?.id || '',
          product_ids: post.product_ids || post.products?.map((p) => p.id) || [],
        });
      }
    } else if (!isEditing) {
      setFormData((f) => ({ ...f, author_id: f.author_id || admin?.id || '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, posts]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearBlogStatus()); }
    if (message) {
      toast.success(message);
      dispatch(clearBlogStatus());
      navigate('/dashboard/blogs');
    }
  }, [error, message, dispatch, navigate]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const toggleProduct = (id) => {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(id) ? prev.product_ids.filter((x) => x !== id) : [...prev.product_ids, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      dispatch(updateBlog({ id, blogData: formData }));
    } else {
      dispatch(createBlog(formData));
    }
  };

  const handleDelete = async () => {
    await dispatch(deleteBlog(id));
    setDeleteModalOpen(false);
    navigate('/dashboard/blogs');
  };

  const filteredProducts = products?.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())) || [];

  return (
    <div>
      <button onClick={() => navigate('/dashboard/blogs')} className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 mb-3">
        <ArrowLeft size={14} /> Back to Blogs
      </button>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit Post' : 'New Post'}</h1>
        <div className="flex items-center gap-3">
          {isEditing && (
            <Button type="button" appearance="danger-outline" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
          )}
          <Button type="button" appearance="secondary" onClick={() => navigate('/dashboard/blogs')}>Cancel</Button>
          <Button type="submit" form="blog-form" disabled={mutationLoading}>
            {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />} Save Post
          </Button>
        </div>
      </div>

      <form id="blog-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-10">
        {/* MAIN COLUMN */}
        <div className="space-y-6">
          <Card title="Post">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={handleTitleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Slug <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  <p className="text-xs text-gray-400 mt-1">Auto-generated from title · must be unique</p>
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Tags</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleInputChange}
                  placeholder="pairing, jollof, red wine" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated, e.g. pairing, jollof</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Excerpt</label>
                <textarea rows="2" name="excerpt" value={formData.excerpt} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Content</label>
                <RichTextEditor value={formData.content} onChange={(html) => setFormData((p) => ({ ...p, content: html }))}
                  placeholder="The full post..." minHeight={280} />
              </div>
            </div>
          </Card>

          <Card title="Linked Products">
            <p className="text-xs text-gray-400 mb-3">Shown as &quot;featured in&quot; on the product page and shoppable from the post.</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredProducts.map((p) => (
                <Pill key={p.id} active={formData.product_ids.includes(p.id)} onClick={() => toggleProduct(p.id)}>
                  {p.name}
                </Pill>
              ))}
            </div>
          </Card>

          <Card title="SEO">
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Meta Title</label>
                <input type="text" name="meta_title" value={formData.meta_title} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Meta Description</label>
                <textarea rows="2" name="meta_description" value={formData.meta_description} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Meta Keywords</label>
                <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Category</label>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
                  <option value="">Unassigned</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white capitalize focus:outline-none focus:border-violet-500">
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="guide">Guide</option>
                  <option value="news">News</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Publish Date</label>
                <input type="date" name="published_at" value={formData.published_at} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <p className="text-xs text-gray-400 mt-1">YYYY-MM-DD · empty = now on publish</p>
              </div>
              <Switch checked={formData.is_published} onChange={(val) => setFormData((f) => ({ ...f, is_published: val }))} label="Published" italic />
              <Switch checked={formData.is_featured} onChange={(val) => setFormData((f) => ({ ...f, is_featured: val }))} label="Featured" italic />
            </div>
          </Card>

          <Card title="Media">
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Featured Image</label>
                <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-md py-6 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-colors">
                  <UploadCloud size={18} className="text-gray-400" />
                  <span className="text-sm font-semibold text-violet-600">Upload</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WebP · max 5 MB</span>
                  <input type="file" name="featured_image" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Video URL</label>
                <input type="url" name="video_url" value={typeof formData.video_url === 'string' ? formData.video_url : ''} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md font-mono text-xs focus:outline-none focus:border-violet-500" />
                <p className="text-xs text-gray-400 mt-1">For video posts · must be a valid URL</p>
              </div>
            </div>
          </Card>
        </div>
      </form>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        isDeleting={mutationLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${formData.title}"?`}
      />
    </div>
  );
};

export default BlogForm;
