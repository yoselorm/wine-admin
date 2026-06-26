import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/Api";
import { api_url } from "../utils/config";

const prepareFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      // If it's a file object or array of tags, handle correctly
      if (key === "tags" && Array.isArray(data[key])) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  return formData;
};

export const fetchBlogs = createAsyncThunk(
  "blogs/fetchBlogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);
      if (params.sort_by) queryParams.append("sort_by", params.sort_by);
      if (params.sort_order)
        queryParams.append("sort_order", params.sort_order);

      const queryString = queryParams.toString();
      const url = `${api_url}/v1/admin/blogs${queryString ? `?${queryString}` : ""}`;

      const response = await api.get(url);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch blog posts",
      );
    }
  },
);

export const fetchBlogById = createAsyncThunk(
  "blogs/fetchBlogById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/blogs/${id}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch blog post details",
      );
    }
  },
);

// 2. Create Blog Post (POST) - Handles both JSON & Multipart Form File Uploads
export const createBlog = createAsyncThunk(
  "blogs/createBlog",
  async (blogData, { rejectWithValue }) => {
    try {
      // Determine if payload contains raw Files to switch header contexts
      const hasFile =
        blogData.featured_image instanceof File ||
        blogData.video_url instanceof File;
      const payload = hasFile ? prepareFormData(blogData) : blogData;

      const response = await api.post(`${api_url}/v1/admin/blogs`, payload, {
        headers: hasFile
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
      });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create blog post",
      );
    }
  },
);

// 3. Update Blog Post (PUT/POST simulation for multipart edits)
export const updateBlog = createAsyncThunk(
  "blogs/updateBlog",
  async ({ id, blogData }, { rejectWithValue }) => {
    try {
      const hasFile =
        blogData.featured_image instanceof File ||
        blogData.video_url instanceof File;

      let response;
      if (hasFile) {
        // Form data put mutations sometimes drop attachments depending on your Laravel configuration.
        // If your backend PUT fails with file payloads, append '_method: "PUT"' and use api.post instead.
        const payload = prepareFormData(blogData);
        response = await api.post(`${api_url}/v1/admin/blogs/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.put(`${api_url}/v1/admin/blogs/${id}`, blogData);
      }
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update blog post",
      );
    }
  },
);

// 4. Delete Blog Post (DELETE)
export const deleteBlog = createAsyncThunk(
  "blogs/deleteBlog",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/blogs/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete blog post",
      );
    }
  },
);

const blogSlice = createSlice({
  name: "blogs",
  initialState: {
    posts: [],
    pagination: null,
    currentPost: null,
    loading: false,
    mutationLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearBlogStatus: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload?.data || [];
        state.pagination = action.payload?.meta || null;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchBlogById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createBlog.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.posts.unshift(action.payload);
        state.message = "Blog post created successfully";
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      .addCase(updateBlog.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.posts = state.posts.map((post) =>
          post.id === action.payload.id ? action.payload : post,
        );
        state.message = "Blog post updated successfully";
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteBlog.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.posts = state.posts.filter((post) => post.id !== action.payload);
        state.message = "Blog post deleted successfully";
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBlogStatus } = blogSlice.actions;
export default blogSlice.reducer;
