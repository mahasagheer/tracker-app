import React, { useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';
import EmployeeCalendar from '../components/team/EmployeeCalendar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, fetchProjectMembers } from '../projectsSlice';

export default function Calendar() {
  const { user } = useAuthContext();
  const dispatch = useDispatch();
  const { items: projects, projectMembers } = useSelector(state => state.projects);

  useEffect(() => {
    if (user?.company_id) {
      dispatch(fetchProjects(user.company_id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Fetch members for each project
    projects.forEach(project => {
      dispatch(fetchProjectMembers(project.id));
    });
  }, [dispatch, projects]);

  let assignedProjects = projects;
  if (user?.role === 'Time Reporter') {
    assignedProjects = projects.filter(
      project => (projectMembers[project.id] || []).some(emp => emp.id === user.id)
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Assigned Projects</h1>
      {assignedProjects.length === 0 ? (
        <div className="text-dark/60">No assigned projects found.</div>
      ) : (
        <ul className="space-y-4">
          {assignedProjects.map(project => (
            <li key={project.id} className="bg-white rounded-xl shadow p-4">
              <div className="font-bold text-lg text-primary mb-2">{project.name}</div>
              <div className="text-dark/80 mb-1">Status: {project.status}</div>
              <div className="text-dark/60 text-sm">Completion Rate: {project.completion_rate}%</div>
              <div className="text-dark/60 text-sm">Daily Work Limit: {project.daily_work_limit} hours</div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
} 