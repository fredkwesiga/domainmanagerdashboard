import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiX, FiEye, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Mock subscription data with professional tech tools
const mockSubscriptionData = [
  {
    planName: 'Figma Professional',
    type: 'Monthly',
    cost: 12.00,
    status: 'Active',
    cycle: 'Monthly',
    nextDueDate: '2025-06-15',
    domain: 'design.example.com',
    customer: 'Alice Thompson',
    customerEmail: 'alice@techco.com',
    customerPhone: '+1234567890',
    startDate: '2024-06-15',
    method: 'Credit Card',
  },
  {
    planName: 'Slack Pro',
    type: 'Annual',
    cost: 87.00, // $7.25/user/month * 12 months
    status: 'Expiring Soon',
    cycle: 'Yearly',
    nextDueDate: '2025-05-12',
    domain: 'teamchat.example.com',
    customer: 'Bob Martinez',
    customerEmail: 'bob@techco.com',
    customerPhone: '+1987654321',
    startDate: '2024-05-12',
    method: 'PayPal',
  },
  {
    planName: 'AWS EC2 Instance',
    type: 'Monthly',
    cost: 100.00,
    status: 'Expired',
    cycle: 'Monthly',
    nextDueDate: '2025-04-10',
    domain: 'cloud.example.com',
    customer: 'Clara Nguyen',
    customerEmail: 'clara@techco.com',
    customerPhone: '+1122334455',
    startDate: '2024-04-10',
    method: 'Bank Transfer',
  },
  {
    planName: 'GitHub Enterprise',
    type: 'Annual',
    cost: 252.00, // $21/user/month * 12 months
    status: 'Active',
    cycle: 'Yearly',
    nextDueDate: '2025-07-01',
    domain: 'code.example.com',
    customer: 'David Kim',
    customerEmail: 'david@techco.com',
    customerPhone: '+1098765432',
    startDate: '2024-07-01',
    method: 'Credit Card',
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(mockSubscriptionData);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    expired: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Calculate statistics for tabs
  const calculateStats = (data) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let activeCount = 0;
    let expiring7Days = 0;
    let expiring30Days = 0;
    let expiredCount = 0;
    let cancelledCount = 0;

    data.forEach((item) => {
      const dueDate = new Date(item.nextDueDate);
      const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      if (item.status === 'Cancelled') {
        cancelledCount++;
      } else if (daysSinceDue > 0) {
        expiredCount++;
      } else if (dueDate <= sevenDaysFromNow && dueDate > now) {
        expiring7Days++;
      } else if (dueDate <= thirtyDaysFromNow && dueDate > sevenDaysFromNow) {
        expiring30Days++;
      } else if (dueDate > now) {
        activeCount++;
      }
    });

    setStats({
      total: data.length,
      active: activeCount,
      expiring7Days,
      expiring30Days,
      expired: expiredCount,
      cancelled: cancelledCount,
    });
  };

  // Determine status dynamically
  const getStatus = (nextDueDate, status) => {
    if (status === 'Cancelled') {
      return { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' };
    }
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dueDate = new Date(nextDueDate);
    const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    if (daysSinceDue > 0) {
      return { text: 'Expired', color: 'bg-yellow-100 text-yellow-800' };
    } else if (dueDate <= sevenDaysFromNow && dueDate > now) {
      return { text: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    } else if (dueDate <= thirtyDaysFromNow && dueDate > sevenDaysFromNow) {
      return { text: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    }
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  // Filter data based on selected tab
  const filterData = (tabIndex) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let filtered = [];
    switch (tabIndex) {
      case 0: // All Services
        filtered = subscriptionData;
        break;
      case 1: // Active
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          return dueDate > now && item.status !== 'Cancelled';
        });
        break;
      case 2: // Expiring in 7 Days
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          return dueDate <= sevenDaysFromNow && dueDate > now && item.status !== 'Cancelled';
        });
        break;
      case 3: // Expiring in 30 Days
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          return (
            dueDate <= thirtyDaysFromNow &&
            dueDate > sevenDaysFromNow &&
            item.status !== 'Cancelled'
          );
        });
        break;
      case 4: // Expired
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          return daysSinceDue > 0 && item.status !== 'Cancelled';
        });
        break;
      case 5: // Cancelled
        filtered = subscriptionData.filter((item) => item.status === 'Cancelled');
        break;
      default:
        filtered = subscriptionData;
    }
    setFilteredData(filtered);
  };

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = subscriptionData.filter(
      (item) =>
        item.planName.toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query) ||
        item.customer.toLowerCase().includes(query)
    );
    setFilteredData(filtered);
    calculateStats(filtered);
  };

  // Format date to DD/MM/YYYY for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Format date to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  };

  // API-Ready Functions
  const addSubscription = async (newSubscription) => {
    setLoading(true);
    try {
      console.log('Adding subscription:', newSubscription);
      setSubscriptionData([...subscriptionData, newSubscription]);
      calculateStats([...subscriptionData, newSubscription]);
      filterData(0);
      toast.success('Service added successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
      return newSubscription;
    } catch (err) {
      setError(err.message || 'Failed to add service');
      toast.error('Failed to add service', {
        position: 'top-right',
        autoClose: 2000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editSubscription = async (updatedSubscription) => {
    setLoading(true);
    try {
      console.log('Editing subscription:', updatedSubscription);
      const updatedData = subscriptionData.map((item) =>
        item.planName === updatedSubscription.planName ? updatedSubscription : item
      );
      setSubscriptionData(updatedData);
      calculateStats(updatedData);
      filterData(0);
      toast.success('Service updated successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
      return updatedSubscription;
    } catch (err) {
      setError(err.message || 'Failed to edit service');
      toast.error('Failed to edit service', {
        position: 'top-right',
        autoClose: 2000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (planName) => {
    setLoading(true);
    try {
      console.log('Deleting subscription:', planName);
      const updatedData = subscriptionData.filter((item) => item.planName !== planName);
      setSubscriptionData(updatedData);
      calculateStats(updatedData);
      filterData(0);
      toast.success('Service deleted successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (err) {
      setError(err.message || 'Failed to delete service');
      toast.error('Failed to delete service', {
        position: 'top-right',
        autoClose: 2000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle View action
  const handleView = (subscription) => {
    setSelectedSubscription(subscription);
    setShowModal(true);
    setDropdownOpen(null);
  };

  // Handle Edit action
  const handleEdit = (subscription) => {
    setEditingSubscription({
      ...subscription,
      customerFirstName: subscription.customer.split(' ')[0],
      customerLastName: subscription.customer.split(' ')[1] || '',
      primaryEmail: subscription.customerEmail,
      primaryPhone: subscription.customerPhone,
    });
    setShowEditModal(true);
    setDropdownOpen(null);
  };

  // Handle Edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingSubscription((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Edit form submission
  const handleEditSubmit = async () => {
    try {
      const updatedSubscription = {
        ...editingSubscription,
        customer: `${editingSubscription.customerFirstName} ${editingSubscription.customerLastName}`.trim(),
        customerEmail: editingSubscription.primaryEmail,
        customerPhone: editingSubscription.primaryPhone,
      };
      await editSubscription(updatedSubscription);
      setShowEditModal(false);
      setEditingSubscription(null);
    } catch (err) {
      // Error is handled in editSubscription
    }
  };

  // Handle Delete action
  const handleDelete = async (planName) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteSubscription(planName);
        setDropdownOpen(null);
      } catch (err) {
        // Error is handled in deleteSubscription
      }
    }
  };

  // Handle Add New Service button
  const handleAddNewSubscription = () => {
    navigate('/subscriptions/add');
  };

  // Handle dropdown toggle with debugging
  const handleDropdownToggle = (planName, e) => {
    e.stopPropagation();
    console.log('Dropdown clicked for:', planName); // Debug click
    setDropdownOpen(dropdownOpen === planName ? null : planName);
  };

  useEffect(() => {
    setFilteredData(subscriptionData);
    calculateStats(subscriptionData);
  }, [subscriptionData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        </div>

        {/* Search and Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="relative w-full max-w-xs">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleAddNewSubscription}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add New Service
            </button>
          </div>

          {/* Tabs */}
          <Tab.Group onChange={(index) => filterData(index)}>
            <Tab.List className="border-b border-gray-200 flex space-x-1 px-6">
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-sm font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                All Services ({stats.total})
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-sm font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                Active ({stats.active})
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-sm font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                Expiring in 7 Days ({stats.expiring7Days})
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-sm font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                Expiring in 30 Days ({stats.expiring30Days})
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-sm font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                Expired ({stats.expired})
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-sm font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                Cancelled ({stats.cancelled})
              </Tab>
            </Tab.List>

            <Tab.Panels>
              {Array.from({ length: 6 }).map((_, tabIndex) => (
                <Tab.Panel key={tabIndex}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item, index) => {
                          const status = getStatus(item.nextDueDate, item.status);
                          return (
                            <tr key={`${item.planName}-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                                    {item.planName.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.planName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${item.cost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                                >
                                  {status.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    onClick={(e) => handleDropdownToggle(item.planName, e)}
                                    className="focus:outline-none"
                                  >
                                    <FiMoreVertical
                                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                                      size={16}
                                    />
                                  </button>
                                  {dropdownOpen === item.planName && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                      <div className="py-1" role="menu" aria-orientation="vertical">
                                        <button
                                          onClick={() => handleView(item)}
                                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                          role="menuitem"
                                        >
                                          <FiEye className="mr-2" size={16} />
                                          View Details
                                        </button>
                                        <button
                                          onClick={() => handleEdit(item)}
                                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                          role="menuitem"
                                        >
                                          <FiEdit className="mr-2" size={16} />
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDelete(item.planName)}
                                          className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                                          role="menuitem"
                                        >
                                          <FiTrash className="mr-2" size={16} />
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* View Modal */}
        {showModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              {/* Header */}
              <div className="bg-indigo-800 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-bold">Service Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Service status badge and name */}
              <div className="bg-indigo-800 text-white px-3 pb-3 flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatus(
                    selectedSubscription.nextDueDate,
                    selectedSubscription.status
                  ).color}`}
                >
                  {getStatus(selectedSubscription.nextDueDate, selectedSubscription.status).text}
                </span>
                <span className="text-lg ml-2">{selectedSubscription.planName}</span>
              </div>

              {/* Service Information Section */}
              <div className="p-4">
                <div className="flex items-start mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg
                      className="w-5 h-5 text-indigo-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Service Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Domain</div>
                      <div className="text-right font-medium">{selectedSubscription.domain}</div>
                      <div className="text-gray-500">Cycle</div>
                      <div className="text-right font-medium">{selectedSubscription.cycle}</div>
                      <div className="text-gray-500">Start Date</div>
                      <div className="text-right font-medium">
                        {formatDate(selectedSubscription.startDate)}
                      </div>
                      <div className="text-gray-500">Next Due Date</div>
                      <div className="text-right font-medium">
                        {formatDate(selectedSubscription.nextDueDate)}
                      </div>
                      <div className="text-gray-500">Payment Method</div>
                      <div className="text-right font-medium">{selectedSubscription.method}</div>
                    </div>
                  </div>
                </div>

                {/* Customer Information Section */}
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <svg
                      className="w-5 h-5 text-purple-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Name</div>
                      <div className="text-right font-medium">{selectedSubscription.customer}</div>
                      <div className="text-gray-500">Email</div>
                      <div className="text-right font-medium truncate">
                        {selectedSubscription.customerEmail}
                      </div>
                      <div className="text-gray-500">Phone</div>
                      <div className="text-right font-medium">
                        {selectedSubscription.customerPhone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer button */}
              <div className="p-3 rounded-b-lg">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 bg-indigo-800 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Edit Service</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Service Name</label>
                    <input
                      type="text"
                      name="planName"
                      value={editingSubscription.planName}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Domain</label>
                    <input
                      type="text"
                      name="domain"
                      value={editingSubscription.domain}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">Customer First Name</label>
                      <input
                        type="text"
                        name="customerFirstName"
                        value={editingSubscription.customerFirstName}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">Customer Last Name</label>
                      <input
                        type="text"
                        name="customerLastName"
                        value={editingSubscription.customerLastName}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      name="primaryEmail"
                      value={editingSubscription.primaryEmail}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Phone</label>
                    <input
                      type="text"
                      name="primaryPhone"
                      value={editingSubscription.primaryPhone}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Cost</label>
                    <input
                      type="number"
                      name="cost"
                      value={editingSubscription.cost}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Type</label>
                    <select
                      name="type"
                      value={editingSubscription.type}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Cycle</label>
                    <select
                      name="cycle"
                      value={editingSubscription.cycle}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Next Due Date</label>
                    <input
                      type="date"
                      name="nextDueDate"
                      value={formatDateForInput(editingSubscription.nextDueDate)}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Payment Method</label>
                    <select
                      name="method"
                      value={editingSubscription.method}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="w-full py-2 bg-indigo-800 hover:bg-indigo-900 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-900 transition ease-in-out duration-150 cursor-not-allowed">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;