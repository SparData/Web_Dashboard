import React from 'react';
import SkuAvailabilityTable from '../components/SkuAvailabilityTable';

function ProductInsights() {
  return (
    <div className="fade-in">
      <SkuAvailabilityTable />
    </div>
  );
}

export default React.memo(ProductInsights);
