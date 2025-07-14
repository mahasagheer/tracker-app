import React from 'react';
import TeamFilterDropdown from './TeamFilterDropdown';
import DateRangePicker from './DateRangePicker';
import TeamAvatarGroup from './TeamAvatarGroup';
import AddMembersButton from './AddMembersButton';
import ViewSwitch from './ViewSwitch';

export default function LeaderboardHeader({ setModalOpen, view, setView }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <h2 className="text-xl font-bold text-dark mr-4">Leaderboard</h2>
        <TeamFilterDropdown />
     {/**   <DateRangePicker />*/} 
      </div>
      <div className="flex items-center gap-2">
      {/** <TeamAvatarGroup /> */} 
        <AddMembersButton onClick={() => setModalOpen(true)} />
        <ViewSwitch view={view} setView={setView} />
      </div>
    </div>
  );
} 