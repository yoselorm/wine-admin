import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Edit, LayoutTemplate, Globe,
  CheckCircle, XCircle, Calendar, FileText
} from 'lucide-react';

// Adjust imports based on your folder structure
import { fetchPage, clearCurrentPage } from '../redux/PagesSlice';

const AdminPageDetails = () => {
  const { id:pageIdentifier } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux State
  const {
    currentPage: page,
    actionLoading: loading,
    error
  } = useSelector((state) => state.adminPages);

  useEffect(() => {
    if (pageIdentifier) {
      dispatch(fetchPage(pageIdentifier));
    }

    // Cleanup when leaving the page
    return () => {
      dispatch(clearCurrentPage());
    };
  }, [dispatch, pageIdentifier]);

  if (loading || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Page</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard/pages')} className="text-blue-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/dashboard/pages')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors w-fit"
          >
            <ArrowLeft size={16} /> Back to Pages
          </button>
          
          <button
            onClick={() => navigate(`/dashboard/pages/${pageIdentifier}/edit`)}
            className="flex items-center justify-center gap-2 bg-gray-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Edit size={16} /> Edit Page
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                page.is_published 
                  ? 'bg-green-50 border-green-200/60 text-green-700' 
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>
                {page.is_published ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {page.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
              <LayoutTemplate size={14} /> /{page.slug}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Preview Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 uppercase tracking-wider text-[11px] text-gray-500">
                <FileText size={14} /> Content Preview
              </h3>
              
              {/* If your content is HTML, dangerouslySetInnerHTML is used. If it's markdown/plain text, just render {page.content} */}
              <div 
                className="prose prose-sm prose-zinc max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content || '<p class="text-gray-400 italic">No content provided.</p>' }}
              />
            </div>
          </div>

          {/* Right Column: Meta & Info */}
          <div className="space-y-6">
            
            {/* SEO Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 uppercase tracking-wider text-[11px] text-gray-500">
                <Globe size={14} /> SEO Metadata
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Meta Title</span>
                  <p className="text-sm text-gray-800 font-medium">{page.meta_title || '—'}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Meta Description</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{page.meta_description || '—'}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Keywords</span>
                  {page.meta_keywords ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {page.meta_keywords.split(',').map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800">—</p>
                  )}
                </div>
              </div>
            </div>

            {/* System Info Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 uppercase tracking-wider text-[11px] text-gray-500">
                <Calendar size={14} /> System Info
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">Page ID</span>
                  <span className="text-sm font-mono text-gray-800">{page.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">Created At</span>
                  <span className="text-sm text-gray-800">
                    {page.created_at ? new Date(page.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-500 font-medium">Last Updated</span>
                  <span className="text-sm text-gray-800">
                    {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPageDetails;