import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DashboardLayout from '../components/layout/DashboardLayout';
import LeaderboardHeader from '../components/team/LeaderboardHeader';
import LeaderboardTable from '../components/team/LeaderboardTable';
import LeaderboardCardList from '../components/team/LeaderboardCardList';
import NewEmployeeModal from '../components/team/NewEmployeeModal';
import { addEmployee, resetAddEmployeeState } from '../auth/authSlice';
import { useAuthContext } from '../auth/AuthContext';

export default function Team() {
  const [modalOpen, setModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const dispatch = useDispatch();
  const { addEmployeeLoading, addEmployeeError, addEmployeeSuccess } = useSelector(state => state.auth);
  const { user } = useAuthContext();

  useEffect(() => {
    async function fetchEmployees() {
      if (user?.id) {
        const res = await fetch(`/api/employees/admin/${user.id}`);
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    }
    fetchEmployees();
  }, [user]);

  const handleAddEmployee = async (form) => {
    await dispatch(addEmployee(form));
  };

  const handleModalClose = () => {
    setModalOpen(false);
    dispatch(resetAddEmployeeState());
  };

  return (
    <DashboardLayout>
      {/* <div className="flex justify-end mb-4">
        <AddMembersButton onClick={() => setModalOpen(true)} />
      </div> */}
      <LeaderboardHeader setModalOpen={setModalOpen} view={viewMode} setView={setViewMode} />
      {viewMode === 'table' ? (
        <LeaderboardTable employees={employees} />
      ) : (
        <LeaderboardCardList employees={employees} />
      )}
      <NewEmployeeModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleAddEmployee}
        loading={addEmployeeLoading}
        error={addEmployeeError}
        success={addEmployeeSuccess}
      />
    </DashboardLayout>
  );
} 