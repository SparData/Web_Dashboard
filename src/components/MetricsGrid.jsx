import React from 'react';
import { Eye, DollarSign, Award, Users, AlertTriangle, Percent, ShoppingBag, CheckCircle2 } from 'lucide-react';

export default function MetricsGrid({ stats, onKpiClick }) {
  const cards = [
    {
      key: 'distinctProducts',
      label: 'Total Products',
      value: stats.distinctProducts.value,
      unit: stats.distinctProducts.unit,
      className: 'warning',
      icon: <ShoppingBag size={18} style={{ color: 'var(--warning)' }} />
    },
    {
      key: 'totalBrands',
      label: 'Total Brands',
      value: stats.totalBrands.value,
      unit: stats.totalBrands.unit,
      className: 'magenta',
      icon: <Users size={18} style={{ color: 'var(--accent)' }} />
    },
    {
      key: 'avgPrice',
      label: 'Avg Product Price',
      value: `₹${stats.avgPrice.value}`,
      unit: stats.avgPrice.unit !== '₹' ? stats.avgPrice.unit : '',
      className: 'indigo',
      icon: <DollarSign size={18} style={{ color: 'var(--primary)' }} />
    },
    {
      key: 'avgRating',
      label: 'Average Rating',
      value: `${stats.avgRating.value}`,
      unit: stats.avgRating.unit,
      className: 'green',
      icon: <Award size={18} style={{ color: 'var(--success)' }} />
    },
    {
      key: 'availabilityRate',
      label: 'Active Product %',
      value: `${stats.availabilityRate.value}%`,
      unit: '',
      className: stats.availabilityRate.value < 90 ? 'danger' : 'green',
      icon: <CheckCircle2 size={18} style={{ color: stats.availabilityRate.value < 90 ? 'var(--danger)' : 'var(--success)' }} />
    },
    {
      key: 'avgDiscount',
      label: 'Avg Discount',
      value: `${stats.avgDiscount.value}%`,
      unit: '',
      className: 'purple',
      icon: <Percent size={18} style={{ color: '#a855f7' }} />
    },
    {
      key: 'outOfStockRate',
      label: 'Out of Stock %',
      value: `${stats.outOfStockRate.value}%`,
      unit: '',
      className: stats.outOfStockRate.value > 10 ? 'danger' : 'cyan',
      icon: <AlertTriangle size={18} style={{ color: stats.outOfStockRate.value > 10 ? 'var(--danger)' : 'var(--secondary)' }} />
    }
  ];

  return (
    <div className="kpi-grid fade-in">
      {cards.map((card) => {
        return (
          <div 
            key={card.key} 
            className={`kpi-card glass-interactive ${card.className}`}
            onClick={() => onKpiClick && onKpiClick(card.key)}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-header">
              <span>{card.label}</span>
              <div className="kpi-icon">
                {card.icon}
              </div>
            </div>
            
            <div className="kpi-value-container" style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px' }}>
              <span className="kpi-value" style={{ margin: 0 }}>{card.value}</span>
              {card.unit && <span className="kpi-unit" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{card.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
