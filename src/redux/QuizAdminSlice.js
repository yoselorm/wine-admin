import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Some of this hasn't been exercised against a live backend yet, so unwrap defensively —
// accept either a flat array or a nested {data: [...]}.
const unwrapList = (payload) => {
  const d = payload?.data ?? payload;
  return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
};

// 1. Every question, active or not, with options and effects
export const fetchQuizQuestions = createAsyncThunk(
  'quizAdmin/fetchQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/quiz/questions`);
      return unwrapList(response.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load quiz questions.');
    }
  }
);

// 2. The fields an answer may write to, and their allowed values — build the effect editor from this
export const fetchEffectPaths = createAsyncThunk(
  'quizAdmin/fetchEffectPaths',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/quiz/effect-paths`);
      return unwrapList(response.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load effect paths.');
    }
  }
);

export const createQuizQuestion = createAsyncThunk(
  'quizAdmin/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/quiz/questions`, questionData);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add question.');
    }
  }
);

export const updateQuizQuestion = createAsyncThunk(
  'quizAdmin/updateQuestion',
  async ({ id, questionData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/quiz/questions/${id}`, questionData);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update question.');
    }
  }
);

// Deactivates, does not delete — customers have already answered it.
export const deleteQuizQuestion = createAsyncThunk(
  'quizAdmin/deleteQuestion',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/quiz/questions/${id}`);
      return { id, message: response.data?.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to retire question.');
    }
  }
);

export const createQuizOption = createAsyncThunk(
  'quizAdmin/createOption',
  async ({ questionId, optionData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/quiz/questions/${questionId}/options`, optionData);
      return { questionId, option: response.data?.data || response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add answer.');
    }
  }
);

export const updateQuizOption = createAsyncThunk(
  'quizAdmin/updateOption',
  async ({ id, optionData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/quiz/options/${id}`, optionData);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update answer.');
    }
  }
);

// A question must keep at least one answer — deleting the last one is a 422.
export const deleteQuizOption = createAsyncThunk(
  'quizAdmin/deleteOption',
  async ({ id, questionId }, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/quiz/options/${id}`);
      return { id, questionId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove answer.');
    }
  }
);

// Effects are replaced wholesale — sending [] makes the answer purely cosmetic.
export const updateOptionEffects = createAsyncThunk(
  'quizAdmin/updateOptionEffects',
  async ({ optionId, questionId, effects }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/quiz/options/${optionId}/effects`, { effects });
      return { optionId, questionId, effects: response.data?.data?.effects || effects };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save effects.');
    }
  }
);

const quizAdminSlice = createSlice({
  name: 'quizAdmin',
  initialState: {
    questions: [],
    effectPaths: [],
    loading: false,
    effectPathsLoading: false,
    mutationLoading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearQuizAdminStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizQuestions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuizQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = [...action.payload].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      })
      .addCase(fetchQuizQuestions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchEffectPaths.pending, (state) => { state.effectPathsLoading = true; })
      .addCase(fetchEffectPaths.fulfilled, (state, action) => {
        state.effectPathsLoading = false;
        state.effectPaths = action.payload;
      })
      .addCase(fetchEffectPaths.rejected, (state, action) => {
        state.effectPathsLoading = false;
        state.error = action.payload;
      })

      .addCase(createQuizQuestion.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createQuizQuestion.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Question added.';
        if (action.payload) state.questions.push(action.payload);
      })
      .addCase(createQuizQuestion.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateQuizQuestion.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateQuizQuestion.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Question saved.';
        const updated = action.payload;
        if (updated) state.questions = state.questions.map((q) => (q.id === updated.id ? { ...q, ...updated } : q));
      })
      .addCase(updateQuizQuestion.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteQuizQuestion.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteQuizQuestion.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Question retired — it no longer shows to new customers.';
        state.questions = state.questions.map((q) => (q.id === action.payload.id ? { ...q, is_active: false } : q));
      })
      .addCase(deleteQuizQuestion.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(createQuizOption.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createQuizOption.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Answer added.';
        const { questionId, option } = action.payload;
        state.questions = state.questions.map((q) =>
          q.id === questionId ? { ...q, options: [...(q.options || []), option] } : q
        );
      })
      .addCase(createQuizOption.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateQuizOption.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateQuizOption.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Answer saved.';
        const updated = action.payload;
        if (updated) {
          state.questions = state.questions.map((q) => ({
            ...q,
            options: q.options?.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
          }));
        }
      })
      .addCase(updateQuizOption.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteQuizOption.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteQuizOption.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Answer removed.';
        const { id, questionId } = action.payload;
        state.questions = state.questions.map((q) =>
          q.id === questionId ? { ...q, options: q.options?.filter((o) => o.id !== id) } : q
        );
      })
      .addCase(deleteQuizOption.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateOptionEffects.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateOptionEffects.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Effects saved.';
        const { optionId, questionId, effects } = action.payload;
        state.questions = state.questions.map((q) =>
          q.id === questionId
            ? { ...q, options: q.options?.map((o) => (o.id === optionId ? { ...o, effects } : o)) }
            : q
        );
      })
      .addCase(updateOptionEffects.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; });
  },
});

export const { clearQuizAdminStatus } = quizAdminSlice.actions;
export default quizAdminSlice.reducer;
