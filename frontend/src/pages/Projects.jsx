import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects,
  addProject,
  fetchEmployees,
  fetchProjectMembers,
  assignProjectMembers,
  removeProjectMember,
  updateProject
} from '../projectsSlice';
import { FiEdit } from 'react-icons/fi';
import { useAuthContext } from '../auth/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import { FiPlus } from 'react-icons/fi';

const STATUS_OPTIONS = [
  'Completed',
  'Running',
  'Draft',
  'Customer',
  'Churned',
];

function AddProjectModal({ isOpen, onClose, onSubmit, loading }) {
  const { user } = useAuthContext();
  const [form, setForm] = useState({
    name: '',
    status: STATUS_OPTIONS[0],
    completion_rate: 0,
    daily_work_limit: 0,
  });
  useEffect(() => {
    if (!isOpen) setForm({ name: '', status: STATUS_OPTIONS[0], completion_rate: 0, daily_work_limit: 0 });
  }, [isOpen]);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) await onSubmit({
      ...form,
      completion_rate: Number(form.completion_rate),
      daily_work_limit: Number(form.daily_work_limit),
      admin_id: user?.id,
      company_id: user?.company_id,
    });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-dark mb-6 text-center">Add New Project</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Project Name" required />
        <Select name="status" value={form.status} onChange={handleChange} required>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input name="completion_rate" type="number" min={0} max={100} value={form.completion_rate} onChange={handleChange} placeholder="Completion rate (%)" required />
        <Input name="daily_work_limit" type="number" min={0} value={form.daily_work_limit} onChange={handleChange} placeholder="Daily work limit (hours)" required />
        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? 'Adding...' : 'Add Project'}
        </Button>
      </form>
    </Modal>
  );
}

function AssignMembersModal({ isOpen, onClose, project, company_id }) {
  const dispatch = useDispatch();
  const employees = useSelector((state) => state.projects.employees);
  const members = useSelector((state) => state.projects.projectMembers[project?.id] || []);
  const membersLoading = useSelector((state) => state.projects.membersLoading);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (isOpen && company_id && project?.id) {
      dispatch(fetchEmployees(company_id));
      dispatch(fetchProjectMembers(project.id));
    }
  }, [isOpen, company_id, project, dispatch]);

  useEffect(() => {
    setSelected(members.map((m) => m.id));
  }, [members]);

  const handleToggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    // Find removed members
    const removed = members.filter((m) => !selected.includes(m.id));
    // Find newly added members
    const added = selected.filter((id) => !members.some((m) => m.id === id));
    // Remove unchecked members
    for (const m of removed) {
      await dispatch(removeProjectMember({ project_id: project.id, employee_id: m.id }));
    }
    // Add newly checked members
    if (added.length > 0) {
      await dispatch(assignProjectMembers({ project_id: project.id, employee_ids: added }));
    }
    dispatch(fetchProjectMembers(project.id));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-dark mb-4 text-center">Assign Members</h2>
      {membersLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(emp.id)}
                onChange={() => handleToggle(emp.id)}
              />
              <span>{emp.name} <span className="text-xs text-gray-400">({emp.email})</span></span>
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-6">
        <Button onClick={handleSave} className="bg-primary text-white flex-1">Save</Button>
        <Button onClick={onClose} className="bg-gray-200 flex-1">Cancel</Button>
      </div>
    </Modal>
  );
}

function EditProjectModal({ isOpen, onClose, project, onSave, loading }) {
  const [form, setForm] = useState({
    name: '',
    status: STATUS_OPTIONS[0],
    completion_rate: 0,
    daily_work_limit: 0,
  });
  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        status: project.status || STATUS_OPTIONS[0],
        completion_rate: project.completion_rate || 0,
        daily_work_limit: project.daily_work_limit || 0,
      });
    }
  }, [project, isOpen]);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave) await onSave(form);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-dark mb-6 text-center">Edit Project</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Project Name" required />
        <Select name="status" value={form.status} onChange={handleChange} required>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input name="completion_rate" type="number" min={0} max={100} value={form.completion_rate} onChange={handleChange} placeholder="Completion rate (%)" required />
        <Input name="daily_work_limit" type="number" min={0} value={form.daily_work_limit} onChange={handleChange} placeholder="Daily work limit (hours)" required />
        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}

