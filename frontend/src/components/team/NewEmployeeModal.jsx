import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useAuthContext } from '../../auth/AuthContext';

export default function NewEmployeeModal({ isOpen, onClose, onSubmit, loading, error, success }) {
  const { user } = useAuthContext();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    role: 'Time Reporter', 
    assigned_email: user?.email || '', 
    company_id: user?.company_id || '' 
  });

  useEffect(() => {
    if (success) setForm({ 
      name: '', 
      email: '', 
      role: 'Time Reporter', 
      assigned_email: user?.email || '', 
      company_id: user?.company_id || '' 
    });
  }, [success, user]);

  useEffect(() => {
    // Update assigned_email and company_id if user changes (e.g., on login)
    setForm(f => ({ 
      ...f, 
      assigned_email: user?.email || '', 
      company_id: user?.company_id || '' 
    }));
  }, [user]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (onSubmit) await onSubmit(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-dark mb-6 text-center">Add New Employee</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Employee Name"
          required
        />
        <Input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Employee Email"
          required
        />
        <Select name="role" value={form.role} onChange={handleChange} required>
          <option value="Admin">Admin</option>
          <option value="Time Reporter">Time Reporter</option>
        </Select>
        {/* company_id and assigned_email are hidden but always sent */}
        <input type="hidden" name="company_id" value={form.company_id} />
        <input type="hidden" name="assigned_email" value={form.assigned_email} />
        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? 'Adding...' : 'Add Employee'}
        </Button>
        {error && <div className="text-center text-red-500 text-sm mt-2">{error}</div>}
        {success && <div className="text-center text-green-600 text-sm mt-2">Employee added and email sent!</div>}
      </form>
    </Modal>
  );
} 