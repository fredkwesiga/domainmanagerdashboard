import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { FiSearch, FiMoreVertical } from 'react-icons/fi';

// Mock data for Domains and Hosting
const mockData = [
  {
    id: 'D001',
    type: 'Domain',
    name: 'example.com',
    ownerEmail: 'user1@example.com',
    owner: 'John Doe',
    hostingType: null,
    dates: { expiryDate: '2025-06-15' },
    status: 'Active',
  },
  {
    id: 'H001',
    type: 'Hosting',
    name: 'testsite.com',
    ownerEmail: 'user2@example.com',
    owner: 'Jane Smith',
    hostingType: 'VPS',
    dates: { expiryDate: '2025-05-12' },
    status: 'Expiring Soon',
  },
  {
    id: 'DH001',
    type: 'Domain & Hosting',
    name: 'demo.net',
    ownerEmail: 'user3@example.com',
    owner: 'Bob Johnson',
    hostingType: 'Dedicated',
    dates: { expiryDate: '2025-04-10' },
    status: 'Expired',
  },
];

const DomainAndHosting = () => {
  const [data, setData] = useState(mockData);
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
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    // Initialize data and stats
    setFilteredData(data);
    calculateStats(data);
    filterData(0); // Default to "All" tab
  }, [data]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    filterData(0); // Reset to "All" tab when searching
  };

  // Format expiry date to DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Domain & Hosting</h1>
        </div>

        {/* Search and Add Buttons */}
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
            {/* <div className="flex gap-2">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                + Add New Domain
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                + Add New Hosting
              </button>
            </div> */}
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
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hosting Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
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
                                {item.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.hostingType || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                                >
                                  {status.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.owner}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(item.dates.expiryDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <FiMoreVertical className="text-gray-400" size={16} />
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
              Loading data...
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