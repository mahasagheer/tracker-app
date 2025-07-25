import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch all projects for a company
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (company_id) => {
    const res = await axios.get(`/api/projects?company_id=${company_id}`);
    return res.data;
  }
);

// Add a new project
export const addProject = createAsyncThunk(
  'projects/addProject',
  async (project) => {
    const res = await axios.post('/api/projects', project);
    return res.data;
  }
);

// Fetch all employees for a company
export const fetchEmployees = createAsyncThunk(
  'projects/fetchEmployees',
  async (company_id) => {
    const res = await axios.get(`/api/employees/${company_id}`);
    return res.data.employees;
  }
);

// Fetch members for a project
export const fetchProjectMembers = createAsyncThunk(
  'projects/fetchProjectMembers',
  async (project_id) => {
    const res = await axios.get(`/api/projects/${project_id}/members`);
    return { project_id, members: res.data };
  }
);

// Assign members to a project
export const assignProjectMembers = createAsyncThunk(
  'projects/assignProjectMembers',
  async ({ project_id, employee_ids }) => {
    await axios.post(`/api/projects/${project_id}/members`, { employee_ids });
    return { project_id, employee_ids };
  }
);

// Remove a member from a project
export const removeProjectMember = createAsyncThunk(
  'projects/removeProjectMember',
  async ({ project_id, employee_id }) => {
    await axios.delete(`/api/projects/${project_id}/members/${employee_id}`);
    return { project_id, employee_id };
  }
);

// Update a project
export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }) => {
    const res = await axios.put(`/api/projects/${id}`, data);
    return res.data;
  }
);

// Fetch monthly weekly session durations
export const fetchMonthlyWeeklyDurations = createAsyncThunk(
  'projects/fetchMonthlyWeeklyDurations',
  async (userId, thunkAPI) => {
    let url = '/api/sync/sessions/monthly-weekly-duration';
    if (userId) {
      url += `?userId=${userId}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch durations');
    return await res.json();
  }
);

// Fetch productivity report for a user and date
export const fetchProductivityReport = createAsyncThunk(
  'projects/fetchProductivityReport',
  async ({ userId, date }) => {
    const res = await fetch(`/api/sync/productivity-report?userId=${userId}&date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch productivity report');
    return await res.json();
  }
);

export const fetchAdminMonthlyWeeklySummary = createAsyncThunk(
  'projects/fetchAdminMonthlyWeeklySummary',
  async (adminId, thunkAPI) => {
    const response = await fetch(`/api/sync/admin/monthly-weekly-summary?adminId=${adminId}`);
    if (!response.ok) throw new Error('Failed to fetch admin monthly weekly summary');
    return await response.json();
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    error: null,
    employees: [],
    projectMembers: {}, // { [project_id]: [employee, ...] }
    membersLoading: false,
    monthlyWeeklyDurations: null,
    durationsLoading: false,
    durationsError: null,
    productivityReport: null,
    productivityReportLoading: false,
    productivityReportError: null,
    adminMonthlyWeeklySummary: [],
    adminMonthlyWeeklySummaryLoading: false,
    adminMonthlyWeeklySummaryError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employees = action.payload;
      })
      .addCase(fetchProjectMembers.pending, (state) => {
        state.membersLoading = true;
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.projectMembers[action.payload.project_id] = action.payload.members;
      })
      .addCase(fetchProjectMembers.rejected, (state) => {
        state.membersLoading = false;
      })
      .addCase(assignProjectMembers.fulfilled, (state, action) => {
        // After assigning, you may want to refetch members
      })
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        const { project_id, employee_id } = action.payload;
        if (state.projectMembers[project_id]) {
          state.projectMembers[project_id] = state.projectMembers[project_id].filter(e => e.id !== employee_id);
        }
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        // Replace the updated project in the items array
        const idx = state.items.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(fetchMonthlyWeeklyDurations.pending, state => {
        state.durationsLoading = true;
        state.durationsError = null;
      })
      .addCase(fetchMonthlyWeeklyDurations.fulfilled, (state, action) => {
        state.durationsLoading = false;
        state.monthlyWeeklyDurations = action.payload;
      })
      .addCase(fetchMonthlyWeeklyDurations.rejected, (state, action) => {
        state.durationsLoading = false;
        state.durationsError = action.error.message;
      })
      .addCase(fetchProductivityReport.pending, state => {
        state.productivityReportLoading = true;
        state.productivityReportError = null;
      })
      .addCase(fetchProductivityReport.fulfilled, (state, action) => {
        state.productivityReportLoading = false;
        state.productivityReport = action.payload;
      })
      .addCase(fetchProductivityReport.rejected, (state, action) => {
        state.productivityReportLoading = false;
        state.productivityReportError = action.error.message;
      })
      .addCase(fetchAdminMonthlyWeeklySummary.pending, (state) => {
        state.adminMonthlyWeeklySummaryLoading = true;
        state.adminMonthlyWeeklySummaryError = null;
      })
      .addCase(fetchAdminMonthlyWeeklySummary.fulfilled, (state, action) => {
        state.adminMonthlyWeeklySummaryLoading = false;
        state.adminMonthlyWeeklySummary = action.payload;
      })
      .addCase(fetchAdminMonthlyWeeklySummary.rejected, (state, action) => {
        state.adminMonthlyWeeklySummaryLoading = false;
        state.adminMonthlyWeeklySummaryError = action.error.message;
      });
  },
});

export default projectsSlice.reducer; 