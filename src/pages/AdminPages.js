import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, LayoutTemplate, MoreVertical } from 'lucide-react';

import { fetchPages, deletePage } from '../redux/PagesSlice';
import PageModal from '../components/PageModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'; 

const AdminPages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: pages, loading, actionLoading } = useSelector((state) => state.adminPages);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Fetch Only
  useEffect(() => {
    dispatch(fetchPages());
  }, [dispatch]);

  // Handlers
  const handleDeleteConfirm = async () => {
    await dispatch(deletePage(selectedPage.id)).unwrap();
    setIsDeleteModalOpen(false);
    setSelectedPage(null);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content Pages</h1>
          <p className="text-zinc-500 text-sm">Manage your static website content.</p>
        </div>
        <button 
          onClick={() => { setSelectedPage(null); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800"
        >
          <Plus size={16} /> New Page
        </button>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
   <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4 hidden sm:table-cell">Slug</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-medium">{page.title}</td>
                    <td className="p-4 hidden sm:table-cell font-mono text-zinc-500">/{page.slug}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => navigate(`/dashboard/pages/${page.id}`)} className="p-1.5 hover:bg-zinc-100 rounded">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => { setSelectedPage(page); setIsFormModalOpen(true); }} className="p-1.5 hover:bg-zinc-100 rounded">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => { setSelectedPage(page); setIsDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <PageModal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        pageData={selectedPage} 
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        isDeleting={actionLoading}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Page"
        message={`Permanently delete "${selectedPage?.title}"? This cannot be undone.`}
      />
    </div>
  );
};

export default AdminPages;