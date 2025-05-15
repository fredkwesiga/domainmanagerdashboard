import React, { useState } from "react";
import { FiCopy, FiMoreVertical, FiEdit, FiTrash2 } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PackagesTable = ({
  packages,
  refreshPackages,
  onDelete,
}) => {
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSelectAll = (e) => {
    setSelectedPackages(
      e.target.checked ? packages.map((pkg) => pkg.id) : []
    );
  };

  const toggleSelectPackage = (id) => {
    setSelectedPackages((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    try {
      const pkg = packages.find((p) => p.id === id);
      if (!pkg) {
        toast.error("Package not found.");
        return;
      }

      const res = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/deletepackage.php",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        toast.success(result.message);
        refreshPackages && refreshPackages();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error deleting package");
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setShowEditForm(true);
  };

  const handleUpdate = async (updatedPackage) => {
    setIsSaving(true);
    try {
      const res = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/updatepackage.php",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPackage),
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        setShowEditForm(false);
        refreshPackages && refreshPackages();
        toast.success("Package updated successfully");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating package:", error);
      toast.error("Failed to update package");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to safely get a substring of the ID
  const getDisplayId = (id) => {
    if (typeof id === 'string' && id.length > 0) {
      return id.substring(0, 7).toUpperCase();
    }
    return 'N/A';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3">
                <input type="checkbox" onChange={toggleSelectAll} />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Package Name
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                ID
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 relative">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {packages.map((pkg) => (
              <tr key={pkg.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={() => toggleSelectPackage(pkg.id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {pkg.packageName && pkg.packageName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-xs font-medium text-gray-900">
                        {pkg.packageName || 'Unnamed Package'}
                      </div>
                    </div>
                  </div>
                </td>
                {/* <td className="px-6 py-4 text-xs text-gray-900">
                  <div className="flex items-stretch justify-center h-full">
                    <span className="flex items-center">
                      {getDisplayId(pkg.id)}
                    </span>
                    <button 
                      className="ml-2 text-gray-400 hover:text-gray-600 flex items-center"
                      onClick={() => {
                        if (pkg.id) {
                          navigator.clipboard.writeText(pkg.id);
                          toast.info("ID copied to clipboard");
                        }
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>
                </td> */}
                <td className="px-6 py-4 text-xs text-gray-500">
                  {pkg.duration ? `${pkg.duration.value} ${pkg.duration.unit}(s)` : 'N/A'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  {pkg.currency || '$'} {pkg.amount || '0'}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() =>
                      setShowDropdown(
                        showDropdown === pkg.id ? null : pkg.id
                      )
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiMoreVertical size={18} />
                  </button>

                  {showDropdown === pkg.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            handleEdit(pkg);
                            setShowDropdown(null);
                          }}
                        >
                          <FiEdit className="mr-3" /> Edit
                        </button>
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          onClick={() => {
                            handleDelete(pkg.id);
                            setShowDropdown(null);
                          }}
                        >
                          <FiTrash2 className="mr-3" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Popup Form */}
      {showEditForm && editingPackage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg mb-4">Edit Package</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(editingPackage);
              }}
            >
              {/* Package Name */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700">
                  Package Name
                </label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 text-xs border rounded-md"
                  value={editingPackage.packageName || ''}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      packageName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex w-full justify-between gap-5">
                {/* Duration Value */}
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Duration Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingPackage.duration?.value || 1}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        duration: {
                          ...(editingPackage.duration || { unit: 'month' }),
                          value: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    required
                  />
                </div>

                {/* Duration Unit */}
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Duration Unit
                  </label>
                  <select
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingPackage.duration?.unit || 'month'}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        duration: {
                          ...(editingPackage.duration || { value: 1 }),
                          unit: e.target.value,
                        },
                      })
                    }
                    required
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              </div>

              <div className="flex w-full justify-between gap-5">
                {/* Amount */}
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingPackage.amount || 0}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                {/* Currency */}
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingPackage.currency || 'USD'}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        currency: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    {/* Add more currencies as needed */}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 w-full justify-between flex gap-5">
                <button
                  type="button"
                  className="ml-2 bg-gray-600 text-xs font-semibold text-white px-4 py-2 rounded-md w-full"
                  onClick={() => setShowEditForm(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-900 text-xs font-semibold text-white px-4 py-2 rounded-md w-full flex items-center justify-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesTable;