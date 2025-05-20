import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiX, FiEye, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState([]);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/getsubscriptions.php');
      const data = await response.json();
      if (data.status === 'success') {
        const subscriptions = data.data.map(item => ({
          id: item.id,
          planName: item.planName,
          type: item.type,
          cost: item.cost,
          currency: item.currency || 'USD',
          status: item.status,
          cycle: item.cycle,
          nextDueDate: item.nextDueDate,
          domain: item.domain,
          customer: `${item.customer.firstName} ${item.customer.lastName}`.trim(),
          customerEmail: item.customer.email,
          customerPhone: item.customer.phone,
          startDate: item.startDate,
          method: item.method,
        }));
        setSubscriptionData(subscriptions);
        setFilteredData(subscriptions);
        calculateStats(subscriptions);
      } else {
        throw new Error(data.message || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      setError(err.message || 'Network error occurred while fetching subscriptions');
      toast.error(err.message || 'Failed to fetch subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

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

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.customer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    filterData(0); // Reset to "All Services" tab when searching
  };

  // Format date to DD/MM/YYYY for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Handle View action
  const handleView = (subscription) => {
    setSelectedSubscription(subscription);
    setShowModal(true);
    setShowEditModal(false);
    setDropdownOpen(null);
  };

  // Handle Edit action
  const handleEdit = (subscription) => {
    setEditForm({
      id: subscription.id,
      planName: subscription.planName,
      type: subscription.type,
      cost: subscription.cost,
      currency: subscription.currency || 'USD',
      status: subscription.status,
      cycle: subscription.cycle,
      nextDueDate: formatDateForInput(subscription.nextDueDate),
      domain: subscription.domain,
      customer: {
        firstName: subscription.customer.split(' ')[0] || '',
        lastName: subscription.customer.split(' ').slice(1).join(' ') || '',
        email: subscription.customerEmail,
        phone: subscription.customerPhone || '',
      },
      startDate: formatDateForInput(subscription.startDate),
      method: subscription.method || '',
    });
    setSelectedSubscription(subscription);
    setShowEditModal(true);
    setShowModal(false);
    setDropdownOpen(null);
  };

  // Handle Edit form changes
  const handleEditChange = (e, field, subField = null) => {
    const { value } = e.target;
    setEditForm((prev) => {
      if (subField) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subField]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Handle Edit submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await editSubscription(editForm);
  };

  // Edit subscription via API
  const editSubscription = async (subscription) => {
    setLoading(true);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/updatesubscriptions.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(result.message);
        setSubscriptionData((prev) =>
          prev.map((item) =>
            item.id === subscription.id
              ? {
                  ...item,
                  planName: subscription.planName,
                  type: subscription.type,
                  cost: parseFloat(subscription.cost),
                  currency: subscription.currency,
                  status: subscription.status,
                  cycle: subscription.cycle,
                  nextDueDate: subscription.nextDueDate,
                  domain: subscription.domain,
                  customer: `${subscription.customer.firstName} ${subscription.customer.lastName}`.trim(),
                  customerEmail: subscription.customer.email,
                  customerPhone: subscription.customer.phone,
                  startDate: subscription.startDate,
                  method: subscription.method,
                }
              : item
          )
        );
        setFilteredData((prev) =>
          prev.map((item) =>
            item.id === subscription.id
              ? {
                  ...item,
                  planName: subscription.planName,
                  type: subscription.type,
                  cost: parseFloat(subscription.cost),
                  currency: subscription.currency,
                  status: subscription.status,
                  cycle: subscription.cycle,
                  nextDueDate: subscription.nextDueDate,
                  domain: subscription.domain,
                  customer: `${subscription.customer.firstName} ${subscription.customer.lastName}`.trim(),
                  customerEmail: subscription.customer.email,
                  customerPhone: subscription.customer.phone,
                  startDate: subscription.startDate,
                  method: subscription.method,
                }
              : item
          )
        );
        calculateStats(subscriptionData);
        setShowEditModal(false);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to update subscription');
      console.error('Error updating subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete action
  const handleDelete = (subscription) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(subscription.id);
    }
    setDropdownOpen(null);
  };

  // Delete subscription via API
  const deleteSubscription = async (id) => {
    setLoading(true);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/deletesubscriptions.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(result.message);
        setSubscriptionData((prev) => prev.filter((item) => item.id !== id));
        setFilteredData((prev) => prev.filter((item) => item.id !== id));
        calculateStats(subscriptionData.filter((item) => item.id !== id));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to delete subscription');
      console.error('Error deleting subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (id, e) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 3;

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= maxVisiblePages - 1) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - (maxVisiblePages - 2)) {
        startPage = totalPages - (maxVisiblePages - 1);
      }

      if (startPage > 2) {
        pageNumbers.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Options for select fields
  const subscriptionTypeOptions = [
    { value: 'basic', label: 'Basic Subscription' },
    { value: 'standard', label: 'Standard Subscription' },
    { value: 'premium', label: 'Premium Subscription' },
    { value: 'enterprise', label: 'Enterprise Subscription' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound Sterling', symbol: '£' },
    { value: 'UGX', label: 'Ugandan Shilling', symbol: 'USh' },
  ];

  const billingCycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const paymentMethodOptions = [
    { value: '', label: 'Select payment method' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Expiring Soon', label: 'Expiring Soon' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <button
            onClick={() => navigate('/subscriptions/add')}
            className="mt-4 md:mt-0 bg-indigo-900 text-white font-medium rounded-md text-xs px-4 py-2 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Add Subscription
          </button>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full max-w-xs">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {[0, 1, 2, 3, 4, 5].map((tabIndex) => (
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
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => {
                            const status = getStatus(item.nextDueDate, item.status);
                            return (
                              <tr key={item.id}>
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
                                      <div className="text-sm text-gray-500">
                                        {item.customerEmail}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.currency} {item.cost.toFixed(2)}
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
                                      onClick={(e) => handleDropdownToggle(item.id, e)}
                                      className="focus:outline-none"
                                    >
                                      <FiMoreVertical
                                        className="text-gray-400 cursor-pointer hover:text-gray-600"
                                        size={16}
                                      />
                                    </button>
                                    {dropdownOpen === item.id && (
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
                                            Edit Service
                                          </button>
                                          <button
                                            onClick={() => handleDelete(item)}
                                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                            role="menuitem"
                                          >
                                            <FiTrash className="mr-2" size={16} />
                                            Delete Service
                                          </button>
                                        </div>
                                       </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                              No subscriptions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-6 px-6">
          <div className="text-xs text-gray-500 mb-4 md:mb-0">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-xs ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-900 text-white hover:bg-indigo-600'}`}
            >
              Prev
            </button>
            <div className="flex space-x-1">
              {getPageNumbers().map((number, index) => (
                <button
                  key={index}
                  onClick={() => typeof number === 'number' ? paginate(number) : null}
                  className={`px-3 py-1 rounded-md text-xs ${currentPage === number ? 'bg-indigo-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'} ${typeof number !== 'number' ? 'cursor-default' : ''}`}
                  disabled={number === '...'}
                >
                  {number}
                </button>
              ))}
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-xs ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-900 text-white hover:bg-indigo-600'}`}
            >
              Next
            </button>
          </div>
        </div>

        {/* View Modal */}
        {showModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="bg-indigo-900 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-bold">Service Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="bg-indigo-900 text-white px-3 pb-3 flex items-center">
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
                      <div className="text-gray-500">ID</div>
                      <div className="text-right font-medium">{selectedSubscription.id}</div>
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
              <div className="p-3 rounded-b-lg">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-xs"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="bg-indigo-900 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-bold">Edit Subscription</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="p-6 space-y-6">
                  {/* Subscription Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Subscription Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Service Name</label>
                        <input
                          type="text"
                          value={editForm.planName}
                          onChange={(e) => handleEditChange(e, 'planName')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Domain</label>
                        <input
                          type="text"
                          value={editForm.domain}
                          onChange={(e) => handleEditChange(e, 'domain')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Subscription Type</label>
                        <select
                          value={editForm.type}
                          onChange={(e) => handleEditChange(e, 'type')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          {subscriptionTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => handleEditChange(e, 'status')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          value={editForm.customer.firstName}
                          onChange={(e) => handleEditChange(e, 'customer', 'firstName')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          value={editForm.customer.lastName}
                          onChange={(e) => handleEditChange(e, 'customer', 'lastName')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editForm.customer.email}
                          onChange={(e) => handleEditChange(e, 'customer', 'email')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Phone (optional)</label>
                        <input
                          type="tel"
                          value={editForm.customer.phone}
                          onChange={(e) => handleEditChange(e, 'customer', 'phone')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Plan */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Subscription Plan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.cost}
                          onChange={(e) => handleEditChange(e, 'cost')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Currency</label>
                        <select
                          value={editForm.currency}
                          onChange={(e) => handleEditChange(e, 'currency')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          {currencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Billing Cycle</label>
                        <select
                          value={editForm.cycle}
                          onChange={(e) => handleEditChange(e, 'cycle')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          {billingCycleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Payment Method (optional)</label>
                        <select
                          value={editForm.method}
                          onChange={(e) => handleEditChange(e, 'method')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {paymentMethodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Subscription Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Start Date</label>
                        <input
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => handleEditChange(e, 'startDate')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Next Due Date</label>
                        <input
                          type="date"
                          value={editForm.nextDueDate}
                          onChange={(e) => handleEditChange(e, 'nextDueDate')}
                          className="mt-1 block w-full border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-b-lg flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-md text-xs hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-indigo-900 text-white font-medium rounded-md text-xs hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-xs shadow rounded-md text-white bg-indigo-900 transition ease-in-out duration-150 cursor-not-allowed">
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