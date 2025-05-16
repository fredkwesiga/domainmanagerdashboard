import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiX, FiEye, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Mock data (hard-coded)
const mockHostingData = [
  {
    id: 'H001',
    name: 'example.com',
    ownerEmail: 'user1@example.com',
    owner: 'John Doe',
    type: 'Shared',
    package: 'Basic',
    startDate: '2024-06-15',
    dates: { expiryDate: '2025-06-15' },
    status: 'Active',
    invoiceStatus: 'Invoiced',
  },
  {
    id: 'H002',
    name: 'testsite.com',
    ownerEmail: 'user2@example.com',
    owner: 'Jane Smith',
    type: 'VPS',
    package: 'Standard',
    startDate: '2024-05-12',
    dates: { expiryDate: '2025-05-12' },
    status: 'Expiring Soon',
    invoiceStatus: 'Pending',
  },
  {
    id: 'H003',
    name: 'demo.net',
    ownerEmail: 'user3@example.com',
    owner: 'Bob Johnson',
    type: 'Dedicated',
    package: 'Premium',
    startDate: '2024-04-10',
    dates: { expiryDate: '2025-04-10' },
    status: 'Expired',
    invoiceStatus: 'Paid',
  },
];

const Hosting = () => {
  const navigate = useNavigate();
  const [hostingData, setHostingData] = useState(mockHostingData);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    expired: 0,
    redemption: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedHosting, setSelectedHosting] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHosting, setEditingHosting] = useState(null);
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
    let redemptionCount = 0;

    data.forEach((item) => {
      const expiryDate = new Date(item.dates.expiryDate);
      const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));

      if (daysSinceExpiry > 30) {
        redemptionCount++;
      } else if (daysSinceExpiry > 0) {
        expiredCount++;
      } else if (expiryDate <= sevenDaysFromNow && expiryDate > now) {
        expiring7Days++;
      } else if (expiryDate <= thirtyDaysFromNow && expiryDate > sevenDaysFromNow) {
        expiring30Days++;
      } else if (expiryDate > now) {
        activeCount++;
      }
    });

    setStats({
      total: data.length,
      active: activeCount,
      expiring7Days,
      expiring30Days,
      expired: expiredCount,
      redemption: redemptionCount,
    });
  };

  // Determine status dynamically
  const getStatus = (expiryDate) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expDate = new Date(expiryDate);
    const daysSinceExpiry = Math.floor((now - expDate) / (1000 * 60 * 60 * 24));

    if (daysSinceExpiry > 30) {
      return { text: 'Redemption', color: 'bg-red-100 text-red-800' };
    } else if (daysSinceExpiry > 0) {
      return { text: 'Expired', color: 'bg-yellow-100 text-yellow-800' };
    } else if (expDate <= sevenDaysFromNow && expDate > now) {
      return { text: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    } else if (expDate <= thirtyDaysFromNow && expDate > sevenDaysFromNow) {
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
      case 0: // All Hosting
        filtered = hostingData;
        break;
      case 1: // Active
        filtered = hostingData.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate > now;
        });
        break;
      case 2: // Expiring in 7 Days
        filtered = hostingData.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate <= sevenDaysFromNow && expiryDate > now;
        });
        break;
      case 3: // Expiring in 30 Days
        filtered = hostingData.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > sevenDaysFromNow;
        });
        break;
      case 4: // Expired
        filtered = hostingData.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
          return daysSinceExpiry > 0 && daysSinceExpiry <= 30;
        });
        break;
      case 5: // Redemption
        filtered = hostingData.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
          return daysSinceExpiry > 30;
        });
        break;
      default:
        filtered = hostingData;
    }
    setFilteredData(filtered);
  };

  useEffect(() => {
    // Set initial data and calculate stats
    setFilteredData(hostingData);
    calculateStats(hostingData);
  }, []);

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
  const addHosting = async (newHosting) => {
    setLoading(true);
    try {
      console.log('Adding hosting:', newHosting);
      const data = { ...newHosting, id: `H${(hostingData.length + 1).toString().padStart(3, '0')}` };
      setHostingData([...hostingData, data]);
      calculateStats([...hostingData, data]);
      filterData(0);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to add hosting');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editHosting = async (updatedHosting) => {
    setLoading(true);
    try {
      console.log('Editing hosting:', updatedHosting);
      const updatedData = hostingData.map((item) =>
        item.id === updatedHosting.id ? updatedHosting : item
      );
      setHostingData(updatedData);
      calculateStats(updatedData);
      filterData(0);
      return updatedHosting;
    } catch (err) {
      setError(err.message || 'Failed to edit hosting');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteHosting = async (id) => {
    setLoading(true);
    try {
      console.log('Deleting hosting with id:', id);
      const updatedData = hostingData.filter((item) => item.id !== id);
      setHostingData(updatedData);
      calculateStats(updatedData);
      filterData(0);
    } catch (err) {
      setError(err.message || 'Failed to delete hosting');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle View action
  const handleView = (hosting) => {
    setSelectedHosting(hosting);
    setShowModal(true);
    setDropdownOpen(null);
  };

  // Handle Edit action
  const handleEdit = (hosting) => {
    setEditingHosting({
      ...hosting,
      dates: { ...hosting.dates },
      ownerFirstName: hosting.owner.split(' ')[0],
      ownerLastName: hosting.owner.split(' ')[1] || '',
      primaryEmail: hosting.ownerEmail,
      backupEmail: hosting.ownerEmail.replace('@', '.backup@'),
      primaryPhone: '+11234567890',
      backupPhone: '+10987654321',
    });
    setShowEditModal(true);
    setDropdownOpen(null);
  };

  // Handle Edit form changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'expiryDate') {
      setEditingHosting((prev) => ({
        ...prev,
        dates: { ...prev.dates, expiryDate: value },
      }));
    } else if (name === 'invoiceStatus') {
      setEditingHosting((prev) => ({
        ...prev,
        invoiceStatus: checked ? 'Invoiced' : 'Pending',
      }));
    } else {
      setEditingHosting((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle Edit form submission
  const handleEditSubmit = async () => {
    try {
      const updatedHosting = {
        ...editingHosting,
        owner: `${editingHosting.ownerFirstName} ${editingHosting.ownerLastName}`.trim(),
        ownerEmail: editingHosting.primaryEmail,
      };
      await editHosting(updatedHosting);
      setShowEditModal(false);
      setEditingHosting(null);
    } catch (err) {
      // Error is handled in editHosting
    }
  };

  // Handle Delete action
  const handleDelete = async (id) => {
    try {
      await deleteHosting(id);
      setDropdownOpen(null);
    } catch (err) {
      // Error is handled in deleteHosting
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hosting</h1>
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
                placeholder="Search hosting..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => navigate('/hosting/add')}
            >
              + Add New Hosting
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
                All Hosting ({stats.total})
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
                Redemption ({stats.redemption})
              </Tab>
            </Tab.List>

            <Tab.Panels>
              {/* All Hosting */}
              <Tab.Panel>
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
                          Hosted Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hosting Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item) => {
                        const status = getStatus(item.dates.expiryDate);
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
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.dates.expiryDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <FiMoreVertical
                                  className="text-gray-400 cursor-pointer"
                                  size={16}
                                  onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                                />
                                {dropdownOpen === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                      <button
                                        onClick={() => handleView(item)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        role="menuitem"
                                      >
                                        <FiEye className="mr-2" size={16} />
                                        View Status
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
                                        onClick={() => handleDelete(item.id)}
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

              {/* Active */}
              <Tab.Panel>
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
                          Hosted Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hosting Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item) => {
                        const status = getStatus(item.dates.expiryDate);
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
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.dates.expiryDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <FiMoreVertical
                                  className="text-gray-400 cursor-pointer"
                                  size={16}
                                  onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                                />
                                {dropdownOpen === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                      <button
                                        onClick={() => handleView(item)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        role="menuitem"
                                      >
                                        <FiEye className="mr-2" size={16} />
                                        View Status
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
                                        onClick={() => handleDelete(item.id)}
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

              {/* Expiring in 7 Days */}
              <Tab.Panel>
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
                          Hosted Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hosting Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item) => {
                        const status = getStatus(item.dates.expiryDate);
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
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.dates.expiryDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <FiMoreVertical
                                  className="text-gray-400 cursor-pointer"
                                  size={16}
                                  onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                                />
                                {dropdownOpen === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                      <button
                                        onClick={() => handleView(item)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        role="menuitem"
                                      >
                                        <FiEye className="mr-2" size={16} />
                                        View Status
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
                                        onClick={() => handleDelete(item.id)}
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

              {/* Expiring in 30 Days */}
              <Tab.Panel>
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
                          Hosted Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hosting Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item) => {
                        const status = getStatus(item.dates.expiryDate);
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
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.dates.expiryDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <FiMoreVertical
                                  className="text-gray-400 cursor-pointer"
                                  size={16}
                                  onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                                />
                                {dropdownOpen === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                      <button
                                        onClick={() => handleView(item)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        role="menuitem"
                                      >
                                        <FiEye className="mr-2" size={16} />
                                        View Status
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
                                        onClick={() => handleDelete(item.id)}
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

              {/* Expired */}
              <Tab.Panel>
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
                          Hosted Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hosting Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item) => {
                        const status = getStatus(item.dates.expiryDate);
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
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.dates.expiryDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <FiMoreVertical
                                  className="text-gray-400 cursor-pointer"
                                  size={16}
                                  onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                                />
                                {dropdownOpen === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                      <button
                                        onClick={() => handleView(item)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        role="menuitem"
                                      >
                                        <FiEye className="mr-2" size={16} />
                                        View Status
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
                                        onClick={() => handleDelete(item.id)}
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

              {/* Redemption */}
              <Tab.Panel>
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
                          Hosted Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hosting Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item) => {
                        const status = getStatus(item.dates.expiryDate);
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
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.dates.expiryDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <FiMoreVertical
                                  className="text-gray-400 cursor-pointer"
                                  size={16}
                                  onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                                />
                                {dropdownOpen === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                      <button
                                        onClick={() => handleView(item)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        role="menuitem"
                                      >
                                        <FiEye className="mr-2" size={16} />
                                        View Status
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
                                        onClick={() => handleDelete(item.id)}
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
            </Tab.Panels>
          </Tab.Group>
        </div>

{/* View Modal */}
{showModal && selectedHosting && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
      {/* Header */}
      <div className="bg-indigo-800 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h2 className="text-xl font-bold">Hosting Status</h2>
        <button
          onClick={() => setShowModal(false)}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          <FiX size={20} />
        </button>
      </div>
      
      {/* Domain status badge and name */}
      <div className="bg-indigo-800 text-white px-3 pb-3 flex items-center">
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
          {getStatus(selectedHosting.dates.expiryDate).text}
        </span>
        <span className="text-lg">{selectedHosting.name}</span>
      </div>
      
      {/* Domain Information Section */}
      <div className="p-4">
        <div className="flex items-start mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            <svg className="w-5 h-5 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Hosting Information</h3>
            
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Package</div>
              <div className="text-right font-medium">{selectedHosting.package}</div>
              
              <div className="text-gray-500">Start Date</div>
              <div className="text-right font-medium">{formatDate(selectedHosting.dates.startDate)}</div>
              
              <div className="text-gray-500">Expiry Date</div>
              <div className="text-right font-medium">{formatDate(selectedHosting.dates.expiryDate)}</div>
              
              <div className="text-gray-500">Invoice Status</div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {selectedHosting.invoiceStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Owner Information Section */}
        <div className="flex items-start">
          <div className="bg-purple-100 p-2 rounded-lg mr-3">
            <svg className="w-5 h-5 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Owner Information</h3>
            
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Name</div>
              <div className="text-right font-medium">{selectedHosting.ownerFirstName} {selectedHosting.ownerLastName}</div>
              
              <div className="text-gray-500">Primary Email</div>
              <div className="text-right font-medium truncate">{selectedHosting.primaryEmail}</div>
              
              <div className="text-gray-500">Backup Email</div>
              <div className="text-right font-medium truncate">{selectedHosting.backupEmail}</div>
              
              <div className="text-gray-500">Primary Phone</div>
              <div className="text-right font-medium">{selectedHosting.primaryPhone}</div>
              
              <div className="text-gray-500">Backup Phone</div>
              <div className="text-right font-medium">{selectedHosting.backupPhone}</div>
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
          Close Overview
        </button>
      </div>
    </div>
  </div>
)}

        {/* Edit Modal */}
{showEditModal && editingHosting && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Edit Hosting</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Hosting Name</label>
            <input
              type="text"
              name="name"
              value={editingHosting.name}
              onChange={handleEditChange}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Owner First Name</label>
              <input
                type="text"
                name="ownerFirstName"
                value={editingHosting.ownerFirstName}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Owner Last Name</label>
              <input
                type="text"
                name="ownerLastName"
                value={editingHosting.ownerLastName}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Primary Email</label>
              <input
                type="email"
                name="primaryEmail"
                value={editingHosting.primaryEmail}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Backup Email</label>
              <input
                type="email"
                name="backupEmail"
                value={editingHosting.backupEmail}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Primary Phone</label>
              <input
                type="text"
                name="primaryPhone"
                value={editingHosting.primaryPhone}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Backup Phone</label>
              <input
                type="text"
                name="backupPhone"
                value={editingHosting.backupPhone}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm mb-1">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formatDateForInput(editingHosting.dates.expiryDate)}
              onChange={handleEditChange}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="invoiceStatus"
              name="invoiceStatus"
              checked={editingHosting.invoiceStatus === 'Invoiced'}
              onChange={handleEditChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="invoiceStatus" className="ml-2 block text-sm text-gray-700">Invoiced</label>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm mb-1">Package</label>
            <input
              type="text"
              name="package"
              value={editingHosting.package}
              onChange={handleEditChange}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-0.5">To change the package, please contact customer service.</p>
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

export default Hosting;