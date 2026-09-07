import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchPages, createPage, updatePage, clearErrors } from '../redux/PagesSlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from '../components/Toast';

const emptyForm = { title: '', slug: '', content: '', is_published: false, meta_title: '', meta_keywords: '', meta_description: '' };

const SitePageForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: pages, actionLoading, error, successMessage } = useSelector((state) => state.adminPages);

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchPages());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditing && pages?.length) {
      const page = pages.find((p) => String(p.id) === String(id));
      if (page) {
        setFormData({
          title: page.title || '', slug: page.slug || '', content: page.content || '',
          is_published: Boolean(page.is_published), meta_title: page.meta_title || '',
          meta_keywords: page.meta_keywords || '', meta_description: page.meta_description || '',
        });
      }
    }
  }, [id, isEditing, pages]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearErrors()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearErrors());
      navigate('/dashboard/pages');
    }
  }, [error, successMessage, dispatch, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const generateSlug = () => {
    if (!formData.title) return;
    const autoSlug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData((prev) => ({ ...prev, slug: autoSlug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updatePage({ pageIdentifier: id, pageData: formData })).unwrap();
      } else {
        await dispatch(createPage(formData)).unwrap();
      }
    } catch (err) {
      console.error('Form submission failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/pages')}
          className="p-2 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit Page' : 'Create Page'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage static page content and SEO.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Core Content">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Page Title *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                  placeholder="e.g., About Us" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="font-semibold text-gray-700">URL Slug *</label>
                  {!isEditing && (
                    <button type="button" onClick={generateSlug} className="text-xs text-violet-600 hover:underline font-medium">
                      Auto-generate
                    </button>
                  )}
                </div>
                <div className="flex">
                  <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-md px-3 flex items-center text-gray-400 font-mono text-sm">/</span>
                  <input type="text" name="slug" required value={formData.slug} onChange={handleChange}
                    placeholder="about-us" className="w-full px-3 py-2 border border-gray-200 rounded-r-md font-mono text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Body Content</label>
              <textarea name="content" rows="8" value={formData.content} onChange={handleChange}
                placeholder="Enter HTML or plain text content..." className="w-full px-3 py-2 border border-gray-200 rounded-md resize-y focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Visibility">
            <label className="flex items-start gap-3 p-3 border border-gray-100 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="checkbox" name="is_published" checked={formData.is_published} onChange={handleChange} className="mt-0.5 accent-violet-600" />
              <div>
                <span className="block font-bold text-gray-900 text-xs uppercase tracking-wider mb-0.5">
                  {formData.is_published ? 'Published' : 'Draft'}
                </span>
                <span className="text-xs text-gray-500">
                  {formData.is_published ? 'Page is live to the public.' : 'Page is hidden from visitors.'}
                </span>
              </div>
            </label>
          </Card>

          <Card title="SEO Metadata">
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Title</label>
                <input type="text" name="meta_title" value={formData.meta_title} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Keywords</label>
                <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleChange}
                  placeholder="Comma separated..." className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Description</label>
                <textarea name="meta_description" rows="2" value={formData.meta_description} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-violet-500 text-xs" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" appearance="secondary" onClick={() => navigate('/dashboard/pages')}>Cancel</Button>
          <Button type="submit" disabled={actionLoading}>
            {actionLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
            {isEditing ? 'Update Page' : 'Save Page'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SitePageForm;
