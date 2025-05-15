import React, { useState, useEffect } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { CURRENCIES } from "../../utils/CURRENCIES"; 
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PackageForm = ({ initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    packageName: "",
    duration: {
      value: 1,
      unit: "month" // can be 'day', 'week', 'month', 'year'
    },
    amount: 0,
    currency: "USD"
  });

  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    if (initialData) {
      setFormData({
        packageName: initialData.packageName || "",
        duration: initialData.duration || { value: 1, unit: "month" },
        amount: initialData.amount || 0,
        currency: initialData.currency || "USD"
      });
    }
  }, [initialData]);

  // Auto-hide notifications after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: "", message: "" });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.packageName) {
      showNotification("error", "Please enter a package name");
      return;
    }

    if (formData.amount <= 0) {
      showNotification("error", "Amount must be greater than 0");
      return;
    }

    try {
      const response = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/addpackage.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        showNotification("success", result.message || "Package added successfully!");
        setFormData({
          packageName: "",
          duration: { value: 1, unit: "month" },
          amount: 0,
          currency: "USD"
        });
      } else {
        showNotification("error", result.message || "Something went wrong");
      }
    } catch (error) {
      showNotification("error", "Network or server error");
      console.error("Error:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mx-auto text-xs">
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
        {initialData ? "Edit Package" : "Add New Package"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Package Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Package Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Package Name"
              name="packageName"
              value={formData.packageName}
              onChange={handleChange}
              required
              placeholder="e.g., Premium Plan"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Duration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Duration Value"
              name="duration.value"
              type="number"
              min="1"
              value={formData.duration.value}
              onChange={handleChange}
              required
            />
            <Select
              label="Duration Unit"
              name="duration.unit"
              value={formData.duration.unit}
              onChange={handleChange}
              options={[
                { value: "day", label: "Days" },
                { value: "week", label: "Weeks" },
                { value: "month", label: "Months" },
                { value: "year", label: "Years" }
              ]}
              required
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <Select
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              options={CURRENCIES.map(currency => ({
                value: currency.code,
                label: `${currency.name} (${currency.symbol})`
              }))}
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2 rounded-lg transition-colors text-xs"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-xs"
          >
            {initialData ? "Update Package" : "+ Add Package"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PackageForm;