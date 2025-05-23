import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiX, FiEye, FiMoreVertical } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const DomainAndHosting = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    expired: 0,
    redemption: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch domains from API
  const fetchDomains = async () => {
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/getdomains.php');
      const data = await response.json();
      if (data.status === 'success') {
        return data.data.map(item => ({
          id: item.id,
          type: 'Domain',
          name: item.domainName,
          ownerEmail: item.contact?.email1 || '',
          owner: `${item.owner?.firstName || ''} ${item.owner?.lastName || ''}`.trim(),
          hostingType: null,
          dates: { expiryDate: item.dates?.expiryDate || '' },
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch domains');
      }
    } catch (err) {
      throw new Error('Network error occurred while fetching domains');
    }
  };

  // Fetch hosting from API
  const fetchHosting = async () => {
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/gethosting.php');
      const data = await response.json();
      if (data.status === 'success') {
        return data.data.map(item => ({
          id: item.id,
          type: 'Hosting',
          name: item.hosted_domain,
          ownerEmail: item.primary_email || '',
          owner: `${item.owner_first_name || ''} ${item.owner_last_name || ''}`.trim(),
          hostingType: item.hosting_type || 'N/A',
          dates: { expiryDate: item.expiry_date || '' },
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch hosting');
      }
    } catch (err) {
      throw new Error('Network error occurred while fetching hosting');
    }
  };

  // Fetch both domains and hosting data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [domains, hosting] = await Promise.all([fetchDomains(), fetchHosting()]);
      const combinedData = [...domains, ...hosting].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setData(combinedData);
      calculateStats(combinedData);
      setFilteredData(combinedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      toast.error(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate statistics
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

    let filtered = data;
    switch (tabIndex) {
      case 0: // All
        filtered = data;
        break;
      case 1: // Active
        filtered = data.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate > now;
        });
        break;
      case 2: // Expiring in 7 Days
        filtered = data.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate <= sevenDaysFromNow && expiryDate > now;
        });
        break;
      case 3: // Expiring in 30 Days
        filtered = data.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > sevenDaysFromNow;
        });
        break;
      case 4: // Expired
        filtered = data.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
          return daysSinceExpiry > 0 && daysSinceExpiry <= 30;
        });
        break;
      case 5: // Redemption
        filtered = data.filter((item) => {
          const expiryDate = new Date(item.dates.expiryDate);
          const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
          return daysSinceExpiry > 30;
        });
        break;
      default:
        filtered = data;
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.owner.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    filterData(0); // Reset to "All" tab when searching
  };

  // Format date to DD/MM/YYYY for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Handle View action
  const handleView = (item) => {
    setSelectedItem(item);
    setShowModal(true);
    setDropdownOpen(null);
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

  // Handle dropdown toggle
  const handleDropdownToggle = (id, e) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Domain & Hosting</h1>
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
                placeholder="Search domains or hosting..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                All ({stats.total})
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
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((item) => {
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
                                    {item.type.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {item.ownerEmail}
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
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="bg-indigo-800 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-bold">Item Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="bg-indigo-800 text-white px-3 pb-3 flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatus(
                    selectedItem.dates.expiryDate
                  ).color}`}
                >
                  {getStatus(selectedItem.dates.expiryDate).text}
                </span>
                <span className="text-lg ml-2">{selectedItem.name}</span>
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
                      Item Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">ID</div>
                      <div className="text-right font-medium">{selectedItem.id}</div>
                      <div className="text-gray-500">Type</div>
                      <div className="text-right font-medium">{selectedItem.type}</div>
                      <div className="text-gray-500">Hosting Type</div>
                      <div className="text-right font-medium">
                        {selectedItem.hostingType || 'N/A'}
                      </div>
                      <div className="text-gray-500">Expiry Date</div>
                      <div className="text-right font-medium">
                        {formatDate(selectedItem.dates.expiryDate)}
                      </div>
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
                      Owner Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Name</div>
                      <div className="text-right font-medium">{selectedItem.owner}</div>
                      <div className="text-gray-500">Email</div>
                      <div className="text-right font-medium truncate">
                        {selectedItem.ownerEmail}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0           
                    5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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

export default DomainAndHosting;