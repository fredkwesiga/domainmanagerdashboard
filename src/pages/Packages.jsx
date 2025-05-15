import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PackagesTable from '../components/Packages/PackageTable';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  const fetchPackages = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/getpackages.php');
      const data = await response.json();
      
      if (data.status === 'success') {
        // Make sure each package has the required properties
        const processedPackages = data.data.map(pkg => ({
          ...pkg,
          id: pkg.id || '',
          packageName: pkg.packageName || '',
          duration: pkg.duration || { value: 0, unit: 'month' },
          amount: pkg.amount || 0,
          currency: pkg.currency || 'USD'
        }));
        
        // Sort packages alphabetically by packageName
        const sortedPackages = processedPackages.sort((a, b) => 
          a.packageName.localeCompare(b.packageName)
        );
        
        setPackages(sortedPackages);
      } else {
        setConnectionError(data.message || 'Failed to fetch packages');
      }
    } catch (err) {
      setConnectionError('Network error occurred while fetching packages');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/deletepackage.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchPackages(); // Refresh the list after successful deletion
      } else {
        setConnectionError(data.message || 'Failed to delete package');
      }
    } catch (err) {
      setConnectionError('Network error occurred while deleting package');
      console.error('Error deleting package:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter packages based on search query
  const filteredPackages = packages.filter(pkg => {
    if (!searchQuery) return true;
    return (
      (pkg.packageName && pkg.packageName.toLowerCase().includes(searchQuery)) ||
      (pkg.id && pkg.id.toLowerCase().includes(searchQuery)) ||
      (pkg.amount && pkg.amount.toString().includes(searchQuery)) ||
      (pkg.currency && pkg.currency.toLowerCase().includes(searchQuery))
    );
  });

  // Get current packages
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPackages = filteredPackages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 3;

    if (totalPages <= maxVisiblePages + 2) {
      // Show all pages if total pages are less than or equal to maxVisiblePages + 2
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Show current page and surrounding pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're at the beginning or end
      if (currentPage <= maxVisiblePages - 1) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - (maxVisiblePages - 2)) {
        startPage = totalPages - (maxVisiblePages - 1);
      }

      // Add ellipsis if needed after first page
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed before last page
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always show last page if there are more than one page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="w-full md:w-1/3">
          <div className="relative">
            <input
              type="search"
              placeholder="Search packages..."
              onChange={handleSearch}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 pl-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <svg 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <button
          onClick={() => navigate('/packages/add')}
          className="bg-indigo-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-xs whitespace-nowrap"
        >
          + Add New Package
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <PackagesTable 
            packages={currentPackages} 
            onDelete={handleDelete}
            refreshPackages={fetchPackages}
          />
          
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-6">
              <div className="text-xs text-gray-500 mb-4 md:mb-0">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPackages.length)} of {filteredPackages.length} records
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
          )}
        </>
      )}

      {connectionError && (
        <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs text-red-600">{connectionError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;