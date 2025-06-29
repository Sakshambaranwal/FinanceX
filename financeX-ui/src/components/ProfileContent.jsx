import React, { useContext } from 'react';
import { User } from 'lucide-react';
import { AppContext } from '../AppContext';  
  
  const ProfileContent = () => {

    const context = useContext(AppContext);
    const { setIsAuthenticated } = context;
    const handleLogout = () => {
      sessionStorage.removeItem('jwt'); // Remove JWT from sessionStorage
      setIsAuthenticated(false); // Update authentication state
    };
    return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile</h2>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={40} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Saksham Baranwal</h3>
            <p className="text-gray-600">saksham.baranwal@email.com</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="font-medium">Account Settings</span>
            <button className="text-blue-600">Edit</button>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="font-medium">Security</span>
            <button className="text-blue-600">Manage</button>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="font-medium">Notifications</span>
            <button className="text-blue-600">Configure</button>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="font-medium">Privacy</span>
            <button className="text-blue-600">Settings</button>
          </div>
        </div>
        
        <button 
          onClick= {handleLogout}
          className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-semibold"
        >
          Sign Out
        </button>
      </div>
    </div>
    );
};

  export default ProfileContent;