// Avatar color palette for good contrast with theme (modern, subtle)
const AVATAR_COLORS = [
  "#3b82f6", // blue-500
  "#0ea5e9", // sky-500
  "#06b6d4", // cyan-500
  "#10b981", // green-500
  "#6366f1", // indigo-500
  "#64748b", // slate-500
  "#f59e42", // orange-400
  "#a21caf", // purple-700
  "#f43f5e", // rose-500
  "#eab308", // yellow-500
];
function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Projects() {
  const dispatch = useDispatch();
  const { user } = useAuthContext();
  const company_id = user?.company_id;
  const { items: projects, loading, projectMembers } = useSelector((state) => state.projects);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, project: null });
  const [editModal, setEditModal] = useState({ open: false, project: null });

  useEffect(() => {
    if (company_id) {
      dispatch(fetchProjects(company_id)).then((action) => {
        const projects = action.payload || [];
        projects.forEach((project) => {
          dispatch(fetchProjectMembers(project.id));
        });
      });
    }
  }, [dispatch, company_id]);

  // Filter projects for Time Reporter
  let visibleProjects = projects;
  if (user?.role === 'Time Reporter') {
    visibleProjects = projects.filter(
      project => (projectMembers[project.id] || []).some(emp => emp.id === user.id)
    );
  }

  const handleAddProject = async (form) => {
    await dispatch(addProject(form));
    setModalOpen(false);
  };

  const handleEditProject = async (form) => {
    if (!editModal.project) return;
    await dispatch(updateProject({ id: editModal.project.id, data: form }));
    setEditModal({ open: false, project: null });
  };

  const columns = [
    { key: 'name', label: 'Project Name' },
    { key: 'status', label: 'Status' },
    { key: 'members', label: 'Members' },
    { key: 'completion', label: 'Completion Rate' },
    { key: 'daily', label: 'Daily Limit' },
    { key: 'actions', label: '' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-dark mr-4">Projects</h2>
        {user?.role === 'Admin' && (
          <Button
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm font-semibold"
          >
            <FiPlus /> Add project
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        data={visibleProjects}
        emptyText="No projects found."
        renderRow={(project, i) => (
          <tr key={project.id} className="border-b hover:bg-gray-50">
            <td className="py-2 px-4">
              <div className="font-semibold">{project.name}</div>
              <div className="text-xs text-gray-400">{new Date(project.created_at).toLocaleDateString()}</div>
            </td>
            <td className="py-2 px-4">
              <span className={`px-2 py-1 rounded text-xs font-bold ${project.status === 'Completed' ? 'text-green-600 bg-green-100' : project.status === 'Running' ? 'text-blue-600 bg-blue-100' : project.status === 'Draft' ? 'text-yellow-600 bg-yellow-100' : project.status === 'Customer' ? 'text-emerald-600 bg-emerald-100' : 'text-gray-500 bg-gray-100'}`}>{project.status}</span>
            </td>
            <td className="py-2 px-4">
              <div className="flex items-center -space-x-2">
                {(projectMembers[project.id] || []).length === 0 ? (
                  user?.role === 'Admin' && (
                    <Button onClick={() => setAssignModal({ open: true, project })} className="px-2 py-1 text-xs bg-accent text-primary rounded">Assign Members</Button>
                  )
                ) : (
                  <>
                    {(projectMembers[project.id] || []).slice(0, 5).map((emp) => (
                      <div key={emp.id} className="relative group">
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-white text-white text-base font-bold uppercase"
                          style={{ background: getAvatarColor(emp.id || emp.name || '') }}
                        >
                          {emp.name ? emp.name.charAt(0) : '?'}
                        </div>
                        {user?.role === 'Admin' && (
                          <button
                            className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-0.5 shadow hidden group-hover:block"
                            title="Remove"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await dispatch(removeProjectMember({ project_id: project.id, employee_id: emp.id }));
                              dispatch(fetchProjectMembers(project.id));
                            }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {user?.role === 'Admin' && (
                      <Button onClick={() => setAssignModal({ open: true, project })} className="ml-2 text-sm bg-accent text-dark rounded">+</Button>
                    )}
                  </>
                )}
                {((projectMembers[project.id] || []).length > 5) && (
                  <span className="ml-2 text-xs text-gray-500 font-semibold">+{(projectMembers[project.id] || []).length - 5}</span>
                )}
              </div>
            </td>
            <td className="py-2 px-4">
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${project.completion_rate}%` }}></div>
                </div>
                <span className="text-xs font-semibold text-primary">{project.completion_rate}%</span>
              </div>
            </td>
            <td className="py-2 px-4">
              <span className="text-xs font-semibold text-dark">{project.daily_work_limit} hours / day</span>
            </td>
            <td className="py-2 px-4 text-right">
              <div className="flex gap-2 justify-end">
                {user?.role === 'Admin' && (
                  <Button onClick={() => setEditModal({ open: true, project })} className="px-2 py-1 text-xs bg-accent text-dark rounded"><FiEdit/></Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      {user?.role === 'Admin' && (
        <AddProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddProject} loading={loading} />
      )}
      {assignModal.open && user?.role === 'Admin' && (
        <AssignMembersModal
          isOpen={assignModal.open}
          onClose={() => setAssignModal({ open: false, project: null })}
          project={assignModal.project}
          company_id={company_id}
        />
      )}
      {editModal.open && user?.role === 'Admin' && (
        <EditProjectModal
          isOpen={editModal.open}
          onClose={() => setEditModal({ open: false, project: null })}
          project={editModal.project}
          onSave={handleEditProject}
          loading={loading}
        />
      )}
    </DashboardLayout>
  );
} 