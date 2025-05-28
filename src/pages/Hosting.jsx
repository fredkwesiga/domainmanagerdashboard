import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiX, FiEye, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Hosting = () => {
  const navigate = useNavigate();
  const [hostingData, setHostingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    expired: 0,
    redemption: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedHosting, setSelectedHosting] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch hosting data from API
  const fetchHosting = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/gethosting.php');
      const data = await response.json();
      if (data.status === 'success') {
        const formattedData = data.data.map(item => ({
          id: item.id,
          domainName: item.hosted_domain,
          hostingType: item.hosting_type,
          owner: {
            firstName: item.owner_first_name,
            lastName: item.owner_last_name
          },
          contact: {
            email1: item.primary_email,
            email2: item.backup_email || '',
            phone1: item.primary_phone || '',
            phone2: item.backup_phone || ''
          },
          dates: {
            startDate: item.start_date,
            expiryDate: item.expiry_date
          },
          package: item.package_id,
          amount: item.amount,
          currency: item.currency,
          invoiceStatus: !!item.invoice_status, // Ensure boolean
          serverDetails: {
            ipAddress: item.ip_address || '',
            nameservers: [item.nameserver1 || '', item.nameserver2 || ''],
            diskSpace: item.disk_space || '',
            bandwidth: item.bandwidth || ''
          }
        }));
        setHostingData(formattedData);
        calculateStats(formattedData);
        setFilteredData(formattedData);
      } else {
        setError(data.message || 'Failed to fetch hosting');
        toast.error(data.message || 'Failed to fetch hosting');
      }
    } catch (err) {
      setError('Network error occurred while fetching hosting');
      toast.error('Network error occurred while fetching hosting');
      console.error('Error fetching hosting:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosting();
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

  // Filter data based on selected tab and search query
  const filterData = (tabIndex) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let filtered = hostingData.filter(item => {
      if (!searchQuery) return true;
      return (
        item.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${item.owner.firstName} ${item.owner.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contact.email1.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hostingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.package.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    switch (tabIndex) {
      case 0: // All Hosting
        break;
      case 1: // Active
        filtered = filtered.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate > now;
        });
        break;
      case 2: // Expiring in 7 Days
        filtered = filtered.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate <= sevenDaysFromNow && expiryDate > now;
        });
        break;
      case 3: // Expiring in 30 Days
        filtered = filtered.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > sevenDaysFromNow;
        });
        break;
      case 4: // Expired
        filtered = filtered.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
          return daysSinceExpiry > 0 && daysSinceExpiry <= 30;
        });
        break;
      case 5: // Redemption
        filtered = filtered.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
          return daysSinceExpiry > 30;
        });
        break;
      default:
        break;
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    filterData(0); // Reset to "All Hosting" tab when searching
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
    return date.toISOString().split('T')[0];
  };

  // Handle View action
  const handleView = (hosting) => {
    setSelectedHosting(hosting);
    setShowModal(true);
    setDropdownOpen(null);
  };

  // Handle Edit action
  const handleEdit = (hosting) => {
    setSelectedHosting(hosting);
    setFormData({
      id: hosting.id,
      domainName: hosting.domainName,
      hostingType: hosting.hostingType,
      firstName: hosting.owner.firstName,
      lastName: hosting.owner.lastName,
      email1: hosting.contact.email1,
      email2: hosting.contact.email2,
      phone1: hosting.contact.phone1,
      phone2: hosting.contact.phone2,
      startDate: hosting.dates.startDate,
      expiryDate: hosting.dates.expiryDate,
      package: hosting.package,
      amount: hosting.amount,
      currency: hosting.currency,
      invoiceStatus: hosting.invoiceStatus,
      ipAddress: hosting.serverDetails.ipAddress,
      nameserver1: hosting.serverDetails.nameservers[0],
      nameserver2: hosting.serverDetails.nameservers[1],
      diskSpace: hosting.serverDetails.diskSpace,
      bandwidth: hosting.serverDetails.bandwidth
    });
    setEditModalOpen(true);
    setDropdownOpen(null);
  };

  // Handle Delete action
  const handleDelete = (hosting) => {
    setSelectedHosting(hosting);
    setDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedHosting) return;
    setIsDeleting(true);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/deletehosting.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedHosting.id })
      });
      const data = await response.json();
      if (data.status === 'success') {
        await fetchHosting();
        setDeleteModalOpen(false);
        setSelectedHosting(null);
        toast.success('Hosting deleted successfully!', {
          position: 'top-right',
          autoClose: 2000,
        });
      } else {
        setError(data.message || 'Failed to delete hosting');
        toast.error(data.message || 'Failed to delete hosting', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    } catch (err) {
      setError('Network error occurred while deleting hosting');
      toast.error('Network error occurred while deleting hosting', {
        position: 'top-right',
        autoClose: 2000,
      });
      console.error('Error deleting hosting:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form input changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateEditForm = () => {
    const errors = {};
    if (!formData.domainName.trim()) errors.domainName = 'Hosted Domain is required';
    if (!formData.hostingType.trim()) errors.hostingType = 'Hosting Type is required';
    if (!formData.firstName.trim()) errors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last Name is required';
    if (!formData.email1.trim()) {
      errors.email1 = 'Primary Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email1)) {
      errors.email1 = 'Invalid email format';
    }
    if (!formData.startDate) errors.startDate = 'Start Date is required';
    if (!formData.expiryDate) errors.expiryDate = 'Expiry Date is required';
    if (!formData.package.trim()) errors.package = 'Package is required';
    if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid Amount is required';
    if (!formData.currency.trim()) errors.currency = 'Currency is required';
    return errors;
  };

  // Handle form submission for updating hosting
  const handleUpdateHosting = async (e) => {
    e.preventDefault();
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix form errors before submitting', {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }

    const submissionData = {
      id: formData.id,
      domainName: formData.domainName,
      hostingType: formData.hostingType,
      owner: {
        firstName: formData.firstName,
        lastName: formData.lastName
      },
      contact: {
        email1: formData.email1,
        email2: formData.email2 || '',
        phone1: formData.phone1 || '',
        phone2: formData.phone2 || ''
      },
      dates: {
        startDate: formData.startDate,
        expiryDate: formData.expiryDate
      },
      package: formData.package,
      amount: formData.amount,
      currency: formData.currency,
      invoiceStatus: formData.invoiceStatus, // Send boolean value
      serverDetails: {
        ipAddress: formData.ipAddress || '',
        nameservers: [formData.nameserver1 || '', formData.nameserver2 || ''],
        diskSpace: formData.diskSpace || '',
        bandwidth: formData.bandwidth || ''
      }
    };

    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/updatehosting.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });
      const data = await response.json();
      if (data.status === 'success') {
        await fetchHosting();
        setEditModalOpen(false);
        setFormData(null);
        setFormErrors({});
        toast.success('Hosting updated successfully!', {
          position: 'top-right',
          autoClose: 2000,
        });
      } else {
        setError(data.message || 'Failed to update hosting');
        toast.error(data.message || 'Failed to update hosting', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    } catch (err) {
      setError('Network error occurred while updating hosting');
      toast.error('Network error occurred while updating hosting', {
        position: 'top-right',
        autoClose: 2000,
      });
      console.error('Error updating hosting:', err);
    }
  };

  // Pagination logic
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hosting</h1>
          <button
            className="mt-4 md:mt-0 bg-indigo-900 text-white font-medium rounded-md text-xs px-4 py-2 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => navigate('/hosting/add')}
          >
            + Add New Hosting
          </button>
        </div>

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
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => {
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
                                      <div className="text-sm font-medium text-gray-900">{item.domainName}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hostingType}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                                  >
                                    {status.text}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.dates.expiryDate)}</td>
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
                                            onClick={() => handleDelete(item)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
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
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                              No hosting records found.
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

        <div className="flex flex-col md:flex-row items-center justify-between mt-4">
          <div className="text-xs text-gray-500 mb-4 md:mb-0">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-xs ${
                currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-900 text-white hover:bg-indigo-600'
              }`}
            >
              Prev
            </button>
            <div className="flex space-x-1">
              {getPageNumbers().map((number, index) => (
                <button
                  key={index}
                  onClick={() => typeof number === 'number' && paginate(number)}
                  className={`px-3 py-1 rounded-md text-xs ${
                    currentPage === number
                      ? 'bg-indigo-900 text-white'
                      : number === '...'
                      ? 'bg-white text-gray-700 cursor-default'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={number === '...'}
                >
                  {number}
                </button>
              ))}
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-xs ${
                currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-900 text-white hover:bg-indigo-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {showModal && selectedHosting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="bg-indigo-800 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-bold">Hosting Status</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="bg-indigo-800 text-white px-3 pb-3 flex items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                  {getStatus(selectedHosting.dates.expiryDate).text}
                </span>
                <span className="text-lg">{selectedHosting.domainName}</span>
              </div>
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedHosting.invoiceStatus
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedHosting.invoiceStatus ? 'Invoiced' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-gray-500">Amount</div>
                      <div className="text-right font-medium">{selectedHosting.currency} {selectedHosting.amount}</div>
                      <div className="text-gray-500">IP Address</div>
                      <div className="text-right font-medium">{selectedHosting.serverDetails.ipAddress || '-'}</div>
                      <div className="text-gray-500">Disk Space</div>
                      <div className="text-right font-medium">{selectedHosting.serverDetails.diskSpace || '-'}</div>
                      <div className="text-gray-500">Bandwidth</div>
                      <div className="text-right font-medium">{selectedHosting.serverDetails.bandwidth || '-'}</div>
                    </div>
                  </div>
                </div>
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
                      <div className="text-right font-medium">{`${selectedHosting.owner.firstName} ${selectedHosting.owner.lastName}`}</div>
                      <div className="text-gray-500">Primary Email</div>
                      <div className="text-right font-medium truncate">{selectedHosting.contact.email1}</div>
                      <div className="text-gray-500">Backup Email</div>
                      <div className="text-right font-medium truncate">{selectedHosting.contact.email2 || '-'}</div>
                      <div className="text-gray-500">Primary Phone</div>
                      <div className="text-right font-medium">{selectedHosting.contact.phone1 || '-'}</div>
                      <div className="text-gray-500">Backup Phone</div>
                      <div className="text-right font-medium">{selectedHosting.contact.phone2 || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
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

        {editModalOpen && formData && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg mb-4">Edit Hosting</h2>
              <form onSubmit={handleUpdateHosting}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700">Hosted Domain</label>
                  <input
                    type="text"
                    name="domainName"
                    value={formData.domainName}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g., example.com"
                    className="w-full mt-1 p-2 border text-xs font-semibold rounded-md bg-gray-100"
                    disabled
                  />
                  {formErrors.domainName && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.domainName}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700">Hosting Type</label>
                  <input
                    type="text"
                    name="hostingType"
                    value={formData.hostingType}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g., Shared"
                    className="w-full mt-1 p-2 text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formErrors.hostingType && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.hostingType}</p>
                  )}
                </div>

                <div className="flex w-full justify-between gap-5">
                  <div className="mb-4 w-full">
                    <label className="block text-xs font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g., John"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="mb-4 w-full">
                    <label className="block text-xs font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g., Doe"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700">Primary Email</label>
                  <input
                    type="email"
                    name="email1"
                    value={formData.email1}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g., john.doe@example.com"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formErrors.email1 && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.email1}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700">Backup Email (Optional)</label>
                  <input
                    type="email"
                    name="email2"
                    value={formData.email2}
                    onChange={handleEditChange}
                    placeholder="e.g., backup@example.com"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex w-full justify-between gap-5">
                  <div className="mb-4 w-full">
                    <label className="block text-xs font-medium text-gray-700">Primary Phone</label>
                    <input
                      type="tel"
                      name="phone1"
                      value={formData.phone1}
                      onChange={handleEditChange}
                      placeholder="e.g., +1234567890"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="mb-4 w-full">
                    <label className="block text-xs font-medium text-gray-700">Backup Phone (Optional)</label>
                    <input
                      type="tel"
                      name="phone2"
                      value={formData.phone2}
                      onChange={handleEditChange}
                      placeholder="e.g., +1234567891"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex w-full justify-between gap-5">
                  <div className="mb-4 w-full">
                    <label className="block text-xs font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formatDateForInput(formData.startDate)}
                      onChange={handleEditChange}
                      required
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.startDate && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.startDate}</p>
                    )}
                  </div>
                  <div className="mb-4 w-full">
                    <label className="block text-xs font-medium text-gray-700">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formatDateForInput(formData.expiryDate)}
                      onChange={handleEditChange}
                      required
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.expiryDate && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.expiryDate}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Invoice Status</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="invoiceStatus"
                      checked={formData.invoiceStatus || false}
                      onChange={handleEditChange}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-xs text-gray-700">
                      {formData.invoiceStatus ? 'Invoiced' : 'Not Invoiced'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700">Package</label>
                  <input
                    type="text"
                    name="package"
                    value={formData.package}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g., Basic"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formErrors.package && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.package}</p>
                  )}
                </div>

                <div className="mt-4 w-full justify-between flex gap-5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setFormData(null);
                      setFormErrors({});
                    }}
                    className="ml-2 bg-gray-600 text-xs font-semibold text-white px-4 py-2 rounded-md w-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-900 text-xs font-semibold text-white px-4 py-2 rounded-md w-full flex items-center justify-center"
                    disabled={Object.keys(formErrors).length > 0}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteModalOpen && selectedHosting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete the hosting for{' '}
                <span className="font-medium">{selectedHosting.domainName}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedHosting(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

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