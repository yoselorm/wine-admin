import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, LayoutTemplate } from 'lucide-react';

import { fetchPages, deletePage } from '../redux/PagesSlice';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const AdminPages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: pages, loading, actionLoading } = useSelector((state) => state.adminPages);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  useEffect(() => {
    dispatch(fetchPages());
  }, [dispatch]);

  const handleDeleteConfirm = async () => {
    await dispatch(deletePage(selectedPage.id)).unwrap();
    setIsDeleteModalOpen(false);
    setSelectedPage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your static website content.</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/dashboard/pages/new')}>New Page</Button>
      </div>

      <Card padded={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <LayoutTemplate size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No pages yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-5">Title</th>
                  <th className="py-3 px-5 hidden sm:table-cell">Slug</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((page) => (
                  <tr key={page.id} onClick={() => navigate(`/dashboard/pages/${page.id}/edit`)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{page.title}</td>
                    <td className="py-3.5 px-5 hidden sm:table-cell font-mono text-gray-500">/{page.slug}</td>
                    <td className="py-3.5 px-5">
                      <Badge tone={page.is_published ? 'green' : 'neutral'}>{page.is_published ? 'Published' : 'Draft'}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/dashboard/pages/${page.id}`)} className="inline-flex p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => navigate(`/dashboard/pages/${page.id}/edit`)} className="inline-flex p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => { setSelectedPage(page); setIsDeleteModalOpen(true); }} className="inline-flex p-1.5 rounded-md border border-red-100 bg-white text-red-600 hover:bg-red-50">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        isDeleting={actionLoading}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Page"
        message={`Are you sure you want to delete "${selectedPage?.title}"?`}
      />
    </div>
  );
};

export default AdminPages;
