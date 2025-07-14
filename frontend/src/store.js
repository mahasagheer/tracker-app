import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import projectsReducer from './projectsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
  },
});

export default store; 