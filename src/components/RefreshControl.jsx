import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Check } from 'lucide-react';

const REFRESH_OPTIONS = [
  { value: 0, label: 'Off', desc: 'Manual sync only' },
  { value: 10, label: '10s', desc: 'High frequency (Live)' },
  { value: 30, label: '30s', desc: 'Recommended (Balanced)' },
  { value: 60, label: '1m', desc: 'Standard update' },
  { value: 300, label: '5m', desc: 'Low frequency' }
];

function RefreshControl({
  refreshInterval,
  onIntervalChange,
  countdown,
  isRefreshing,
  onManualRefresh,
  lastSyncTime,
  dbStatus
}) {
  const [relativeTime, setRelativeTime] = useState('Just now');
  const [showDropdown, setShowDropdown] = useState(false);

  // Update relative time ("Just now", "Xm ago") every 10 seconds
  useEffect(() => {
    if (!lastSyncTime) {
      setRelativeTime('Pending');
      return;
    }

    const updateRelative = () => {
      const now = new Date();
      const syncDate = new Date(lastSyncTime);
      const diffSec = Math.floor((now - syncDate) / 1000);

      if (diffSec < 5) {
        setRelativeTime('Just now');
      } else if (diffSec < 60) {
        setRelativeTime(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        setRelativeTime(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setRelativeTime(syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateRelative();
    const interval = setInterval(updateRelative, 5000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.refresh-selector-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const currentOption = REFRESH_OPTIONS.find(opt => opt.value === refreshInterval) || REFRESH_OPTIONS[2];
  const isAutoEnabled = refreshInterval > 0;

  return (
    <div className="refresh-control-bar" role="region" aria-label="Data refresh controls">
      {/* 1. Live Countdown / Status Indicator */}
      <div 
        className={`refresh-status-badge ${isRefreshing ? 'syncing' : isAutoEnabled ? 'active' : 'paused'}`}
        title={
          isRefreshing 
            ? 'Fetching latest records from PostgreSQL database...' 
            : dbStatus === 'offline'
              ? 'Backend server is unreachable. Auto-refresh will continue retrying.'
              : isAutoEnabled 
                ? `Auto-refresh active: querying database in ${countdown}s` 
                : 'Auto-refresh paused. Click Refresh to manually update.'
        }
      >
        <span className="refresh-pulse-dot" />
        <span className="refresh-status-text">
          {isRefreshing ? (
            'Syncing...'
          ) : isAutoEnabled ? (
            <>
              Next: <strong>{countdown}s</strong>
            </>
          ) : (
            'Auto: Off'
          )}
        </span>
      </div>

      {/* 2. Refresh Rate Interval Dropdown */}
      <div className="refresh-selector-container">
        <button
          type="button"
          className="refresh-interval-trigger"
          onClick={() => setShowDropdown(prev => !prev)}
          title="Select dashboard auto-refresh rate"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        >
          <Clock size={13} className="refresh-clock-icon" />
          <span className="refresh-interval-label">
            {refreshInterval === 0 ? 'Manual' : `Every ${currentOption.label}`}
          </span>
          <span className="refresh-caret">▾</span>
        </button>

        {showDropdown && (
          <div className="refresh-dropdown-menu" role="listbox">
            <div className="refresh-dropdown-header">Auto-Refresh Rate</div>
            {REFRESH_OPTIONS.map((opt) => {
              const isSelected = opt.value === refreshInterval;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`refresh-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onIntervalChange(opt.value);
                    setShowDropdown(false);
                  }}
                >
                  <div className="refresh-item-left">
                    <span className="refresh-item-label">{opt.label}</span>
                    <span className="refresh-item-desc">{opt.desc}</span>
                  </div>
                  {isSelected && <Check size={14} className="refresh-check-icon" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Manual Refresh Button */}
      <button
        type="button"
        className={`refresh-action-btn ${isRefreshing ? 'spinning' : ''}`}
        onClick={onManualRefresh}
        disabled={isRefreshing}
        title="Force refresh database records now (bypasses cache)"
      >
        <RefreshCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
        <span>{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
      </button>

      {/* 4. Last Sync Timestamp */}
      <div 
        className="refresh-last-sync"
        title={lastSyncTime ? `Last database synchronization: ${new Date(lastSyncTime).toLocaleString()}` : 'Syncing'}
      >
        <span className="last-sync-caption">Synced:</span>
        <span className="last-sync-value">{relativeTime}</span>
      </div>
    </div>
  );
}

export default React.memo(RefreshControl);
