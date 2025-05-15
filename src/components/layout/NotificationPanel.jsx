import React from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiClock,
} from "react-icons/fi";
import { useNotifications, NOTIFICATION_TYPES } from "./NotificationContext";

const NotificationPanel = ({ isMobile }) => {
  const {
    notifications,
    notificationHistory,
    showHistory,
    markAsRead,
    markAllAsRead,
    markAsActedUpon,
    removeNotification,
    toggleHistory,
    deleteHistoryItem,
    clearHistory,
  } = useNotifications();

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <FiCheckCircle className="text-green-500" size={18} />;
      case NOTIFICATION_TYPES.WARNING:
        return <FiAlertCircle className="text-yellow-500" size={18} />;
      case NOTIFICATION_TYPES.DANGER:
        return <FiAlertCircle className="text-red-500" size={18} />;
      case NOTIFICATION_TYPES.ACTION_NEEDED:
        return <FiAlertCircle className="text-red-500" size={18} />;
      default:
        return <FiInfo className="text-blue-500" size={18} />;
    }
  };

  // Handle notification click - mark as read but don't close panel
  const handleNotificationClick = (notification, e) => {
    e.stopPropagation();
    markAsRead(notification.id);
  };

  // Handle notification action
  const handleNotificationAction = (notification, e) => {
    e.stopPropagation();
    markAsActedUpon(notification.id);

    // Navigate to domain page if domain related
    if (notification.domain) {
      console.log(`Navigating to domain: ${notification.domain.domainName}`);
      // In a real app, you would use react-router here:
      // navigate(`/domains/${notification.domain.id}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Stop propagation for panel clicks
  const handlePanelClick = (e) => {
    e.stopPropagation();
  };

  // Responsive classes for the panel
  const panelClasses = isMobile
    ? "fixed inset-x-0 top-16 mx-0 w-full border-0 rounded-none shadow-lg z-50"
    : "w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200";

  return (
    <div
      className={`bg-white ${panelClasses}`}
      onClick={handlePanelClick}
      aria-label="Notifications panel"
    >
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHistory();
            }}
            className={`text-xs ${
              showHistory ? "text-gray-700 font-bold" : "text-gray-500"
            } hover:text-gray-700`}
            aria-pressed={showHistory}
          >
            History
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHistory();
            }}
            className={`text-xs ${
              !showHistory ? "text-gray-700 font-bold" : "text-gray-500"
            } hover:text-gray-700`}
            aria-pressed={!showHistory}
          >
            Notifications
          </button>
        </div>

        {!showHistory ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
            aria-label="Mark all as read"
          >
            Mark all as read
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearHistory();
            }}
            className="text-xs text-red-600 hover:text-red-800"
            aria-label="Clear history"
          >
            Clear history
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {!showHistory ? (
          // Current notifications
          notifications.length === 0 ? (
            <div className="p-4 text-xs text-center text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                  !notification.read ? "bg-indigo-50" : ""
                }`}
                onClick={(e) => handleNotificationClick(notification, e)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start">
                  <div className="mt-1 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs ${
                        !notification.read
                          ? "font-medium text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.timestamp)}
                    </p>

                    {notification.needs_action && (
                      <button
                        onClick={(e) =>
                          handleNotificationAction(notification, e)
                        }
                        className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        aria-label="Take action"
                      >
                        Take action
                      </button>
                    )}
                  </div>
                  <div>
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      aria-label="Dismiss notification"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          // Notification history
          notificationHistory.length === 0 ? (
            <div className="p-4 text-xs text-center text-gray-500">
              No notification history
            </div>
          ) : (
            notificationHistory.map((notification) => (
              <div
                key={notification.id}
                className="p-3 border-b border-gray-100 hover:bg-gray-50 opacity-75"
              >
                <div className="flex items-start">
                  <div className="mt-1 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">{notification.message}</p>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        {formatDate(notification.timestamp)}
                      </p>
                      <p className="text-xs text-gray-400 italic">
                        {notification.dismissReason || "read"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(notification.id);
                      }}
                      aria-label="Delete from history"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;