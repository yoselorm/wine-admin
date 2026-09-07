import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchBlogCategories,
  deleteBlogCategory,
  clearCategoryStatus,
} from "../redux/BlogCategorySlice";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "../components/Toast";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const BlogCategories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, loading, mutationLoading, error, message } = useSelector(
    (state) => state.blogCategories,
  );

  const [searchInputValue, setSearchInputValue] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCategoryStatus());
    }
    if (message) {
      toast.success(message);
      dispatch(clearCategoryStatus());
    }
  }, [error, message, dispatch]);

  const debouncedFetch = useCallback(
    debounce((searchString) => {
      dispatch(fetchBlogCategories({ search: searchString }));
    }, 400),
    [dispatch],
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInputValue(value);
    debouncedFetch(value);
  };

  const handleDeleteTrigger = (category) => {
    setSelectedItem(category);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!selectedItem) return;
    await dispatch(deleteBlogCategory(selectedItem.id));
    setDeleteModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blog Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage editorial partitions, nested collections, and SEO metadata.
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/dashboard/blog-categories/new')}>Add Category</Button>
      </div>

      <Card className="flex items-center gap-3">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchInputValue}
          onChange={handleSearchChange}
          className="w-full text-sm bg-transparent border-none text-gray-800 focus:outline-none focus:ring-0"
        />
        {loading && <Loader2 className="animate-spin text-gray-400" size={14} />}
      </Card>

      <Card padded={false}>
        {loading && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-violet-500" size={24} />
            <span className="text-sm text-gray-400 font-medium">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <FolderTree size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No categories yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-5">Name / Slug</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Position</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} onClick={() => navigate(`/dashboard/blog-categories/${cat.id}/edit`)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-900">{cat.name}</div>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">{cat.slug}</div>
                    </td>
                    <td className="py-4 px-5 text-gray-500 max-w-xs truncate">{cat.description || "—"}</td>
                    <td className="py-4 px-5 font-mono font-bold text-gray-700">{cat.position}</td>
                    <td className="py-4 px-5">
                      <Badge tone={cat.is_published ? 'green' : 'neutral'}>{cat.is_published ? "Published" : "Draft"}</Badge>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/dashboard/blog-categories/${cat.id}/edit`)}
                        className="inline-flex p-1.5 rounded-md border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 bg-white">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteTrigger(cat)}
                        className="inline-flex p-1.5 rounded-md border border-red-100 hover:bg-red-50 text-red-600 bg-white">
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
        isOpen={deleteModalOpen}
        isDeleting={mutationLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${selectedItem?.name}"?`}
      />
    </div>
  );
};

export default BlogCategories;
