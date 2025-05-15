import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Settings = () => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("adminPanelSettings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          darkMode: false,
          apiEndpoint: "https://goldenrod-cattle-809116.hostingersite.com",
          notificationsEnabled: true,
          itemsPerPage: 10,
          autoRefresh: false,
          refreshInterval: 5,
          timezone: "UTC",
          language: "en",
        };
  });

  const [connectionError, setConnectionError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);

  // Apply dark mode on component mount and when setting changes
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("adminPanelSettings", JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value ? parseInt(value) : 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Simulate API save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (err) {
      setConnectionError("Failed to save settings");
      console.error("Error saving settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (
      window.confirm("Are you sure you want to reset all settings to default ?")
    ) {
      setSettings({
        darkMode: false,
        apiEndpoint: "https://goldenrod-cattle-809116.hostingersite.com",
        notificationsEnabled: true,
        itemsPerPage: 10,
        autoRefresh: false,
        refreshInterval: 5,
        timezone: "UTC",
        language: "en",
      });
      toast.info("Settings reset to defaults");
    }
  };

  return (
    <div
      className={`min-h-screen ${
        settings.darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mx-auto">
        <h1 className="text-2xl font-bold mb-6">Panel Settings</h1>

        {connectionError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
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
                <p className="text-sm text-red-700">{connectionError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Settings Section */}
          <div
            className={`p-6 rounded-lg shadow ${
              settings.darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">API Settings</h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="apiEndpoint"
                  className="block text-sm font-medium"
                >
                  API Endpoint
                </label>
                <input
                  type="text"
                  id="apiEndpoint"
                  name="apiEndpoint"
                  value={settings.apiEndpoint}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="flex my-4">
          <button
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-900 text-xs font-semibold"
          >
            {showApiDocs ? "Hide API Docs" : "Show API Docs"}
          </button>
        </div>

        {showApiDocs && (
          <div
            className={`mb-8 p-6 rounded-lg shadow ${
              settings.darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">API Documentation</h2>

            <div className="space-y-6">
              {/* Domain Endpoints */}
              <div>
                <h3 className="text-lg font-medium mb-2">Domain Endpoints</h3>

                <div className="space-y-4">
                  <div
                    className={`p-4 flex flex-col gap-4 rounded ${
                      settings.darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4 className="font-semibold">1. Get All Domains</h4>
                    <p className="text-sm mb-2">
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        GET
                      </span>{" "}
                      {settings.apiEndpoint}/getdomains.php
                    </p>
                    <div className="mt-2 flex flex-col gap-3">
                      <p className="text-sm font-medium mb-1">
                        Sample Response:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
  "status": "success",
  "data": [
    {
    "id": "12345",
    "domainName": "domain.com",
    "owner": {
        "firstName": "ivan",
        "lastName": "odeke"
    },
    "contact": {
        "email1": "iodekeivan@gmail.com",
        "email2": "iodeke256@gmail.com",
        "phone1": "+256709165008",
        "phone2": "+256772717963"
    },
    "dates": {
        "startDate": "2025-01-01",
        "expiryDate": "2025-02-01"
    },
    "package": "basic",
    "amount": 12
}
  ]
}`}
                      </pre>
                    </div>
                  </div>

                  <div
                    className={`p-4 flex flex-col gap-4 rounded ${
                      settings.darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4 className="font-semibold">2. Edit Domain</h4>
                    <p className="text-sm mb-2">
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        PUT
                      </span>{" "}
                      {settings.apiEndpoint}/updatedomain.php
                    </p>
                    <div className="mt-2 flex flex-col gap-3">
                      <p className="text-sm font-medium mb-1">
                        Sample Request:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
  "status": "success",
  "data": {
    "id": "12345",
    "domainName": "domain.com",
    "owner": {
        "firstName": "ivan",
        "lastName": "odeke"
    },
    "contact": {
        "email1": "iodekeivan@gmail.com",
        "email2": "iodeke256@gmail.com",
        "phone1": "+256709165008",
        "phone2": "+256772717963"
    },
    "dates": {
        "startDate": "2025-01-01",
        "expiryDate": "2025-02-01"
    },
    "package": "basic",
    "amount": 12
}`}
                      </pre>

                      <p className="text-sm font-medium mt-2 mb-1">
                        Sample Response:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "status": "success",
    "message": "Domain updated successfully"
}`}
                      </pre>

                      <p className="text-sm font-medium mt-2 mb-1">
                        Sample Error:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "status": "error",
    "message": "Domain not found or no changes made"
}`}
                      </pre>
                    </div>
                  </div>

                  <div
                    className={`p-4 flex flex-col gap-4 rounded ${
                      settings.darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4 className="font-semibold">3. Create Domain</h4>
                    <p className="text-sm mb-2">
                      <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                        POST
                      </span>{" "}
                      {settings.apiEndpoint}/adddomain.php
                    </p>
                    <div className="mt-2 flex flex-col gap-3">
                      <p className="text-sm font-medium mb-1">
                        Sample Request:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "domainName": "domain.com",
    "owner": {
        "firstName": "ivan",
        "lastName": "odeke"
    },
    "contact": {
        "email1": "iodekeivan@gmail.com",
        "email2": "iodeke256@gmail.com",
        "phone1": "+256709165008",
        "phone2": "+256772717963"
    },
    "dates": {
        "startDate": "2025-01-01",
        "expiryDate": "2025-02-01"
    },
    "package": "basic",
    "amount": 12
}`}
                      </pre>
                      <p className="text-sm font-medium mt-2 mb-1">
                        Sample Response:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "status": "success",
    "message": "Domain added successfully",
    "domainId": "6803aa69d5a8f"
}`}
                      </pre>

                      <p className="text-sm font-medium mt-2 mb-1">
                        Sample Error:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "status": "error",
    "message": "Domain already exists or is duplicated"
}`}
                      </pre>
                    </div>
                  </div>

                  <div
                    className={`p-4 flex flex-col gap-4 rounded ${
                      settings.darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4 className="font-semibold">4. Delete Domain</h4>
                    <p className="text-sm mb-2">
                      <span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                        DELETE
                      </span>{" "}
                      {settings.apiEndpoint}/deletedomain.php
                    </p>
                    <div className="mt-2 flex flex-col gap-3">
                      <p className="text-sm font-medium mb-1">
                        Sample Request:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
  "id": "12345"
}`}
                      </pre>
                      <p className="text-sm font-medium mt-2 mb-1">
                        Sample Response:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "status": "success",
    "message": "Domain deleted successfully"
}`}
                      </pre>

                      <p className="text-sm font-medium mt-2 mb-1">
                        Sample Error:
                      </p>
                      <pre
                        className={`text-xs p-3 rounded overflow-x-auto ${
                          settings.darkMode ? "bg-gray-900" : "bg-gray-100"
                        }`}
                      >
                        {`{
    "status": "error",
    "message": "Domain not found"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
