import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  FiBell,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiHome,
  FiGlobe,
  FiPlus,
  FiClock,
  FiAlertCircle,
  FiX,
  FiMenu,
} from "react-icons/fi";
import { useNotifications } from "./NotificationContext";
import NotificationPanel from "./NotificationPanel";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MainLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { notifications } = useNotifications();
  const location = useLocation();

  // Retrieve user data from localStorage
  const userRole = localStorage.getItem('userRole') || 'admin';
  const userName = localStorage.getItem('userName') || 'User'; // Fetch the user's name
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com'; // Fetch the user's email

  const getCurrentPageInfo = () => {
    const path = location.pathname;

    const routes = [
      { path: "/", title: "Dashboard", icon: FiHome },
      { path: "/domains", title: "All Domains", icon: FiGlobe },
      { path: "/domains/add", title: "Add Domain", icon: FiPlus },
      { path: "/expiring", title: "Expiring Soon", icon: FiClock },
      { path: "/expired", title: "Expired Domains", icon: FiAlertCircle },
      { path: "/hosting", title: "Hosting", icon: FiGlobe },
      { path: "/subscriptions", title: "Subscriptions", icon: FiGlobe },
      { path: "/hosting-and-subscriptions", title: "Hosting & Subscriptions", icon: FiGlobe },
    ];

    const currentRoute = routes.find((route) => route.path === path);
    return currentRoute || { title: "Domain Manager", icon: FiGlobe };
  };

  const toggleSidebar = (newState, isManual = false) => {
    setSidebarOpen(newState);
    if (isManual) {
      setManuallyToggled(true);
    }
  };

  const handleLogout = () => {
    try {
      console.log('handleLogout called');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName'); // Clear the name as well
      localStorage.removeItem('userPermissions');
      setShowUserMenu(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      const notificationButton = document.querySelector(".notification-button");
      const userButton = document.querySelector(".user-button");
      const userMenu = document.querySelector(".user-menu");
      const notificationPanel = document.querySelector(".notification-panel");

      if (
        (showNotifications &&
          notificationButton &&
          !notificationButton.contains(e.target) &&
          notificationPanel &&
          !notificationPanel.contains(e.target)) ||
        (showUserMenu &&
          userButton &&
          !userButton.contains(e.target) &&
          userMenu &&
          !userMenu.contains(e.target))
      ) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const isCurrentlyMobile = windowWidth < 768;
      setIsMobile(isCurrentlyMobile);

      if (!manuallyToggled) {
        setSidebarOpen(!isCurrentlyMobile);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [manuallyToggled]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setShowNotifications(false);
      setShowUserMenu(false);
    }
  }, [location, isMobile]);

  const contentClass = sidebarOpen ? "md:ml-64" : "md:ml-16";

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-30"
          onClick={() => toggleSidebar(false, true)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <header className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-20 shadow-sm">
        <div className="flex-1"></div>

        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Help">
            <FiHelpCircle size={20} className="text-gray-600" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                if (showUserMenu) setShowUserMenu(false);
              }}
              className="notification-button p-2 rounded-full hover:bg-gray-100 relative"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <FiBell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 z-50 notification-panel"
                onClick={(e) => e.stopPropagation()}
              >
                <NotificationPanel isMobile={isMobile} />
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
                if (showNotifications) setShowNotifications(false);
              }}
              className="user-button flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
              aria-label="User menu"
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                <FiUser size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {userName} {/* Display the actual name */}
              </span>
            </button>

            {showUserMenu && (
              <div
                className={`absolute right-0 mt-2 ${
                  isMobile ? 'w-64' : 'w-48'
                } bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 user-menu`}
              >
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">
                    {userName} {/* Display the actual name */}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userEmail} {/* Display the actual email */}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      console.log('Navigating to /profile');
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  {userRole === 'superadmin' && (
                    <button
                      onClick={() => {
                        console.log('Navigating to /settings');
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                  )}
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => {
                      console.log('Sign out clicked');
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`transition-all duration-300 ${contentClass} pt-16`}>
        <main className="p-6">
          <Outlet />
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            toastClassName="rounded-lg shadow-md"
            progressClassName="bg-gradient-to-r from-blue-500 to-blue-600"
          />
        </main>
      </div>

      {isMobile && (
        <button
          onClick={() => toggleSidebar(!sidebarOpen, true)}
          className={`
            fixed bottom-6 right-6 p-3 bg-gray-800 text-white rounded-full z-40
            shadow-2xl hover:shadow-xl
            transition-all duration-300 ease-in-out
            transform hover:scale-105
          `}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? (
            <FiX
              size={20}
              className="transition-transform duration-300 transform"
            />
          ) : (
            <FiMenu
              size={20}
              className="transition-transform duration-300 transform"
            />
          )}
        </button>
      )}
    </div>
  );
};

export default MainLayout;