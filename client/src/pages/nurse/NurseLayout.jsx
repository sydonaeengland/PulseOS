import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NurseLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(to right, #C9A84C, #00B37E)' }} />
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <span className="text-lg font-bold text-[#1B4F72]">Nurse Portal</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#64748B]">{user?.first_name} {user?.last_name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-[#64748B] hover:text-[#1B4F72] transition"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
