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

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    error: null,
    employees: [],
    projectMembers: {}, // { [project_id]: [employee, ...] }
    membersLoading: false,
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
      });
  },
});

export default projectsSlice.reducer; 