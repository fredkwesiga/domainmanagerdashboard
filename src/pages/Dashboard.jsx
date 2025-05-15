import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, Bar, BarChart
} from 'recharts';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/solid';
import { convertCurrency } from '../utils/currencyUtils'; 

const Dashboard = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalRevenue: 0,
    expiredRevenue: 0,
    redemptionRevenue: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    expired: 0,
    redemption: 0,
    active: 0,
    monthlyRevenue: [],
    monthlyRegistrations: [],
    monthlyGrowth: 0,
    averageDomainValue: 0
  });

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/getdomains.php');
      const data = await response.json();
      
      if (data.status === 'success') {
        const enrichedData = data.data.map(domain => {
          // Convert amount to USD if a different currency is specified
          let domainAmount = parseFloat(domain.amount || 0);
          if (domain.currency && domain.currency !== 'USD') {
            domainAmount = convertCurrency(domainAmount, domain.currency, 'USD');
          }
          
          // Generate registration date if missing
          if (!domain.dates.registrationDate) {
            const expiryDate = new Date(domain.dates.expiryDate);
            const randomYearsBack = Math.floor(Math.random() * 3) + 1;
            const registrationDate = new Date(expiryDate);
            registrationDate.setFullYear(expiryDate.getFullYear() - randomYearsBack);
            
            return {
              ...domain,
              amount: domainAmount,
              currency: 'USD', // Set currency to USD after conversion
              dates: {
                ...domain.dates,
                registrationDate: registrationDate.toISOString().split('T')[0]
              }
            };
          }
          
          return {
            ...domain,
            amount: domainAmount,
            currency: 'USD' // Set currency to USD after conversion
          };
        });
        
        setDomains(enrichedData);
        calculateStats(enrichedData);
      } else {
        setError(data.message || 'Failed to fetch domains');
      }
    } catch (err) {
      setError('Network error occurred while fetching domains');
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    setCurrentMonth(months[now.getMonth()]);
    setCurrentYear(now.getFullYear());
  }, []);

  // Calculate statistics from domain data
  const calculateStats = (domains) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let totalRevenue = 0;
    let expiredRevenue = 0;
    let redemptionRevenue = 0;
    let expiring7Days = 0;
    let expiring30Days = 0;
    let expiredCount = 0;
    let redemptionCount = 0;
    let activeCount = 0;
    let totalDomainValue = 0;
    let domainCount = domains.length;

    // Create monthly revenue tracking for both registration and expiry
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize monthly data maps
    const monthlyRevenueMap = new Map();
    const monthlyRegistrationsMap = new Map();
    const monthlyExpiryMap = new Map();
    
    months.forEach(month => {
      monthlyRevenueMap.set(month, 0);
      monthlyRegistrationsMap.set(month, 0);
      monthlyExpiryMap.set(month, 0);
    });

    domains.forEach(domain => {
      const expiryDate = new Date(domain.dates.expiryDate);
      const registrationDate = new Date(domain.dates.registrationDate || expiryDate);
      // Amount is already converted to USD at this point
      const amount = parseFloat(domain.amount || 0);
      
      totalRevenue += amount;
      totalDomainValue += amount;
      
      // Add to monthly revenue based on registration date
      const regMonth = months[registrationDate.getMonth()];
      const regYear = registrationDate.getFullYear();
      
      // Only count this year's registrations in the chart
      if (regYear === currentYear) {
        monthlyRevenueMap.set(regMonth, monthlyRevenueMap.get(regMonth) + amount);
        monthlyRegistrationsMap.set(regMonth, monthlyRegistrationsMap.get(regMonth) + 1);
      }
      
      // Track expiry month as well
      const expMonth = months[expiryDate.getMonth()];
      monthlyExpiryMap.set(expMonth, monthlyExpiryMap.get(expMonth) + amount);
      
      const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceExpiry > 30) {
        redemptionCount++;
        redemptionRevenue += amount;
      } else if (daysSinceExpiry > 0) {
        expiredCount++;
        expiredRevenue += amount;
      } else if (expiryDate <= sevenDaysFromNow && expiryDate > now) {
        expiring7Days++;
      } else if (expiryDate <= thirtyDaysFromNow && expiryDate > sevenDaysFromNow) {
        expiring30Days++;
      } else if (expiryDate > now) {
        activeCount++;
      }
    });

    // Convert maps to array format for charts
    const monthlyRevenue = months.map(month => ({
      name: month,
      revenue: monthlyRevenueMap.get(month),
      registrations: monthlyRegistrationsMap.get(month),
      expiring: monthlyExpiryMap.get(month)
    }));

    // Calculate month-over-month revenue growth
    const currentMonthIndex = months.indexOf(currentMonth);
    const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const currentMonthRevenue = monthlyRevenueMap.get(currentMonth);
    const previousMonthRevenue = monthlyRevenueMap.get(months[previousMonthIndex]);
    
    let monthlyGrowth = 0;
    if (previousMonthRevenue > 0) {
      monthlyGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    }

    // Calculate average domain value
    const averageDomainValue = domainCount > 0 ? totalDomainValue / domainCount : 0;

    setStats({
      totalRevenue,
      expiredRevenue,
      redemptionRevenue,
      expiring7Days,
      expiring30Days,
      expired: expiredCount,
      redemption: redemptionCount,
      active: activeCount,
      monthlyRevenue,
      monthlyGrowth,
      averageDomainValue
    });
  };

  // Fetch domains when the component mounts
  useEffect(() => {
    fetchDomains();
  }, []);

  // Format currency - always in USD
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentages
  const expiredPercentage = stats.totalRevenue > 0 
    ? ((stats.expiredRevenue / stats.totalRevenue) * 100).toFixed(1)
    : 0;
    
  const redemptionPercentage = stats.totalRevenue > 0 
    ? ((stats.redemptionRevenue / stats.totalRevenue) * 100).toFixed(1)
    : 0;

  // Data for the domain status pie chart
  const domainStatusData = [
    { name: 'Active', value: stats.active, color: '#4052ef' }, 
    { name: 'Expired', value: stats.expired, color: '#1a1e3c' }, 
    { name: 'Expiring', value: stats.expiring7Days + stats.expiring30Days, color: '#e6eaf4' }, 
    { name: 'Redemption', value: stats.redemption, color: '#ffb41d' }
  ];

  // Filter monthly revenue data to only show up to current month
  const getFilteredMonthlyData = () => {
    if (!currentMonth) return stats.monthlyRevenue;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = months.indexOf(currentMonth);
    
    return stats.monthlyRevenue.filter((_, index) => index <= currentMonthIndex);
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalDomains = stats.active + stats.expiring7Days + stats.expiring30Days + stats.expired + stats.redemption;
      const percentage = (data.value / totalDomains * 100).toFixed(1);
      
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200 text-xs">
          <p className="text-xs font-medium">{data.name}</p>
          <p>Count: {data.value}</p>
          <p>Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const RevenueTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200 text-xs">
          <p className="font-medium text-xs">{payload[0].payload.name}</p>
          <p>{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.registrations && (
            <p>{payload[0].payload.registrations} registrations</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domain Analytics Dashboard</h1>
            <p className="text-xs text-gray-500">Year: {currentYear} • Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <button
            onClick={fetchDomains}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-900 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-xs font-medium text-gray-400 truncate">Total Revenue (USD)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.totalRevenue)}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of the component remains unchanged */}
          {/* Monthly Growth Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stats.monthlyGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-md p-3`}>
                  {stats.monthlyGrowth >= 0 ? (
                    <ArrowUpIcon className="h-6 w-6 text-white" />
                  ) : (
                    <ArrowDownIcon className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-xs font-medium text-gray-400 truncate">Monthly Growth</dt>
                  <dd className="flex flex-col items-baseline">
                    <div className={`text-2xl font-semibold ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.monthlyGrowth.toFixed(1)}%
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      vs previous month
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Average Domain Value */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-xs font-medium text-gray-400 truncate">Avg. Domain Value (USD)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.averageDomainValue)}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* At-Risk Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-xs font-medium text-gray-400 truncate">At-Risk Revenue (USD)</dt>
                  <dd className="flex flex-col items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.expiredRevenue + stats.redemptionRevenue)}
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      {parseFloat(expiredPercentage) + parseFloat(redemptionPercentage)}% of total
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          

          {/* Domain Registration/Expiry Trend Chart */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-sm font-semibold font-medium text-gray-900 mb-4">Domain Registration Trend</h2>
            <div className="h-[200px] text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={getFilteredMonthlyData()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="registrations" 
                    name="New Registrations"
                    stroke="#4052ef" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* Revenue Source Breakdown */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-sm font-semibold font-medium text-gray-900 mb-4">Revenue Source Breakdown</h2>
            <div className="h-[200px] text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                className='text-xs'
                  data={[
                    { name: 'Active', value: stats.totalRevenue - stats.expiredRevenue - stats.redemptionRevenue },
                    { name: 'Expired', value: stats.expiredRevenue },
                    { name: 'Redemption', value: stats.redemptionRevenue }
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4052ef" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4052ef" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpired" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a1e3c" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1a1e3c" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRedemption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb41d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ffb41d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stackId="1"
                    stroke="#4052ef" 
                    fillOpacity={1} 
                    fill="url(#colorActive)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Tab.Group>
            <Tab.List className="border-b border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Tab
                className={({ selected }) =>
                  `px-4 py-3 text-xs font-medium focus:outline-none ${
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
                  `px-4 py-3 text-xs font-medium focus:outline-none ${
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
                  `px-4 py-3 text-xs font-medium focus:outline-none ${
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
                  `px-4 py-3 text-xs font-medium focus:outline-none ${
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                Redemption ({stats.redemption})
              </Tab>
            </Tab.List>
            <Tab.Panels className="p-6">
              <Tab.Panel>
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-md font-medium text-gray-900">{stats.expiring7Days} domains expiring soon</h3>
                  <p className="mt-1 text-xs text-gray-500">These domains will expire within the next 7 days.</p>
                  <p className="mt-2 text-sm text-gray-700">Potential revenue impact: {formatCurrency(stats.expiring7Days * stats.averageDomainValue)}</p>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-md font-medium text-gray-900">{stats.expiring30Days} domains expiring soon</h3>
                  <p className="mt-1 text-xs text-gray-500">These domains will expire within the next 30 days.</p>
                  <p className="mt-2 text-sm text-gray-700">Potential revenue impact: {formatCurrency(stats.expiring30Days * stats.averageDomainValue)}</p>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="mt-2 text-md font-medium text-gray-900">{stats.expired} expired domains</h3>
                  <p className="mt-1 text-xs text-gray-500">These domains have already expired.</p>
                  <p className="mt-2 text-sm text-gray-700">Revenue at risk: {formatCurrency(stats.expiredRevenue)}</p>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-md font-medium text-gray-900">{stats.redemption} domains in redemption</h3>
                  <p className="mt-1 text-xs text-gray-500">These domains are in the redemption period.</p>
                  <p className="mt-2 text-sm text-gray-700">Redemption revenue: {formatCurrency(stats.redemptionRevenue)}</p>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Revenue Breakdown Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden mt-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Revenue Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue Source
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domains
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Active Domains
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(stats.totalRevenue - stats.expiredRevenue - stats.redemptionRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.totalRevenue > 0 ? 
                      ((stats.totalRevenue - stats.expiredRevenue - stats.redemptionRevenue) / stats.totalRevenue * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.active}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Expired Domains
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(stats.expiredRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expiredPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.expired}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Redemption Domains
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(stats.redemptionRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {redemptionPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.redemption}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    100%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {stats.active + stats.expired + stats.redemption}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Performance Summary */}
        <div className="bg-white shadow rounded-lg overflow-hidden mt-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Monthly Performance ({currentMonth} {currentYear})</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* New Registrations */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">New Registrations</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.monthlyRevenue.find(m => m.name === currentMonth)?.registrations || 0}
                </p>
                <div className="mt-2 flex items-center">
                  {stats.monthlyGrowth >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${stats.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(stats.monthlyGrowth).toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              
              {/* Current Month Revenue */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Month Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRevenue.find(m => m.name === currentMonth)?.revenue || 0)}
                </p>
                <div className="mt-2 flex items-center">
                  {stats.monthlyGrowth >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${stats.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(stats.monthlyGrowth).toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              
              {/* Domains Expiring This Month */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Domains Expiring This Month</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.expiring7Days + stats.expiring30Days}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Est. value: {formatCurrency((stats.expiring7Days + stats.expiring30Days) * stats.averageDomainValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-900 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading domain data...
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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

export default Dashboard;