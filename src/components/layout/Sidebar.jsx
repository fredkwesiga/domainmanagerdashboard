import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiMenu, 
  FiChevronLeft,
  FiHome,
  FiGlobe,
  FiPlus,
  FiClock,
  FiAlertCircle,
  FiSettings,
  FiLogOut,
  FiBox,
  FiUser,
  FiServer,
  FiCreditCard,
  FiPackage,
  FiDollarSign,
  FiGift
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const userRole = localStorage.getItem('userRole') || 'admin';
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions')) || {};
  console.log('Sidebar: User permissions:', userPermissions);
  
  const handleToggle = () => {
    toggleSidebar(!isOpen, true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPermissions');
    window.location.href = '/login';
  };

  const domainMenuItems = [
    { icon: FiHome, label: 'Dashboard', to: '/', permission: 'dashboard' },
    { icon: FiBox, label: 'Packages', to: '/packages', permission: 'domains' },
    { icon: FiGlobe, label: 'All Domains', to: '/domains', permission: 'domains' },
    // { icon: FiPlus, label: 'Add Domain', to: '/domains/add', permission: 'domains' },
    { icon: FiClock, label: 'Expiring Soon', to: '/expiring', permission: 'domains' },
    { icon: FiAlertCircle, label: 'Expired Domains', to: '/expired', permission: 'domains' },
    { icon: FiServer, label: 'Hosting', to: '/hosting', permission: 'hosting' },
    // { icon: FiCreditCard, label: 'Subscription', to: '/subscriptions', permission: 'subscriptions' },
    { icon: FiPackage, label: 'Domain & Hosting', to: '/domain-and-hosting', permission: 'domains' },
    { icon: FiCreditCard, label: 'Subscription', to: '/expense-sync', permission: 'expenseSync' },
    { icon: FiGift, label: 'Birthdays', to: '/birthdays', permission: 'birthdays' }
  ];

  const adminItems = [
    { icon: FiSettings, label: 'Settings', to: '/settings', permission: 'settings' }
  ];

  // Filter menu items based on permissions
  const filteredDomainMenuItems = domainMenuItems.filter(item => 
    userRole === 'superadmin' || (item.permission && userPermissions[item.permission])
  );

  const filteredAdminItems = adminItems.filter(item => 
    userRole === 'superadmin' || (item.permission && userPermissions[item.permission])
  );

  return (
    <aside 
      className={`
        bg-white text-black
        fixed left-0 top-0 bottom-0
        ${isOpen ? 'w-64' : 'w-16'}
        transition-all duration-300 ease-in-out
        shadow-lg border-r border-gray-200
        flex flex-col z-40
        ${window.innerWidth < 768 && !isOpen ? '-translate-x-full' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {isOpen && <h1 className="text-lg font-bold text-gray-800 truncate">Domain Manager</h1>}
        <button 
          onClick={handleToggle}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <FiChevronLeft size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Navigation - Scrollable section */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Domain Management Section */}
        <div className="mb-6">
          {isOpen && <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Management</h2>}
          <nav className="space-y-5 px-2">
            {filteredDomainMenuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) => 
                  `flex items-center px-2 py-2 rounded-md ${
                    isActive 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className={`flex-shrink-0 ${isOpen ? 'mr-3' : 'mx-auto'}`} size={20} />
                {isOpen && <span className="text-sm">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      {/* <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`mt-3 flex items-center text-sm text-gray-600 w-full px-2 py-2 rounded-md hover:bg-gray-100 ${
            !isOpen ? 'justify-center' : ''
          }`}
        >
          <FiLogOut className="flex-shrink-0" size={16} />
          {isOpen && <span className="ml-2">Logout</span>}
        </button>
      </div> */}
    </aside>
  );
};

export default Sidebar;