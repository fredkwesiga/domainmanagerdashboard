import React from 'react';
import DomainCard from './DomainCard';

const DomainList = ({ domains, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {domains.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No domains found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DomainList;