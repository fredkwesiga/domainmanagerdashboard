import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DomainTabs from '../components/dashboard/DomainTabs';

const Domains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  const fetchDomains = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/getdomains.php');
      const data = await response.json();
      
      if (data.status === 'success') {
        // Sort domains alphabetically by domainName before setting state
        const sortedDomains = data.data.sort((a, b) => 
          a.domainName.localeCompare(b.domainName)
        );
        setDomains(sortedDomains);
      } else {
        setConnectionError(data.message || 'Failed to fetch domains');
        toast.error(data.message || 'Failed to fetch domains');
      }
    } catch (err) {
      setConnectionError('Network error occurred while fetching domains');
      toast.error('Network error occurred while fetching domains');
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/deletedomain.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchDomains(); // Refresh the list after successful deletion
        toast.success('Domain deleted successfully!');
      } else {
        setConnectionError(data.message || 'Failed to delete domain');
        toast.error(data.message || 'Failed to delete domain');
      }
    } catch (err) {
      setConnectionError('Network error occurred while deleting domain');
      toast.error('Network error occurred while deleting domain');
      console.error('Error deleting domain:', err);
    }
  };

  // Function to handle domain addition
  const handleAddDomain = async (domainData) => {
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/adddomain.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(domainData)
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchDomains();
        toast.success('Domain added successfully!');
      } else {
        setConnectionError(data.message || 'Failed to add domain');
        toast.error(data.message || 'Failed to add domain');
      }
    } catch (err) {
      setConnectionError('Network error occurred while adding domain');
      toast.error('Network error occurred while adding domain');
      console.error('Error adding domain:', err);
    }
  };

  // Function to handle domain editing
  const handleEditDomain = async (id, domainData) => {
    console.log('handleEditDomain called with:', { id, domainData }); // Debugging log
    try {
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/updatedomain.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...domainData })
      });
      const data = await response.json();
      console.log('Edit domain response:', data); // Debugging log
      if (data.status === 'success') {
        fetchDomains();
        toast.success('Domain updated successfully!', {
          position: 'top-right',
          autoClose: 5000, // Extended duration for visibility
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        setConnectionError(data.message || 'Failed to update domain');
        toast.error(data.message || 'Failed to update domain');
      }
    } catch (err) {
      setConnectionError('Network error occurred while updating domain');
      toast.error('Network error occurred while updating domain');
      console.error('Error updating domain:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1); // Reset to first page when searching
  };

  // Sort domains alphabetically before filtering
  const sortedDomains = [...domains].sort((a, b) => 
    a.domainName.localeCompare(b.domainName)
  );

  const filteredDomains = sortedDomains.filter(domain => {
    if (!searchQuery) return true;
    return (
      domain.domainName.toLowerCase().includes(searchQuery) ||
      (domain.owner?.firstName?.toLowerCase().includes(searchQuery)) ||
      (domain.owner?.lastName?.toLowerCase().includes(searchQuery)) ||
      (domain.contact?.email1?.toLowerCase().includes(searchQuery)) ||
      (domain.contact?.phone1?.includes(searchQuery))
    );
  });

  // Get current domains
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDomains = filteredDomains.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);

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

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="container mx-auto">
      {/* Toast Container */}
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="w-full md:w-1/3">
          <div className="relative">
            <input
              type="search"
              placeholder="Search domains..."
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
          onClick={() => navigate('/domains/add')}
          className="bg-indigo-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-xs whitespace-nowrap"
        >
          + Add New Domain
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <DomainTabs 
            domains={currentDomains} 
            onDelete={handleDelete}
            onEdit={handleEditDomain}
            onAdd={handleAddDomain}
            refreshDomains={fetchDomains}
          />
          
          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between mt-6">
            <div className="text-xs text-gray-500 mb-4 md:mb-0">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDomains.length)} of {filteredDomains.length} records
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

export default Domains;