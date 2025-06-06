import React, { useState, useEffect } from "react";
import {
  FiCopy,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { FiEdit2, FiTrash } from "react-icons/fi";
import {
  formatDate,
  isDomainActive,
  calculateDaysUntilExpiry,
  formatDaysRemaining,
} from "../../utils/helpers";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useNotifications,
  NOTIFICATION_TYPES,
} from "../layout/NotificationContext";

const DomainTable = ({
  domains,
  statusChecks,
  refreshDomains,
  showDaysUntilExpiry = false,
}) => {
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [editingDomain, setEditingDomain] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [viewingDomain, setViewingDomain] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const { notifyDomainExpiring, addNotification } = useNotifications();

  const toggleSelectAll = (e) => {
    setSelectedDomains(
      e.target.checked ? domains.map((domain) => domain.id) : []
    );
  };

  const toggleSelectDomain = (id) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    domains.forEach((domain) => {
      const daysLeft = calculateDaysUntilExpiry(domain.dates?.expiryDate);
      if (daysLeft <= 30 && daysLeft > 0) {
        notifyDomainExpiring(domain, daysLeft);
      }
    });
  }, [domains, notifyDomainExpiring]);

  const getStatusClass = (domain) => {
    if (statusChecks[domain.domainName]?.status) {
      return statusChecks[domain.domainName].status.includes("Expired")
        ? "bg-red-100 text-red-800"
        : "bg-green-100 text-green-800";
    }
    return isDomainActive(domain)
      ? "bg-green-100 text-green-600"
      : "bg-red-100 text-red-600";
  };

  const getStatusText = (domain) => {
    return (
      statusChecks[domain.domainName]?.status ||
      (isDomainActive(domain) ? "Active" : "Expired")
    );
  };

  const handleDelete = async (id) => {
    try {
      const domain = domains.find((d) => d.id === id);
      if (!domain) {
        toast.error("Domain not found.");
        return;
      }

      const res = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/deletedomain.php",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        toast.success(result.message);
        addNotification({
          type: NOTIFICATION_TYPES.SUCCESS,
          message: `Domain ${domain.domainName} has been deleted successfully.`,
        });
        refreshDomains && refreshDomains();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error deleting domain");
    }
  };

  const handleEdit = (domain) => {
    const domainToEdit = {
      ...domain,
      invoiceStatus: domain.invoiceStatus || false,
      note: domain.note || '', // Load existing note
    };
    setEditingDomain(domainToEdit);
    setShowEditForm(true);
    setShowDropdown(null);
    setShowNoteInput(!!domain.note); // Show note input if note exists
    setNote(domain.note || ''); // Set existing note
  };

  const handleViewStatus = (domain) => {
    const domainToView = {
      ...domain,
      invoiceStatus: domain.invoiceStatus || false,
      note: domain.note || '', // Load note for viewing
    };
    setViewingDomain(domainToView);
    setShowStatusModal(true);
    setShowDropdown(null);
  };

  const handleUpdate = async (updatedDomain) => {
    setIsSaving(true);
    try {
      const res = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/updatedomain.php",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: updatedDomain.id,
            domainName: updatedDomain.domainName,
            owner: updatedDomain.owner,
            contact: updatedDomain.contact,
            dates: updatedDomain.dates,
            package: updatedDomain.package,
            amount: updatedDomain.amount,
            invoiceStatus: updatedDomain.invoiceStatus,
            note: note, // Send the note to the backend
          }),
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        const originalDomain = domains.find((d) => d.id === updatedDomain.id);
        const wasNoteAdded = !originalDomain.note && note;
        const wasNoteUpdated = originalDomain.note && note && originalDomain.note !== note;
        const wasNoteRemoved = originalDomain.note && !note;

        if (wasNoteRemoved) {
          toast.success('Note has been removed');
        } else if (wasNoteAdded) {
          toast.success('Note Added Successfully');
        } else if (wasNoteUpdated) {
          toast.success('Note Updated Successfully');
        } else {
          toast.success(`Domain ${updatedDomain.domainName} has been updated successfully!`);
        }

        // Update local state with the note
        const updatedDomains = domains.map((d) =>
          d.id === updatedDomain.id
            ? { ...d, ...updatedDomain, note }
            : d
        );
        setShowEditForm(false);
        addNotification({
          type: NOTIFICATION_TYPES.SUCCESS,
          message: `Domain ${updatedDomain.domainName} has been updated successfully.`,
        });
        refreshDomains && refreshDomains(updatedDomains); // Pass updated domains to parent
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error updating domain:", error);
      addNotification({
        type: NOTIFICATION_TYPES.DANGER,
        message: `Failed to update domain ${updatedDomain.domainName}: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveNote = () => {
    if (!window.confirm('Are you sure you want to remove this note?')) {
      return;
    }
    setNote('');
    const updatedViewingDomain = { ...viewingDomain, note: '' };
    setViewingDomain(updatedViewingDomain);
    handleUpdate(updatedViewingDomain); // Save the removal to the backend
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
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
                Domain Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                {showDaysUntilExpiry ? "Days Left" : "Expiry Date"}
              </th>
              <th className="px-6 py-3 relative">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {domains.map((domain) => {
              const daysLeft = calculateDaysUntilExpiry(
                domain.dates?.expiryDate
              );
              return (
                <tr key={domain.id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(domain.id)}
                      onChange={() => toggleSelectDomain(domain.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {domain.domainName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-xs font-medium text-gray-900">
                          {domain.domainName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {domain.contact?.email1 || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-900">
                    <div className="flex items-stretch justify-center h-full">
                      <span className="flex items-center">
                        {domain.id.substring(0, 7).toUpperCase()}
                      </span>
                      <button className="ml-2 text-gray-400 hover:text-gray-600 flex items-center">
                        <FiCopy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {domain.package || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                        domain
                      )}`}
                    >
                      {getStatusText(domain)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-900">
                    {domain.owner?.firstName || "Unknown"}{" "}
                    {domain.owner?.lastName || ""}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {showDaysUntilExpiry ? (
                      <span
                        className={
                          daysLeft <= 7 ? "text-red-600 font-medium" : ""
                        }
                      >
                        {formatDaysRemaining(domain.dates?.expiryDate)}
                      </span>
                    ) : (
                      formatDate(domain.dates?.expiryDate)
                    )}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() =>
                        setShowDropdown(
                          showDropdown === domain.id ? null : domain.id
                        )
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiMoreVertical size={18} />
                    </button>

                    {showDropdown === domain.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="py-1">
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              handleViewStatus(domain);
                              setShowDropdown(null);
                            }}
                          >
                            <FiEye className="mr-3" /> View Status
                          </button>
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              handleEdit(domain);
                              setShowDropdown(null);
                            }}
                          >
                            <FiEdit className="mr-3" /> Edit
                          </button>
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={() => {
                              handleDelete(domain.id);
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View Status Modal */}
      {showStatusModal && viewingDomain && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-900 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Domain Status</h2>
                <button
                  onClick={() => setShowStatusModal(false)}
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
                  className={`inline-flex items-center px-5 py-1 rounded-full text-xs font-medium ${
                    getStatusText(viewingDomain) === "Active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {getStatusText(viewingDomain)}
                </span>
                <span className="ml-2 text-xs text-white/90">
                  {viewingDomain.domainName}
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
                    Domain Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Package
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {viewingDomain.package || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Start Date
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(viewingDomain.dates?.startDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Expiry Date
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(viewingDomain.dates?.expiryDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Invoice Status
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        viewingDomain.invoiceStatus
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {viewingDomain.invoiceStatus ? "Invoiced" : "Pending"}
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
                    Owner Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {`${viewingDomain.owner?.firstName || ""} ${
                        viewingDomain.owner?.lastName || ""
                      }`.trim() || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Primary Email
                    </span>
                    <a
                      href={`mailto:${viewingDomain.contact?.email1}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {viewingDomain.contact?.email1}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Backup Email
                    </span>
                    {viewingDomain.contact?.email2 ? (
                      <a
                        href={`mailto:${viewingDomain.contact?.email2}`}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {viewingDomain.contact?.email2}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        N/A
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Primary Phone
                    </span>
                    <a
                      href={`tel:${viewingDomain.contact?.phone1}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {viewingDomain.contact?.phone1}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Backup Phone
                    </span>
                    {viewingDomain.contact?.phone2 ? (
                      <a
                        href={`tel:${viewingDomain.contact?.phone2}`}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {viewingDomain.contact?.phone2}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Note Section */}
              {viewingDomain.note && (
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
                    {viewingDomain.note}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                type="button"
                className="w-full bg-indigo-900 text-xs font-semibold text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setShowStatusModal(false)}
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Popup Form */}
      {showEditForm && editingDomain && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg mb-4">Edit Domain</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(editingDomain);
              }}
            >
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700">
                  Domain Name
                </label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border text-xs font-semibold rounded-md bg-gray-100"
                  value={editingDomain.domainName}
                  disabled
                />
              </div>

              <div className="flex w-full justify-between gap-5">
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Owner First Name
                  </label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.owner.firstName}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        owner: {
                          ...editingDomain.owner,
                          firstName: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Owner Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.owner.lastName}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        owner: {
                          ...editingDomain.owner,
                          lastName: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex w-full justify-between gap-5">
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Primary Email
                  </label>
                  <input
                    type="email"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.contact.email1}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        contact: {
                          ...editingDomain.contact,
                          email1: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Backup Email
                  </label>
                  <input
                    type="email"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.contact.email2}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        contact: {
                          ...editingDomain.contact,
                          email2: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex w-full justify-between gap-5">
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Primary Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.contact.phone1}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        contact: {
                          ...editingDomain.contact,
                          phone1: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Backup Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.contact.phone2}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        contact: {
                          ...editingDomain.contact,
                          phone2: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex w-full justify-between gap-5">
                <div className="mb-4 w-full">
                  <label className="block text-xs font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 text-xs border rounded-md"
                    value={editingDomain.dates?.expiryDate?.split(" ")[0] || ""}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        dates: {
                          ...editingDomain.dates,
                          expiryDate: e.target.value,
                        },
                      })
                    }
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
                    checked={editingDomain.invoiceStatus || false}
                    onChange={(e) =>
                      setEditingDomain({
                        ...editingDomain,
                        invoiceStatus: e.target.checked,
                      })
                    }
                  />
                  <span className="ml-2 text-xs text-gray-700">
                    {editingDomain.invoiceStatus ? "Invoiced" : "Not Invoiced"}
                  </span>
                </div>
              </div>

              <div className="mb-4 w-full">
                <button
                  type="button"
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <FiEdit2 className="mr-1" size={14} /> Add Note
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

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700">
                  Package
                </label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 text-xs font-semibold border rounded-md bg-gray-100 uppercase"
                  value={editingDomain.package}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  To change the package, please contact customer service.
                </p>
              </div>

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

export default DomainTable;