import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, Calendar, User, Tag, Video, Eye, 
  Settings, Globe, Sparkles, CheckCircle, XCircle, Info, FileText
} from 'lucide-react';

// Adjust this import path to match your actual blog slice location
import { fetchBlogById } from '../redux/BlogSlice';

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Safely select from your global blog slice layer
  const { currentPost: blog, loading, error } = useSelector(
    (state) => state.blogs
  );

  useEffect(() => {
    if (id && dispatch(fetchBlogById)) {
      dispatch(fetchBlogById(id));
    }
  }, [dispatch, id]);

  // Helper helper to process stringified JSON tags safely
  const parseTags = (tagsField) => {
    if (!tagsField) return [];
    try {
      if (typeof tagsField === 'string') {
        // Safe check for stringified JSON arrays like '["aliquid","cum"]'
        if (tagsField.startsWith('[') && tagsField.endsWith(']')) {
          return JSON.parse(tagsField);
        }
        return tagsField.split(',').map(t => t.trim());
      }
      if (Array.isArray(tagsField)) return tagsField;
    } catch (e) {
      console.error("Error parsing tags data", e);
    }
    return [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading article details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-red-100 p-6 rounded-xl text-center shadow-xs">
          <Info className="mx-auto text-red-500 mb-3" size={32} />
          <h3 className="text-sm font-bold text-gray-900">Data Fetch Failure</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-gray-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const articleTags = parseTags(blog.tags);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 text-xs text-gray-700">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-gray-200/50"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-gray-900">{blog.title}</h1>
                <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200/40 uppercase tracking-wider font-semibold">
                  {blog.type || 'Standard'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Slug: <span className="font-mono">{blog.slug}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full font-bold tracking-wide text-[10px] uppercase border ${
              blog.is_published 
                ? 'bg-green-50 border-green-200/60 text-green-700' 
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}>
              {blog.is_published ? 'Published' : 'Draft'}
            </span>
            {blog.is_featured && (
              <span className="px-2.5 py-1 rounded-full font-bold tracking-wide text-[10px] uppercase bg-yellow-50 border border-yellow-200/60 text-yellow-700 flex items-center gap-1">
                <Sparkles size={10} /> Featured Article
              </span>
            )}
          </div>
        </div>

        {/* Article Details Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Post Resources */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Featured Image Canvas Frame */}
            {blog.featured_image_url && (
              <div className="bg-white p-3 rounded-xl border border-gray-200/60 shadow-xs">
                <div className="w-full h-64 sm:h-80 bg-gray-100 border border-gray-200/40 rounded-lg overflow-hidden relative">
                  <img 
                    src={blog.featured_image_url} 
                    alt={blog.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
            )}

            {/* Content Display Blocks */}
            <div className="bg-white p-6 rounded-xl border border-gray-200/60 shadow-xs space-y-6">
              
              {/* Excerpt Expose */}
              {blog.excerpt && (
                <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-xl space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Article Summary (Excerpt)</span>
                  <p className="text-gray-800 leading-relaxed font-sans italic text-[12px]">
                    "{blog.excerpt}"
                  </p>
                </div>
              )}

              {/* Master Body Content Render */}
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 border-b pb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-gray-400">
                  <FileText size={12} /> Body Content
                </h3>
                <div className="text-gray-800 leading-relaxed text-[12px] whitespace-pre-line font-sans pt-1">
                  {blog.content || <span className="text-gray-400 italic">No content has been added to this record.</span>}
                </div>
              </div>

              {/* External Video Target Alert */}
              {blog.video_url && (
                <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5 text-gray-600 bg-gray-50/60 p-3 rounded-lg border border-gray-200/40">
                  <div className="p-2 bg-gray-200/60 text-gray-900 rounded-md">
                    <Video size={14} />
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900 text-[11px]">Attached Video Resource</span>
                    <a 
                      href={blog.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] text-gray-500 hover:text-gray-900 underline break-all font-mono"
                    >
                      {blog.video_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Parameters, Configuration Matrices & Search Metadata */}
          <div className="md:col-span-4 space-y-6">
            
            {/* System Mappings & Attributes Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 border-b pb-1.5 flex items-center gap-1.5">
                <Settings size={13} className="text-gray-400" />
                System Audit Parameters
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="block text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <User size={11}/> Author Admin ID
                  </span>
                  <div className="px-2.5 py-1.5 bg-gray-50 border border-gray-200/40 rounded-lg text-gray-700 font-mono select-all break-all">
                    {blog.admin_id || 'Not Assigned'}
                  </div>
                </div>

                <div>
                  <span className="block text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <Tag size={11}/> Content Taxonomy Tags
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {articleTags.length > 0 ? (
                      articleTags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No assigned tags found.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp Tracking List */}
              <div className="pt-2 space-y-2 border-t border-gray-100 text-[11px]">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calendar size={11} /> Published Target
                  </span>
                  <span className="font-medium text-gray-900">{formatDate(blog.published_at)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-400 flex items-center gap-1">
                    <CheckCircle size={11} /> Record Created
                  </span>
                  <span className="font-medium text-gray-900">{formatDate(blog.created_at)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-400 flex items-center gap-1">
                    <XCircle size={11} /> Last Modified
                  </span>
                  <span className="font-medium text-gray-900">{formatDate(blog.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* SEO & Search Discovery Parameter Engine (Meta Fields) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 border-b pb-1.5 flex items-center gap-1.5">
                <Globe size={13} className="text-gray-400" />
                SEO Search Meta Engine
              </h3>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1">
                    Meta Discovery Title
                  </h4>
                  <p className="text-gray-800 bg-gray-50 border border-gray-100 p-2 rounded-md font-medium leading-normal">
                    {blog.meta_title || <span className="text-gray-400 italic">No meta title defined.</span>}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1">
                    Meta Search Keywords
                  </h4>
                  <p className="text-gray-800 bg-gray-50 border border-gray-100 p-2 rounded-md font-mono leading-normal">
                    {blog.meta_keywords || <span className="text-gray-400 italic">No search index keywords structured.</span>}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mb-1">
                    Meta Description Block
                  </h4>
                  <p className="text-gray-600 bg-gray-50 border border-gray-100 p-2.5 rounded-md leading-relaxed">
                    {blog.meta_description || <span className="text-gray-400 italic">No explicit crawling summaries set.</span>}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default BlogDetailPage;