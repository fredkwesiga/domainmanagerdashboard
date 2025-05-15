import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// API endpoints
const API_ENDPOINTS = {
  FETCH: 'https://goldenrod-cattle-809116.hostingersite.com/getNotifications.php',
  UPLOAD: 'https://goldenrod-cattle-809116.hostingersite.com/updateNotification.php',
  MARK: 'https://goldenrod-cattle-809116.hostingersite.com/markNotification.php',
  DELETE_HISTORY: 'https://goldenrod-cattle-809116.hostingersite.com/deleteHistoryItem.php',
  CLEAR_HISTORY: 'https://goldenrod-cattle-809116.hostingersite.com/clearHistory.php'
};

// Create context
const NotificationContext = createContext();

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  ACTION_NEEDED: 'action_needed'
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch notifications from the server
  const fetchNotifications = async (showHistoryParam = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching ${showHistoryParam ? 'history' : 'active'} notifications...`);
      
      const response = await axios.get(API_ENDPOINTS.FETCH, {
        params: {
          history: showHistoryParam ? 1 : 0 // Make sure to send as 1/0 instead of true/false
        }
      });
      
      console.log('Fetch response:', response.data);
      
      if (response.data.status === 'success') {
        if (showHistoryParam) {
          setNotificationHistory(response.data.data || []);
        } else {
          setNotifications(response.data.data || []);
        }
      } else {
        setError(response.data.message || 'Failed to fetch notifications');
        console.error('API error:', response.data.message);
      }
    } catch (error) {
      setError('Network error when fetching notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle between active notifications and history
  const toggleHistory = () => {
    setShowHistory(prev => !prev);
  };
  
  // Delete a single history item
  const deleteHistoryItem = async (id) => {
    try {
      // You would need to create this endpoint on your server
      const response = await axios.post(API_ENDPOINTS.DELETE_HISTORY, {
        notification_id: id
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setNotificationHistory(prev => 
          prev.filter(notification => notification.id !== id)
        );
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };
  
  // Clear all notification history
  const clearHistory = async () => {
    try {
      // You would need to create this endpoint on your server
      const response = await axios.post(API_ENDPOINTS.CLEAR_HISTORY);
      
      if (response.data.status === 'success') {
        // Clear local state
        setNotificationHistory([]);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };
  
  // Initial fetch of notifications
  useEffect(() => {
    console.log('Initial fetch of notifications');
    fetchNotifications(false);
    fetchNotifications(true);
    
    // Set up interval to periodically check for new notifications
    const intervalId = setInterval(() => {
      fetchNotifications(false);
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Add a new notification
  const addNotification = async ({
    type = NOTIFICATION_TYPES.INFO,
    message,
    domain_id = null,
    needsAction = false,
    repeat = false,
    daysUntilRepeat = 1
  }) => {
    try {
      console.log('Adding notification:', { type, message, domain_id, needsAction });
      
      const response = await axios.post(API_ENDPOINTS.UPLOAD, {
        type,
        message,
        domain_id,
        needs_action: needsAction ? 1 : 0,
        repeat,
        days_until_repeat: daysUntilRepeat
      });
      
      console.log('Add notification response:', response.data);
      
      if (response.data.status === 'success') {
        // Refresh notifications list
        fetchNotifications(false);
        
        // Show toast notification
        const toastId = toast[type === NOTIFICATION_TYPES.DANGER ? 'error' : 
                        type === NOTIFICATION_TYPES.WARNING ? 'warning' :
                        type === NOTIFICATION_TYPES.SUCCESS ? 'success' : 'info'](
          message,
          {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        );
        
        return response.data.notification_id;
      } else {
        console.error('Failed to add notification:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error adding notification:', error);
      return null;
    }
  };
  
  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      console.log('Marking notification as read:', id);
      
      const response = await axios.post(API_ENDPOINTS.MARK, {
        notification_id: id,
        action: 'read'
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: 1 } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      
      // Update each notification one by one
      const promises = notifications
        .filter(n => !n.is_read)
        .map(n => markAsRead(n.id));
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Mark a notification as acted upon
  const markAsActedUpon = async (id) => {
    try {
      console.log('Marking notification as acted upon:', id);
      
      const response = await axios.post(API_ENDPOINTS.MARK, {
        notification_id: id,
        action: 'acted_upon'
      });
      
      if (response.data.status === 'success') {
        // Refresh notifications list
        fetchNotifications(false);
        fetchNotifications(true);
      }
    } catch (error) {
      console.error('Error marking notification as acted upon:', error);
    }
  };
  
  // Remove a notification (dismiss it)
  const removeNotification = async (id) => {
    try {
      console.log('Removing notification:', id);
      
      const response = await axios.post(API_ENDPOINTS.MARK, {
        notification_id: id,
        action: 'dismiss'
      });
      
      if (response.data.status === 'success') {
        // Remove from current notifications list
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        // Refresh history
        fetchNotifications(true);
      }
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };
  
  // Notify when a domain is expiring soon
  const notifyDomainExpiring = (domain, daysRemaining) => {
    // Check if we already have an active notification for this domain
    const existingNotification = notifications.find(
      n => n.domain_id === domain.id && 
           n.type === NOTIFICATION_TYPES.ACTION_NEEDED &&
           !n.acted_upon
    );
    
    // If no existing notification, create a new one
    if (!existingNotification) {
      addNotification({
        type: NOTIFICATION_TYPES.ACTION_NEEDED,
        message: `${domain.domain_name} is expiring in ${daysRemaining} days`,
        domain_id: domain.id,
        needsAction: true,
        repeat: true,
        daysUntilRepeat: 1
      });
    }
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      notificationHistory,
      showHistory,
      isLoading,
      error,
      addNotification,
      markAsRead,
      markAllAsRead,
      markAsActedUpon,
      removeNotification,
      notifyDomainExpiring,
      fetchNotifications,
      toggleHistory,
      deleteHistoryItem,
      clearHistory
    }}>
      {children}
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
        style={{ zIndex: 9999 }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};