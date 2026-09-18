import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchBlogCategories, createBlogCategory, updateBlogCategory, clearCategoryStatus } from '../redux/BlogCategorySlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RichTextEditor from '../components/RichTextEditor';
import toast from '../components/Toast';

const emptyForm = {
  name: '', slug: '', description: '', image_url: '', parent_id: '',
  meta_title: '', meta_description: '', meta_keywords: '', is_published: true, position: 1,
};

const BlogCategoryForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, mutationLoading, error, message } = useSelector((state) => state.blogCategories);

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchBlogCategories());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditing && categories?.length) {
      const category = categories.find((c) => String(c.id) === String(id));
      if (category) {
        setFormData({
          name: category.name || '', slug: category.slug || '', description: category.description || '',
          image_url: category.image_url || '', parent_id: category.parent_id || '',
          meta_title: category.meta_title || '', meta_description: category.meta_description || '',
          meta_keywords: category.meta_keywords || '', is_published: category.is_published ?? true,
          position: category.position || 1,
        });
      }
    }
  }, [id, isEditing, categories]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearCategoryStatus()); }
    if (message) {
      toast.success(message);
      dispatch(clearCategoryStatus());
      navigate('/dashboard/blog-categories');
    }
  }, [error, message, dispatch, navigate]);

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug: nameVal.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      dispatch(updateBlogCategory({ id, categoryData: formData }));
    } else {
      dispatch(createBlogCategory(formData));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/blog-categories')}
          className="p-2 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit Blog Category' : 'Add Blog Category'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure editorial partitions and SEO metadata.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Core Details">
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
              <input type="text" required value={formData.name} onChange={handleNameChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-400 mb-1">URL Slug (Auto-generated)</label>
              <input type="text" readOnly value={formData.slug}
                className="w-full px-3 py-2 border border-gray-100 bg-gray-50 font-mono text-xs text-gray-500 rounded-md" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Description</label>
              <RichTextEditor value={formData.description} onChange={(html) => setFormData((p) => ({ ...p, description: html }))} />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Image URL</label>
              <input type="url" name="image_url" value={formData.image_url} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 font-mono text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Parent Category</label>
                <select name="parent_id" value={formData.parent_id} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 text-gray-800">
                  <option value="">None (top-level)</option>
                  {categories.filter((cat) => !isEditing || String(cat.id) !== String(id)).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sort Position</label>
                <input type="number" name="position" min="1" value={formData.position} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 font-mono" />
              </div>
            </div>
            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input type="checkbox" id="is_published" name="is_published" checked={formData.is_published} onChange={handleInputChange}
                className="accent-violet-600 w-4 h-4 rounded border-gray-300" />
              <span className="font-semibold text-gray-700 select-none">Publish immediately</span>
            </label>
          </div>
        </Card>

        <Card title="SEO">
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meta Title</label>
              <input type="text" name="meta_title" value={formData.meta_title} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meta Description</label>
              <textarea name="meta_description" rows="2" value={formData.meta_description} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 resize-none" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meta Keywords</label>
              <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleInputChange}
                placeholder="keyword1, keyword2" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" appearance="secondary" onClick={() => navigate('/dashboard/blog-categories')}>Cancel</Button>
          <Button type="submit" disabled={mutationLoading}>
            {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
            {isEditing ? 'Update Category' : 'Save Category'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BlogCategoryForm;
