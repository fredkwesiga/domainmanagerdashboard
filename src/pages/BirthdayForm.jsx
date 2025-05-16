import React, { useState, useEffect } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const BirthdayForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    birthdayFull: null,
    telephone1: "",
    telephone2: "",
    email: "",
    nextOfKin: "",
    nokTelephone1: "",
    nokTelephone2: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: "", message: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!formData.birthdayFull) errors.birthdayFull = "Birthday is required";
    if (!formData.telephone1.trim()) errors.telephone1 = "Telephone 1 is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.nextOfKin.trim()) errors.nextOfKin = "Next of Kin is required";
    if (!formData.nokTelephone1.trim()) errors.nokTelephone1 = "Next of Kin Telephone 1 is required";
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, birthdayFull: date }));
    if (formErrors.birthdayFull) {
      setFormErrors((prev) => ({ ...prev, birthdayFull: "" }));
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showNotification("error", "Please fix form errors before submitting");
      return;
    }

    const submissionData = {
      ...formData,
      birthdayFull: formData.birthdayFull ? formData.birthdayFull.toISOString().split("T")[0] : "",
      birthday: formData.birthdayFull
        ? `${String(formData.birthdayFull.getDate()).padStart(2, "0")}/${String(
            formData.birthdayFull.getMonth() + 1
          ).padStart(2, "0")}`
        : "",
    };

    try {
      // Simulate API call (replace with actual API endpoint)
      console.log("Submitting birthday data:", submissionData);
      showNotification("success", "Birthday added successfully!");
      navigate("/birthdays"); // Redirect back to Birthdays page
    } catch (error) {
      showNotification("error", "Failed to save birthday");
      console.error("Error:", error);
    }
  };

  const handleCancel = () => {
    navigate("/birthdays");
  };

  const CustomDateInput = React.forwardRef(({ value, onClick, disabled }, ref) => (
    <button
      className={`
        w-full px-3 py-2 text-xs text-left border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white
        ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
      `}
      onClick={onClick}
      ref={ref}
      type="button"
      disabled={disabled}
    >
      {value || "Select date"}
      {!disabled && (
        <svg
          className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  ));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mx-auto text-xs max-w-4xl">
      {notification.show && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            notification.type === "success"
              ? "bg-green-100 border border-green-200 text-green-800"
              : "bg-red-100 border border-red-200 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        Add New Birthday
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.fullName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Birthday</label>
              <DatePicker
                selected={formData.birthdayFull}
                onChange={handleDateChange}
                customInput={<CustomDateInput />}
                dateFormat="MMMM d, yyyy"
                className="w-full"
                popperPlacement="bottom-start"
                required
              />
              {formErrors.birthdayFull && (
                <p className="mt-1 text-xs text-red-500">{formErrors.birthdayFull}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Contact Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Primary Telephone"
                name="telephone1"
                type="tel"
                value={formData.telephone1}
                onChange={handleChange}
                required
                placeholder="e.g., +1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.telephone1 && (
                <p className="mt-1 text-xs text-red-500">{formErrors.telephone1}</p>
              )}
            </div>
            <div>
              <Input
                label="Secondary Telephone (Optional)"
                name="telephone2"
                type="tel"
                value={formData.telephone2}
                onChange={handleChange}
                placeholder="e.g., +1234567891"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="e.g., john.doe@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Next of Kin Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Next of Kin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Next of Kin Name"
                name="nextOfKin"
                value={formData.nextOfKin}
                onChange={handleChange}
                required
                placeholder="e.g., Jane Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.nextOfKin && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nextOfKin}</p>
              )}
            </div>
            <div>
              <Input
                label="Next of Kin Telephone 1"
                name="nokTelephone1"
                type="tel"
                value={formData.nokTelephone1}
                onChange={handleChange}
                required
                placeholder="e.g., +1234567892"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.nokTelephone1 && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nokTelephone1}</p>
              )}
            </div>
            <div>
              <Input
                label="Next of Kin Telephone 2 (Optional)"
                name="nokTelephone2"
                type="tel"
                value={formData.nokTelephone2}
                onChange={handleChange}
                placeholder="e.g., +1234567893"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            onClick={handleCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2 rounded-lg transition-colors text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-xs"
            disabled={Object.keys(formErrors).length > 0}
          >
            + Add Birthday
          </Button>
        </div>
      </form>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .react-datepicker {
          font-family: "Inter", sans-serif;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.5rem;
        }
        .react-datepicker__current-month {
          font-weight: 600;
          color: #111827;
        }
        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
        }
        .react-datepicker__day {
          color: #111827;
          margin: 0.2rem;
        }
        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white;
          border-radius: 0.375rem;
        }
        .react-datepicker__day--selected:hover {
          background-color: #2563eb;
        }
        .react-datepicker__day:hover {
          border-radius: 0.375rem;
          background-color: #f3f4f6;
        }
        .react-datepicker__navigation {
          top: 0.5rem;
        }
        .react-datepicker__navigation--previous {
          left: 1rem;
        }
        .react-datepicker__navigation--next {
          right: 1rem;
        }
      `,
        }}
      />
    </div>
  );
};

export default BirthdayForm;