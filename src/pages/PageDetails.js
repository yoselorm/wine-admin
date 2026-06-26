import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, FileText, Globe, CheckCircle, 
  Settings, Info, LayoutTemplate
} from 'lucide-react';

import { fetchPageDetails, clearCurrentPageDetails } from '../redux/PagesSlice';

const PageDetailPage = () => {
  const { id } = useParams(); // Can be ID or Slug based on your routing
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Pulling state directly matching your exact slice structure
  const { 
    currentPageDetails: page, 
    detailsLoading, 
    error 
  } = useSelector((state) => state.pages);

  useEffect(() => {
    if (id) {
      dispatch(fetchPageDetails(id));
    }

    // Cleanup when leaving the page
    return () => {
      dispatch(clearCurrentPageDetails());
    };
  }, [dispatch, id]);

  if (detailsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Loading page details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-red-100 p-6 rounded-xl text-center shadow-xs">
          <Info className="mx-auto text-red-500 mb-3" size={32} />
          <h3 className="text-sm font-bold text-zinc-900">Data Fetch Failure</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!page) return null;

  // Safe tag parser for meta keywords if they are returned as a comma-separated string
  const keywordTags = page.meta_keywords 
    ? page.meta_keywords.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 text-xs text-zinc-700">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-lg transition-colors border border-zinc-200/50"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-zinc-900">{page.title}</h1>
                <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200/40 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <LayoutTemplate size={10} /> Static Page
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Route Slug: <span className="font-mono text-zinc-600">/{page.slug}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full font-bold tracking-wide text-[10px] uppercase border flex items-center gap-1 ${
              page.is_published 
                ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' 
                : 'bg-zinc-100 border-zinc-200 text-zinc-500'
            }`}>
              {page.is_published && <CheckCircle size={10} />}
              {page.is_published ? 'Published Live' : 'Draft Mode'}
            </span>
          </div>
        </div>

        {/* Page Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Master Page Content */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-zinc-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 border-b pb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-zinc-400">
                <FileText size={12} /> Rendered Page Content
              </h3>
              
              <div className="text-zinc-800 leading-relaxed text-[13px] whitespace-pre-line font-sans pt-1 min-h-[250px]">
                {page.content ? (
                  page.content
                ) : (
                  <span className="text-zinc-400 italic">No structural content has been added to this page yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: System & SEO Settings */}
          <div className="md:col-span-4 space-y-6">
            
            {/* SEO & Search Discovery Parameter Engine */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                <Globe size={13} className="text-zinc-400" />
                SEO & Meta Engine
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    Meta Discovery Title
                  </h4>
                  <p className="text-zinc-800 bg-zinc-50 border border-zinc-100 p-2.5 rounded-md font-medium leading-normal">
                    {page.meta_title || <span className="text-zinc-400 italic">Inherits default title.</span>}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    Meta Description Block
                  </h4>
                  <p className="text-zinc-600 bg-zinc-50 border border-zinc-100 p-2.5 rounded-md leading-relaxed">
                    {page.meta_description || <span className="text-zinc-400 italic">No explicit crawling summaries set.</span>}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    Search Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {keywordTags.length > 0 ? (
                      keywordTags.map((keyword, i) => (
                        <span 
                          key={i} 
                          className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 italic bg-zinc-50 border border-zinc-100 p-2 rounded-md w-full">No keywords configured.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick System Audit Details */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs space-y-3">
               <h3 className="font-bold text-zinc-900 border-b pb-1.5 flex items-center gap-1.5">
                <Settings size={13} className="text-zinc-400" />
                System Parameters
              </h3>
              
              <div className="pt-1 space-y-2">
                 <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Internal ID</span>
                  <span className="font-mono text-zinc-900">{page.id || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-500 font-medium">Indexable Route</span>
                  <span className="font-mono text-zinc-900 break-all text-right max-w-[150px]">/{page.slug}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PageDetailPage;