import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPages, deletePage, clearPagesStatus } from '../redux/PagesSlice';
import { FileText, Plus, Search, Trash2, Edit3, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

const AdminPages = () => {
  const dispatch = useDispatch();
  const { pagesList, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.pages);

  // Filters matching parameters in Screenshot 2026-06-26 at 12.25.48.png
  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchPages({ 
      page: currentPage, 
      search: search || undefined, 
      is_published: isPublished === '' ? undefined : isPublished 
    }));
  }, [dispatch, currentPage, search, isPublished]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearPagesStatus()); }
    if (successMessage) { toast.success(successMessage); dispatch(clearPagesStatus()); }
  }, [error, successMessage, dispatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Content Pages</h1>
          <p className="text-xs text-zinc-500">Manage site pages, metadata, and publication status.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800">
          <Plus size={14} /> Create New Page
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 bg-white p-4 border border-zinc-200 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input 
            type="text" placeholder="Search pages by title or slug..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-xs"
          />
        </div>
        <select 
          value={isPublished} onChange={(e) => setIsPublished(e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-xs"
        >
          <option value="">All Statuses</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Loading content...
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagesList.map((page) => (
                <tr key={page.id} className="hover:bg-zinc-50">
                  <td className="py-3 px-4 font-bold text-zinc-900">{page.title}</td>
                  <td className="py-3 px-4 font-mono text-zinc-500">{page.slug}</td>
                  <td className="py-3 px-4">
                    {page.is_published ? (
                      <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12} /> Published</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600"><XCircle size={12} /> Draft</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button className="text-zinc-500 hover:text-zinc-900"><Edit3 size={14} /></button>
                    <button 
                      onClick={() => dispatch(deletePage(page.slug))} 
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 border-t border-zinc-200">
          <Pagination meta={pagination} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default AdminPages;