import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Wine Attributes (Handles: page, per_page, sort_by, sort_order, search)
export const fetchWineAttributes = createAsyncThunk(
  'wineAttributes/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/wine-attributes`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wine attributes.'
      );
    }
  }
);

// Drives the type picker — `attribute_type` used to be one of a handful of fixed values, now
// it's any `^[a-z][a-z0-9_]*$` identifier. `in_use` is what's already in the catalogue, ordered by
// how many products carry it; `suggested` is grouped `shared` (always relevant) plus one group
// per beverage class (wine/spirit/beer/non_alcoholic) — offer `shared` plus whichever class group
// matches the product being edited.
//
// `types` is the same vocabulary as real rows, and carries the one field that changes how the form
// behaves: `is_enumerated`. A type with a shared list of values (bottle_size, allergens) keeps them
// in `values` and every product points at the same row, so fixing a spelling fixes every product at
// once. A type without one (colour_note, grape_blend) stores prose on each product, and there is
// nothing to pick from.
export const fetchAttributeTypes = createAsyncThunk(
  'wineAttributes/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/attribute-types`);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attribute types.');
    }
  }
);

// --- The vocabulary itself: the types, and the shared values behind them ---------------------
//
// These used to be a config file on the server that nobody could edit without a deploy. The reason
// they are worth a screen is the rename below: a shared value is carried by every product that uses
// it, so correcting one spelling corrects all of them at once.

export const createAttributeType = createAsyncThunk(
  'wineAttributes/createType',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/attribute-types`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create attribute type.');
    }
  }
);

export const updateAttributeType = createAsyncThunk(
  'wineAttributes/updateType',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/attribute-types/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update attribute type.');
    }
  }
);

// Refused with a 422 while any product still carries the type. The server's message names how many,
// so it is passed straight through rather than replaced with something vaguer.
export const deleteAttributeType = createAsyncThunk(
  'wineAttributes/deleteType',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/attribute-types/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete attribute type.');
    }
  }
);

export const createAttributeValue = createAsyncThunk(
  'wineAttributes/createValue',
  async ({ typeId, value }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/attribute-types/${typeId}/values`, { value });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add value.');
    }
  }
);

// The rename that moves every product carrying this value. A 422 here means another value on the
// same type already reads that way — the server refuses rather than quietly merging the two.
export const updateAttributeValue = createAsyncThunk(
  'wineAttributes/updateValue',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/attribute-values/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to rename value.');
    }
  }
);

export const deleteAttributeValue = createAsyncThunk(
  'wineAttributes/deleteValue',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/attribute-values/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete value.');
    }
  }
);

// 2. Create New Wine Attribute (Payload: product_id, attribute_type, value)
export const createWineAttribute = createAsyncThunk(
  'wineAttributes/create',
  async (attributeData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/wine-attributes`, attributeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create wine attribute.'
      );
    }
  }
);

// 3. Update Wine Attribute
export const updateWineAttribute = createAsyncThunk(
  'wineAttributes/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/wine-attributes/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update wine attribute.'
      );
    }
  }
);

// 4. Delete Wine Attribute
export const deleteWineAttribute = createAsyncThunk(
  'wineAttributes/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/wine-attributes/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete wine attribute.'
      );
    }
  }
);

const initialState = {
  attributes: [],
  pagination: null,
  types: [],
  inUseTypes: [],
  suggestedTypes: { shared: [], wine: [], spirit: [], beer: [], non_alcoholic: [] },
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const wineAttributeSlice = createSlice({
  name: 'wineAttributes',
  initialState,
  reducers: {
    clearWineAttributeStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchWineAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWineAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.attributes = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchWineAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Types (for the picker) ---
      .addCase(fetchAttributeTypes.fulfilled, (state, action) => {
        state.types = action.payload?.types || [];
        state.inUseTypes = action.payload?.in_use || [];
        state.suggestedTypes = action.payload?.suggested || initialState.suggestedTypes;
      })

      // --- Create ---
      .addCase(createWineAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createWineAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine attribute created successfully!';
      })
      .addCase(createWineAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateWineAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateWineAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine attribute updated successfully!';
      })
      .addCase(updateWineAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Vocabulary (types and their shared values) ---
      //
      // None of these merge into local state: every one of them can change rows the list is already
      // showing — a rename moves every product on that value — so the page refetches instead of
      // trying to reconcile by hand.
      .addCase(deleteAttributeType.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.types = state.types.filter((t) => t.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Attribute type removed.';
      })
      // A 204 carries no body, so there is no server message to pass on here.
      .addCase(deleteAttributeValue.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.types = state.types.map((t) => ({
          ...t,
          values: (t.values || []).filter((v) => v.id !== action.payload.id),
        }));
        state.successMessage = 'Value removed.';
      })

      // --- Delete ---
      .addCase(deleteWineAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteWineAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.attributes = state.attributes.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Wine attribute removed successfully!';
      })
      .addCase(deleteWineAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // Every vocabulary mutation shares one pending/success/failure shape, so they are matched by
      // suffix rather than listed five times over.
      .addMatcher(
        (action) => /^wineAttributes\/(create|update|delete)(Type|Value)\/pending$/.test(action.type),
        (state) => { state.mutationLoading = true; state.error = null; },
      )
      .addMatcher(
        (action) => /^wineAttributes\/(create|update)(Type|Value)\/fulfilled$/.test(action.type),
        (state, action) => {
          state.mutationLoading = false;
          state.successMessage = action.payload?.message || 'Saved.';
        },
      )
      .addMatcher(
        (action) => /^wineAttributes\/(create|update|delete)(Type|Value)\/rejected$/.test(action.type),
        (state, action) => { state.mutationLoading = false; state.error = action.payload; },
      );
  },
});

export const { clearWineAttributeStatus } = wineAttributeSlice.actions;
export default wineAttributeSlice.reducer;