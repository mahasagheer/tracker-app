import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const signupAdmin = createAsyncThunk(
  'auth/signupAdmin',
  async (signupData, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.error || 'Signup failed');
      }
      return data;
    } catch (err) {
      return rejectWithValue('Network error');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    signupLoading: false,
    signupError: null,
    signupSuccess: false,
  },
  reducers: {
    resetSignupState(state) {
      state.signupLoading = false;
      state.signupError = null;
      state.signupSuccess = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(signupAdmin.pending, state => {
        state.signupLoading = true;
        state.signupError = null;
        state.signupSuccess = false;
      })
      .addCase(signupAdmin.fulfilled, state => {
        state.signupLoading = false;
        state.signupError = null;
        state.signupSuccess = true;
      })
      .addCase(signupAdmin.rejected, (state, action) => {
        state.signupLoading = false;
        state.signupError = action.payload || 'Signup failed';
        state.signupSuccess = false;
      });
  },
});

export const { resetSignupState } = authSlice.actions;
export default authSlice.reducer; 