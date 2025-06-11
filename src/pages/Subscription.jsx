import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiX, FiEye, FiEdit, FiTrash, FiMoreVertical, FiEdit2 } from 'react-icons/fi';
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
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [itemsPerPage] = useState(10);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/getsubscriptions.php');
      const data = await response.json();
      if (data.status === 'success') {
        const subscriptions = data.data.map(item => ({
          id: item.id,
          planName: item.planName || '',
          cost: item.cost || 0,
          currency: item.currency || 'USD',
          status: item.status || '',
          cycle: item.cycle || '',
          nextDueDate: item.nextDueDate || '',
          domain: item.domain || '',
          customer: `${item.customer.firstName} ${item.customer.lastName}`.trim(),
          customerEmail: item.customer.email || '',
          customerPhone: item.customer.phone || '',
          startDate: item.startDate || '',
          method: item.method || '',
          note: item.note || '',
        }));
        console.log('Fetched subscriptions:', subscriptions); // Debug log
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
    let redemptionCount = 0;

    data.forEach((item) => {
      const dueDate = new Date(item.nextDueDate);
      const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      if (item.status === 'Redemption') {
        redemptionCount++;
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
      cancelled: redemptionCount,
    });
  };

  const getStatus = (nextDueDate, status) => {
    if (status === 'Redemption') {
      return { text: 'Redemption', color: 'bg-red-100 text-red-800' };
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

  const filterData = (tabIndex) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let filtered = [];
    switch (tabIndex) {
      case 0:
        filtered = subscriptionData;
        break;
      case 1:
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          return dueDate > now && item.status !== 'Cancelled';
        });
        break;
      case 2:
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          return dueDate <= sevenDaysFromNow && dueDate > now && item.status !== 'Cancelled';
        });
        break;
      case 3:
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          return (
            dueDate <= thirtyDaysFromNow &&
            dueDate > sevenDaysFromNow &&
            item.status !== 'Cancelled'
          );
        });
        break;
      case 4:
        filtered = subscriptionData.filter((item) => {
          const dueDate = new Date(item.nextDueDate);
          const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          return daysSinceDue > 0 && item.status !== 'Cancelled';
        });
        break;
      case 5:
        filtered = subscriptionData.filter((item) => item.status === 'Cancelled');
        break;
      default:
        filtered = subscriptionData;
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.customer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    filterData(0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleView = (subscription) => {
    setSelectedSubscription({
      ...subscription,
      note: subscription.note || '',
      invoiceStatus: subscription.invoiceStatus || false,
    });
    setShowModal(true);
    setShowEditModal(false);
    setDropdownOpen(null);
  };

  const handleEdit = (subscription) => {
    console.log('Editing subscription:', subscription);
    setEditForm({
      id: subscription.id || 0,
      planName: subscription.planName || '',
      type: subscription.type || 'N/A', // Use actual type with fallback
      cost: subscription.cost || 0,
      currency: subscription.currency || 'USD',
      status: subscription.status || 'Active',
      cycle: subscription.cycle || '',
      nextDueDate: formatDateForInput(subscription.nextDueDate) || '',
      domain: subscription.domain || '',
      customer: {
        firstName: subscription.customer.split(' ')[0] || '',
        lastName: subscription.customer.split(' ').slice(1).join(' ') || '',
        email: subscription.customerEmail || '',
        phone: subscription.customerPhone || '',
      },
      startDate: formatDateForInput(subscription.startDate) || '',
      method: subscription.method || '',
      note: subscription.note || '',
      invoiceStatus: subscription.invoiceStatus || false,
    });
    setNote(subscription.note || '');
    setShowNoteInput(!!subscription.note);
    setSelectedSubscription(subscription);
    setShowEditModal(true);
    setShowModal(false);
    setDropdownOpen(null);
  };

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

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    setEditForm((prev) => ({
      ...prev,
      note: e.target.value,
    }));
  };

  const handleRemoveNote = async () => {
    if (!window.confirm('Are you sure you want to remove this note?')) {
      return;
    }
    setLoading(true);
    try {
      const updatedSubscription = { ...editForm, note: '' };
      await editSubscription(updatedSubscription, true);
      setSelectedSubscription((prev) => ({ ...prev, note: '' }));
      setNote('');
      setShowNoteInput(false);
    } catch (err) {
      toast.error('Failed to remove note');
      console.error('Error removing note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await editSubscription({ ...editForm, note });
  };

  const editSubscription = async (subscription, isNoteRemoval = false) => {
    setLoading(true);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/updatesubscriptions.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subscription.id,
          planName: subscription.planName,
          type: subscription.type,
          cost: subscription.cost,
          currency: subscription.currency,
          status: subscription.status,
          cycle: subscription.cycle,
          nextDueDate: subscription.nextDueDate,
          domain: subscription.domain,
          customer: {
            firstName: subscription.customer.firstName,
            lastName: subscription.customer.lastName,
            email: subscription.customer.email,
            phone: subscription.customer.phone,
          },
          startDate: subscription.startDate,
          method: subscription.method,
          note: subscription.note,
          invoiceStatus: subscription.invoiceStatus,
        }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        const originalSubscription = subscriptionData.find((item) => item.id === subscription.id);
        const wasNoteAdded = !originalSubscription.note && subscription.note;
        const wasNoteUpdated = originalSubscription.note && subscription.note && originalSubscription.note !== subscription.note;
        const wasNoteRemoved = originalSubscription.note && !subscription.note;

        if (isNoteRemoval || wasNoteRemoved) {
          toast.success('Note has been removed');
        } else if (wasNoteAdded) {
          toast.success('Note Added Successfully');
        } else if (wasNoteUpdated) {
          toast.success('Note Updated Successfully');
        } else {
          toast.success(result.message || 'Subscription updated successfully');
        }

        const updatedData = subscriptionData.map((item) =>
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
                note: subscription.note,
                invoiceStatus: subscription.invoiceStatus,
              }
            : item
        );

        setSubscriptionData(updatedData);
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
                  note: subscription.note,
                  invoiceStatus: subscription.invoiceStatus,
                }
              : item
          )
        );
        calculateStats(updatedData);
        setShowEditModal(false);
      } else {
        toast.error(result.message || 'Failed to update subscription');
      }
    } catch (err) {
      toast.error('Failed to update subscription');
      console.error('Error updating subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (subscription) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(subscription.id);
    }
    setDropdownOpen(null);
  };

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
        const updatedData = subscriptionData.filter((item) => item.id !== id);
        setSubscriptionData(updatedData);
        setFilteredData(updatedData);
        calculateStats(updatedData);
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

  const handleDropdownToggle = (id, e) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const subscriptionTypeOptions = [
    { value: 'N/A', label: 'N/A' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
    { value: 'enterprise', label: 'Enterprise' },
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <button
            onClick={() => navigate('/subscriptions/add')}
            className="mt-4 md:mt-0 bg-indigo-900 text-white font-medium rounded-md text-xs px-4 py-2 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Add Subscription
          </button>
        </div>

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
                Redemption ({stats.cancelled})
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
                            console.log('Rendering item:', item); // Debug log
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
                                  {item.cycle} 
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

       {showModal && selectedSubscription && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      <div className="bg-indigo-900 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Subscription Details</h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-center">
          <span
            className={`inline-flex items-center px-5 py-1 rounded-full text-xs font-medium ${getStatus(selectedSubscription.nextDueDate, selectedSubscription.status).color}`}
          >
            {getStatus(selectedSubscription.nextDueDate, selectedSubscription.status).text}
          </span>
          <span className="ml-2 text-xs text-white/90">
            {selectedSubscription.planName}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
        <div className="dark:bg-indigo-900 p-5 rounded-xl">
          <div className="flex items-center mb-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Subscription Information
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Plan Name
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.planName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Type
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.cycle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Domain
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.domain}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Cost
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.currency} {selectedSubscription.cost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Billing Cycle
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.cycle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Payment Method
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.method || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Invoice Status
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedSubscription.invoiceStatus
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedSubscription.invoiceStatus ? 'Invoiced' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="dark:bg-indigo-900 p-5 rounded-xl">
          <div className="flex items-center mb-3">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Customer Information
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.customer}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </span>
              <a
                href={`mailto:${selectedSubscription.customerEmail}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {selectedSubscription.customerEmail}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Phone
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedSubscription.customerPhone || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="dark:bg-indigo-900 p-5 rounded-xl">
          <div className="flex items-center mb-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Subscription Dates
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Start Date
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(selectedSubscription.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Next Due Date
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(selectedSubscription.nextDueDate)}
              </span>
            </div>
          </div>
        </div>

        {selectedSubscription.note && (
          <div className="dark:bg-yellow-900/50 p-5 rounded-xl">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-lg mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-between w-full">
                Note
                <button
                  onClick={handleRemoveNote}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center"
                >
                  <FiTrash className="mr-1" size={14} /> Remove
                </button>
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedSubscription.note}
            </p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          className="w-full bg-indigo-900 text-xs font-semibold text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setShowModal(false)}
        >
          Close Overview
        </button>
      </div>
    </div>
  </div>
)}

        {showEditModal && editForm && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg mb-4">Edit Subscription</h2>
      <form
        onSubmit={handleEditSubmit}
      >
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700">
            Plan Name
          </label>
          <input
            type="text"
            className="w-full mt-1 p-2 border text-xs font-semibold rounded-md bg-gray-100"
            value={editForm.planName}
            disabled
          />
        </div>

        <div className="flex w-full justify-between gap-5">
          <div className="mb-4 w-full">
            <label className="block text-xs font-medium text-gray-700">
              Customer First Name
            </label>
            <input
              type="text"
              className="w-full mt-1 p-2 text-xs border rounded-md"
              value={editForm.customer.firstName}
              onChange={(e) => handleEditChange(e, 'customer', 'firstName')}
              required
            />
          </div>
          <div className="mb-4 w-full">
            <label className="block text-xs font-medium text-gray-700">
              Customer Last Name
            </label>
            <input
              type="text"
              className="w-full mt-1 p-2 text-xs border rounded-md"
              value={editForm.customer.lastName}
              onChange={(e) => handleEditChange(e, 'customer', 'lastName')}
              required
            />
          </div>
        </div>

        <div className="flex w-full justify-between gap-5">
          <div className="mb-4 w-full">
            <label className="block text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full mt-1 p-2 text-xs border rounded-md"
              value={editForm.customer.email}
              onChange={(e) => handleEditChange(e, 'customer', 'email')}
              required
            />
          </div>
          <div className="mb-4 w-full">
            <label className="block text-xs font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              className="w-full mt-1 p-2 text-xs border rounded-md"
              value={editForm.customer.phone}
              onChange={(e) => handleEditChange(e, 'customer', 'phone')}
            />
          </div>
        </div>

        <div className="flex w-full justify-between gap-5">
          <div className="mb-4 w-full">
            <label className="block text-xs font-medium text-gray-700">
              Next Due Date
            </label>
            <input
              type="date"
              className="w-full mt-1 p-2 text-xs border rounded-md"
              value={editForm.nextDueDate}
              onChange={(e) => handleEditChange(e, 'nextDueDate')}
              required
            />
          </div>
        </div>

        <div className="mb-4 w-full">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Invoice Status
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              checked={editForm.invoiceStatus || false}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  invoiceStatus: e.target.checked,
                })
              }
            />
            <span className="ml-2 text-xs text-gray-700">
              {editForm.invoiceStatus ? "Invoiced" : "Not Invoiced"}
            </span>
          </div>
        </div>

        <div className="mb-4 w-full">
          <button
            type="button"
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <FiEdit2 className="mr-1" size={14} /> {showNoteInput ? 'Hide Note' : 'Add Note'}
          </button>
          {showNoteInput && (
            <div className="mt-2">
              <textarea
                className="w-full mt-1 p-2 text-xs border rounded-md"
                value={note}
                onChange={handleNoteChange}
                rows="3"
                placeholder="e.g., Invoice was sent but email bounced"
              />
            </div>
          )}
        </div>

        <div className="mt-4 w-full justify-between flex gap-5">
          <button
            type="button"
            className="ml-2 bg-gray-600 text-xs font-semibold text-white px-4 py-2 rounded-md w-full"
            onClick={() => setShowEditModal(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-900 text-xs font-semibold text-white px-4 py-2 rounded-md w-full flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

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