import React, { useState, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import DomainTable from './DomainTable';
import { categorizeDomains } from '../../utils/helpers';

const ExpiredDomainTabs = ({ domains = [], onEdit, onDelete, onRefresh }) => {
  const [statusChecks, setStatusChecks] = useState({});
  
  // Use the same categorization logic as in DomainTabs
  const categories = useMemo(() => {
    try {
      const categorized = categorizeDomains(domains);
      return categorized;
    } catch (error) {
      console.error('Error categorizing domains:', error);
      return {
        active: [],
        expiring7Days: [],
        expiring30Days: [],
        expired: [],
        redemption: []
      };
    }
  }, [domains]);
  
  // Define tabs for expired domains page
  const tabs = [
    { id: 'expired', label: 'Expired', domains: categories.expired },
    { id: 'redemption', label: 'Redemption', domains: categories.redemption },
  ];

  console.log("All domains received:", domains);
  console.log("Categorized expired domains:", categories.expired);
  console.log("Categorized redemption domains:", categories.redemption);

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
              {tab.label} ({tab.domains.length})
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="p-6">
          {tabs.map((tab) => (
            <Tab.Panel key={tab.id}>
              {tab.domains.length > 0 ? (
                <DomainTable
                  domains={tab.domains}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  statusChecks={statusChecks}
                  refreshDomains={onRefresh}
                  showDaysUntilExpiry={false}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No domains in {tab.label.toLowerCase()} status
                </div>
              )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ExpiredDomainTabs;