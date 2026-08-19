import React, { useState } from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('User Name and Password are required.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const users = {
        'admin': { email: 'admin@bi.com', role: 'Administrator', dashboardId: 'full' },
        'admin@bi.com': { email: 'admin@bi.com', role: 'Administrator', dashboardId: 'full' },
        'client1': { email: 'client1@bi.com', role: 'Client 1 (Ad Focus)', brandLimit: 'Gulab', dashboardId: 'ads-focus' },
        'client1@bi.com': { email: 'client1@bi.com', role: 'Client 1 (Ad Focus)', brandLimit: 'Gulab', dashboardId: 'ads-focus' },
        'client2': { email: 'client2@bi.com', role: 'Client 2 (Catalog Focus)', brandLimit: 'Jivo', dashboardId: 'catalog-focus' },
        'client2@bi.com': { email: 'client2@bi.com', role: 'Client 2 (Catalog Focus)', brandLimit: 'Jivo', dashboardId: 'catalog-focus' },
        'client3': { email: 'client3@bi.com', role: 'Client 3 (Executive)', dashboardId: 'full' },
        'client3@bi.com': { email: 'client3@bi.com', role: 'Client 3 (Executive)', dashboardId: 'full' }
      };

      const matchedUser = users[username.toLowerCase().trim()];

      if (matchedUser && password === 'password') {
        onLogin(matchedUser);
      } else {
        setError('Invalid User Name or Password. Try client1, client2, client3, or admin.');
      }
    }, 600);
  };

  const handleClear = () => {
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 1. Corporate Header Navigation Bar */}
      <header style={{
        backgroundColor: '#002f6c',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '65px',
        padding: 0,
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Slanted Logo Container */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '0 45px 0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          clipPath: 'polygon(0 0, 88% 0, 100% 100%, 0 100%)',
          zIndex: 10
        }}>
          {/* Actual logo image provided by user */}
          <img
            src="/logo.jpg"
            alt="SAPERE KROGNOS Logo"
            style={{
              height: '42px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>

        {/* Tab Navigation Menu */}
        <nav style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '100%',
          marginRight: '10px'
        }}>
          {[
            'Home',
            'About Us',
            'Our Services',
            'Technology & Processes',
            'Case Studies',
            'SPAR KROGNOS Login',
            'Offices',
            'SPAR International'
          ].map((tab, idx) => {
            const isActive = tab === 'SPAR KROGNOS Login';
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#f5a623',
                  color: '#000000',
                  padding: '0 16px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderLeft: '1px solid #002f6c',
                  borderRight: idx === 7 ? '1px solid #002f6c' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
              >
                {tab}
              </div>
            );
          })}
        </nav>
      </header>

      {/* 2. Main Login Workspace Area */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        background: '#ffffff'
      }}>
        {/* Page Titles */}
        <h1 style={{
          color: '#1a365d',
          fontSize: '1.85rem',
          fontWeight: 'normal',
          textAlign: 'center',
          marginBottom: '8px',
          fontFamily: 'sans-serif'
        }}>
          Powered by SPARView™ Technology
        </h1>
        <h2 style={{
          color: '#1a365d',
          fontSize: '1.5rem',
          fontWeight: 'normal',
          textAlign: 'center',
          marginBottom: '36px',
          fontFamily: 'sans-serif'
        }}>
          Client Dashboard Login
        </h2>

        {/* Error message Alert */}
        {error && (
          <div className="fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: '4px',
            padding: '10px 16px',
            color: '#c62828',
            fontSize: '0.85rem',
            marginBottom: '20px',
            width: '100%',
            maxWidth: '520px',
            boxSizing: 'border-box'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Card */}
        <div style={{
          width: '100%',
          maxWidth: '520px',
          border: '1px solid #cccccc',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#fbfbfb',
          boxSizing: 'border-box'
        }}>
          {/* Card Header Bar */}
          <div style={{
            backgroundColor: '#283890',
            color: '#ffffff',
            padding: '14px',
            textAlign: 'center',
            fontSize: '1.15rem',
            fontWeight: 'bold'
          }}>
            Login
          </div>

          {/* Form Fields Body */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 36px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* User Name Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{
                  fontWeight: 'bold',
                  color: '#000000',
                  fontSize: '0.95rem',
                  width: '120px',
                  textAlign: 'left'
                }}>
                  User Name
                </label>
                <input
                  type="text"
                  style={{
                    flexGrow: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    border: '1px solid #b0bec5',
                    borderRadius: '3px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#000000'
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Password Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{
                  fontWeight: 'bold',
                  color: '#000000',
                  fontSize: '0.95rem',
                  width: '120px',
                  textAlign: 'left'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  style={{
                    flexGrow: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    border: '1px solid #b0bec5',
                    borderRadius: '3px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#000000'
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

            </div>
          </form>

          {/* Card Buttons Footer */}
          <div style={{
            backgroundColor: '#283890',
            padding: '12px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            borderTop: '1px solid #cccccc'
          }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: '#cbdcf7',
                color: '#000000',
                border: '1px solid #b0bec5',
                borderRadius: '3px',
                padding: '6px 24px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Please wait...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{
                backgroundColor: '#cbdcf7',
                color: '#000000',
                border: '1px solid #b0bec5',
                borderRadius: '3px',
                padding: '6px 24px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          {/* Card Help Links */}
          <div style={{
            padding: '12px',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '0.85rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #eeeeee'
          }}>
            <a href="#forgot-user" style={{
              color: '#0288d1',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <User size={14} /> Forgot Username
            </a>
            <a href="#forgot-pass" style={{
              color: '#0288d1',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Lock size={14} /> Forgot Password
            </a>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '24px',
          fontSize: '0.8rem',
          color: '#666666',
          textAlign: 'center',
          maxWidth: '520px',
          lineHeight: '1.5'
        }}>
          <strong>Demo Logins (Password is always <code>password</code>):</strong><br/>
          🔑 <code style={{ backgroundColor: '#eeeeee', padding: '2px 4px', borderRadius: '3px' }}>client1</code> - Opens <strong>Dashboard 1</strong> (Ads Focus for Gulab)<br/>
          🔑 <code style={{ backgroundColor: '#eeeeee', padding: '2px 4px', borderRadius: '3px' }}>client2</code> - Opens <strong>Dashboard 2</strong> (Catalog Focus for Jivo)<br/>
          🔑 <code style={{ backgroundColor: '#eeeeee', padding: '2px 4px', borderRadius: '3px' }}>client3</code> (or <code style={{ backgroundColor: '#eeeeee', padding: '2px 4px', borderRadius: '3px' }}>admin</code>) - Opens <strong>Dashboard 3</strong> (Full Access)
        </div>
      </main>
    </div>
  );
}
