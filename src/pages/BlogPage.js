import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchBlogs,
  clearBlogStatus,
} from "../redux/BlogSlice";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Star,
} from "lucide-react";
import toast from "../components/Toast";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Blogs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { posts, loading, error, message } = useSelector(
    (state) => state.blogs,
  );

  const [searchInputValue, setSearchInputValue] = useState("");

  useEffect(() => {
    dispatch(fetchBlogs());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearBlogStatus());
    }
    if (message) {
      toast.success(message);
      dispatch(clearBlogStatus());
    }
  }, [error, message, dispatch]);

  const debouncedFetch = useCallback(
    debounce((str) => dispatch(fetchBlogs({ search: str })), 400),
    [dispatch],
  );

  const handleSearchChange = (e) => {
    setSearchInputValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blogs</h1>
        <Button icon={Plus} onClick={() => navigate('/dashboard/blogs/new')}>New Post</Button>
      </div>

      <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-md border border-gray-200 max-w-sm">
        <Search size={15} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search blog titles..."
          value={searchInputValue}
          onChange={handleSearchChange}
          className="w-full text-sm bg-transparent border-none text-gray-800 focus:outline-none focus:ring-0"
        />
        {loading && <Loader2 className="animate-spin text-gray-400" size={14} />}
      </div>

      <Card padded={false}>
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-violet-500" size={24} />
            <span className="text-sm text-gray-400 font-medium">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No posts written yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4 text-right">Linked Products</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} onClick={() => navigate(`/dashboard/blogs/${post.id}/edit`)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{post.title}</div>
                      {post.is_featured && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium mt-0.5">
                          <Star size={11} className="fill-yellow-400 text-yellow-400" /> Featured
                        </div>
                      )}
                      {post.tags && <div className="text-xs text-gray-400 mt-0.5">{post.tags}</div>}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{post.type}</td>
                    <td className="py-4 px-4 text-gray-600">{post.author_name || post.author || '—'}</td>
                    <td className="py-4 px-4 text-right text-gray-700">{post.linked_products_count ?? post.product_ids?.length ?? 0}</td>
                    <td className="py-4 px-4 text-gray-500">
                      {post.published_at ? post.published_at.slice(0, 10) : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <Badge tone={post.is_published ? 'green' : 'yellow'}>{post.is_published ? "Published" : "Draft"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Blogs;
