import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, 
  FileText, CheckCircle, XCircle, AlertCircle, LayoutTemplate
} from 'lucide-react';

// Adjust path to match your actual slice location
import { fetchPages, deletePage } from '../redux/PagesSlice';

const PagesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State
  const { 
    pagesList, 
    pagination, 
    loading, 
    mutationLoading,
    error 
  } = useSelector((state) => state.pages);

  // Local Component State for Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'true' = published, 'false' = draft
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data function wrapped in useCallback to prevent unnecessary re-renders
  const loadPages = useCallback(() => {
    const params = {
      page: currentPage,
      per_page: 10,
    };

    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== '') params.is_published = statusFilter;

    dispatch(fetchPages(params));
  }, [dispatch, currentPage, searchTerm, statusFilter]);

  // Initial load and filter change trigger
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    loadPages();
  };

  // Handle Deletion
  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete the page "${title}"?`)) {
      dispatch(deletePage(id));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 text-xs text-zinc-700">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <LayoutTemplate size={18} />
              Pages Management
            </h1>
            <p className="text-[11px] text-zinc-500 mt-1">Manage standard static pages and routing content.</p>
          </div>
          
          <Link 
            to="/admin/pages/create" 
            className="flex items-center gap-1.5 bg-zinc-950 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Plus size={14} /> Create New Page
          </Link>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          <form onSubmit={handleSearch} className="relative w-full sm:w-80 flex items-center">
            <Search className="absolute left-3 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by title or slug..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200/60 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
            />
            <button type="submit" className="hidden" /> {/* Hidden submit for enter key */}
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200/60">
              <Filter size={14} />
              <select 
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none focus:outline-none text-xs font-medium text-zinc-700 cursor-pointer w-full sm:w-auto"
              >
                <option value="">All Statuses</option>
                <option value="true">Published</option>
                <option value="false">Drafts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table Canvas */}
        <div className="bg-white rounded-xl border border-zinc-200/60 shadow-xs overflow-hidden relative">
          
          {/* Loading Overlay for background fetching */}
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="border-b border-zinc-200 bg-zinc-50/50 py-3.5 px-5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Page Information</th>
                  <th className="border-b border-zinc-200 bg-zinc-50/50 py-3.5 px-5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Status</th>
                  <th className="border-b border-zinc-200 bg-zinc-50/50 py-3.5 px-5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">SEO Title</th>
                  <th className="border-b border-zinc-200 bg-zinc-50/50 py-3.5 px-5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {error ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-red-500 bg-red-50/30">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle size={20} />
                        <span className="font-medium">{error}</span>
                      </div>
                    </td>
                  </tr>
                ) : pagesList && pagesList.length > 0 ? (
                  pagesList.map((page) => (
                    <tr key={page.id} className="hover:bg-zinc-50/50 transition-colors group">
                      
                      {/* Title & Slug */}
                      <td className="py-3 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 text-zinc-500 rounded-lg border border-zinc-200/40">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-[13px]">{page.title}</p>
                            <p className="font-mono text-[10px] text-zinc-400 mt-0.5">/{page.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-5 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                          page.is_published 
                            ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' 
                            : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        }`}>
                          {page.is_published ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {page.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Meta Information */}
                      <td className="py-3 px-5 align-middle">
                        <div className="max-w-[200px] truncate text-[11px] text-zinc-500 font-medium bg-zinc-50 px-2 py-1 rounded border border-zinc-100 inline-block">
                          {page.meta_title || <span className="italic text-zinc-400">Inherited</span>}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                          
                          {/* View Record Button */}
                          <button 
                            onClick={() => navigate(`/admin/pages/${page.slug || page.id}`)}
                            title="View Page Details"
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          
                          {/* Edit Button */}
                          <button 
                            onClick={() => navigate(`/admin/pages/${page.slug || page.id}/edit`)}
                            title="Edit Page"
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDelete(page.id || page.slug, page.title)}
                            disabled={mutationLoading}
                            title="Delete Page"
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-zinc-400">
                      <FileText size={24} className="mx-auto mb-2 opacity-20" />
                      <p>No pages found matching your criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {pagination && pagination.last_page > 1 && (
            <div className="px-5 py-3 border-t border-zinc-200/60 bg-zinc-50/50 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-500">
                Showing page <span className="text-zinc-900 font-bold">{pagination.current_page}</span> of <span className="text-zinc-900 font-bold">{pagination.last_page}</span>
              </span>
              
              <div className="flex items-center gap-1">
                <button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 bg-white border border-zinc-200/60 rounded-md hover:bg-zinc-50 disabled:opacity-50 text-[11px] font-bold text-zinc-700 transition-colors"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === pagination.last_page || loading}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-3 py-1.5 bg-white border border-zinc-200/60 rounded-md hover:bg-zinc-50 disabled:opacity-50 text-[11px] font-bold text-zinc-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default PagesList;