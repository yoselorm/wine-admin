import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import {
  fetchBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  clearCategoryStatus,
} from "../redux/BlogCategorySlice";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import toast from "../components/Toast";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

// Simple modular functional debounce helper
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
  const { categories, loading, mutationLoading, error, message } = useSelector(
    (state) => state.blogCategories,
  );

  // Search input localized state management
  const [searchInputValue, setSearchInputValue] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    parent_id: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    is_published: true,
    position: 1,
  });

  // Load baseline inventory indexing data
  useEffect(() => {
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  // Handle toast action loops
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCategoryStatus());
    }
    if (message) {
      toast.success(message);
      dispatch(clearCategoryStatus());
      closeDrawer();
    }
  }, [error, message, dispatch]);

  // 1. Debounced dispatch implementation
  const debouncedFetch = useCallback(
    debounce((searchString) => {
      dispatch(fetchBlogCategories({ search: searchString }));
    }, 400),
    [dispatch],
  );

  // 2. Event handler monitoring input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInputValue(value);
    debouncedFetch(value); // Triggers debounced fetch parameters to the server side
  };

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug: nameVal
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-"),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateDrawer = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      parent_id: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      is_published: true,
      position: 1,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image_url: category.image_url || "",
      parent_id: category.parent_id || "",
      meta_title: category.meta_title || "",
      meta_description: category.meta_description || "",
      meta_keywords: category.meta_keywords || "",
      is_published: category.is_published ?? true,
      position: category.position || 1,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      dispatch(
        updateBlogCategory({ id: editingCategory.id, categoryData: formData }),
      );
    } else {
      dispatch(createBlogCategory(formData));
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">
            Blog Categories
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage editorial partitions, nested collections, and SEO endpoints.
          </p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-3">
        <Search size={16} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Type to search via server indices instantly (Debounced)..."
          value={searchInputValue}
          onChange={handleSearchChange}
          className="w-full text-xs bg-transparent border-none text-zinc-800 focus:outline-none placeholder-zinc-400"
        />
        {loading && (
          <Loader2 className="animate-spin text-zinc-400" size={14} />
        )}
      </div>

      {/* RE-RENDERED DATA TABLE FRAME */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#c4945c]" size={24} />
            <span className="text-xs text-zinc-400 font-medium">
              Syncing database entries...
            </span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <FolderTree size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">
              No categories indexed
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Refine your search parameters or insert a new root node collection
              entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="py-3 px-5">Name / Path Slug</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Position</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-zinc-50/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="font-semibold text-zinc-900">
                        {cat.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {cat.slug}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-zinc-500 max-w-xs truncate font-light">
                      {cat.description || "—"}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-zinc-700">
                      {cat.position}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide border ${
                          cat.is_published
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                            : "bg-zinc-50 border-zinc-200 text-zinc-500"
                        }`}
                      >
                        {cat.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => openEditDrawer(cat)}
                        className="inline-flex p-1.5 rounded-md border border-zinc-200 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 bg-white"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteTrigger(cat)}
                        className="inline-flex p-1.5 rounded-md border border-red-100 hover:bg-red-50 text-red-600 bg-white"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PORTAL INJECTED SLIDE DRAWER HOOK */}
      {isDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
              onClick={closeDrawer}
            />

            <div className="relative w-full max-w-md h-screen bg-white shadow-2xl flex flex-col justify-between z-50 animate-slide-in">
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 flex-shrink-0">
                <div>
                  <h3 className="font-serif font-bold text-zinc-900 text-sm">
                    {editingCategory
                      ? "Update Blog Category"
                      : "Create New Blog Category"}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Configure endpoint schemas and metadata payloads.
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs pb-28"
              >
                <div className="space-y-3 border-b border-zinc-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4945c]">
                    Core Details
                  </span>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-400 mb-1">
                      Path URL Slug (Auto-generated)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.slug}
                      className="w-full px-3 py-2 border border-zinc-100 bg-zinc-50 font-mono text-[11px] text-zinc-500 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows="2"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Image URL Location
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 font-mono text-[11px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Parent Category
                      </label>
                      <select
                        name="parent_id"
                        value={formData.parent_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900 text-xs text-zinc-800"
                      >
                        {/* Option for root level categories with no parent */}
                        <option value="">
                          None (Make it a Top-Level Category)
                        </option>

                        {/* Filter out the category we are currently editing so it can't become a parent of itself! */}
                        {categories
                          .filter(
                            (cat) =>
                              !editingCategory || cat.id !== editingCategory.id,
                          )
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Sorting Rank/Position
                      </label>
                      <input
                        type="number"
                        name="position"
                        min="1"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="accent-zinc-900 w-4 h-4 rounded border-zinc-300"
                    />
                    <label
                      htmlFor="is_published"
                      className="font-semibold text-zinc-700 select-none"
                    >
                      Publish immediately to public digital catalog indexes
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4945c]">
                    Search Engine (SEO) Tuning
                  </span>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      name="meta_description"
                      rows="2"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      name="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                      placeholder="keyword1, keyword2"
                    />
                  </div>
                </div>
              </form>

              <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 font-semibold text-zinc-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutationLoading}
                  onClick={handleSubmit}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-zinc-950 text-white hover:bg-zinc-900 font-semibold rounded-lg disabled:opacity-50"
                >
                  {mutationLoading && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  {editingCategory ? "Update Records" : "Commit Category"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        isDeleting={mutationLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${selectedItem?.name}"? This action cannot be reversed.`}
      />
    </div>
  );
};

export default BlogCategories;
