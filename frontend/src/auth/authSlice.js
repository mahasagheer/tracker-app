import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const signupAdmin = createAsyncThunk(
  'auth/signupAdmin',
  async (signupData, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/admin/signup', {
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

export const addEmployee = createAsyncThunk(
  'auth/addEmployee',
  async (employeeData, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });
      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.error || 'Failed to add employee');
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
    addEmployeeLoading: false,
    addEmployeeError: null,
    addEmployeeSuccess: false,
  },
  reducers: {
    resetSignupState(state) {
      state.signupLoading = false;
      state.signupError = null;
      state.signupSuccess = false;
    },
    resetAddEmployeeState(state) {
      state.addEmployeeLoading = false;
      state.addEmployeeError = null;
      state.addEmployeeSuccess = false;
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
      })
      .addCase(addEmployee.pending, state => {
        state.addEmployeeLoading = true;
        state.addEmployeeError = null;
        state.addEmployeeSuccess = false;
      })
      .addCase(addEmployee.fulfilled, state => {
        state.addEmployeeLoading = false;
        state.addEmployeeError = null;
        state.addEmployeeSuccess = true;
      })
      .addCase(addEmployee.rejected, (state, action) => {
        state.addEmployeeLoading = false;
        state.addEmployeeError = action.payload || 'Failed to add employee';
        state.addEmployeeSuccess = false;
      });
  },
});

export const { resetSignupState, resetAddEmployeeState } = authSlice.actions;
export default authSlice.reducer; 