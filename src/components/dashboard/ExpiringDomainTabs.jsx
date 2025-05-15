import React, { useState, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import DomainTable from './DomainTable';
import { categorizeDomains } from '../../utils/helpers';

const ExpiringDomainTabs = ({ domains = [], onEdit, onDelete, onRefresh }) => {
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
  
  // Define the tabs for expiring domains only
  const tabs = [
    { id: '7days', label: 'Expiring in 7 Days', domains: categories.expiring7Days },
    { id: '30days', label: 'Expiring in 30 Days', domains: categories.expiring30Days },
  ];

  console.log("All domains received:", domains);
  console.log("Categorized 7-day expiring domains:", categories.expiring7Days);
  console.log("Categorized 30-day expiring domains:", categories.expiring30Days);

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
                  showDaysUntilExpiry={true}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No domains expiring {tab.id === '7days' ? 'in the next 7 days' : 'in the next 30 days'}
                </div>
              )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ExpiringDomainTabs;