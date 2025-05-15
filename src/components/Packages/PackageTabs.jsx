import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import PackagesTable from './PackageTable';

const PackagesTabs = ({ packages = [], onDelete, refreshPackages }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Tabs for packages
  const tabs = [
    { id: 'all', label: 'All Packages', packages: packages },
    { id: 'monthly', label: 'Monthly', packages: packages.filter(pkg => pkg.duration.unit === 'month') },
    { id: 'yearly', label: 'Yearly', packages: packages.filter(pkg => pkg.duration.unit === 'year') },
    { id: 'weekly', label: 'Weekly', packages: packages.filter(pkg => pkg.duration.unit === 'week') },
    { id: 'daily', label: 'Daily', packages: packages.filter(pkg => pkg.duration.unit === 'day') },
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <Tab.Group>
        <Tab.List className="flex overflow-x-auto border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                `px-4 py-3 text-xs font-medium whitespace-nowrap focus:outline-none ${
                  selected
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              {tab.label} ({tab.packages.length})
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="p-6">
          {tabs.map((tab) => (
            <Tab.Panel key={tab.id}>
              <PackagesTable
                packages={tab.packages}
                onDelete={onDelete}
                isLoading={isLoading}
                refreshPackages={refreshPackages}
              />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PackagesTabs;