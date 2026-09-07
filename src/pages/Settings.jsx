import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonList,
  IonAvatar,
} from '@ionic/react';
import {
  phonePortraitOutline,
  personCircleOutline,
  personAddOutline,
  searchOutline,
  qrCodeOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  logOutOutline,
  globeOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { getBaseUrl, setBaseUrl, searchGuards } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings({ history }) {
  const {
    device,
    onDutyGuards,
    selectedGate,
    refreshGuards,
    addGuardToDuty,
    removeGuardFromDuty,
    logout,
  } = useAuth();

  const [apiUrl, setApiUrl] = useState(getBaseUrl());
  const [toastMsg, setToastMsg] = useState('');
  
  // Guard search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Badge Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    refreshGuards();
    return () => {
      stopScanner();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    };
  }, []);

  // Live Guard Search (Name, Phone Suffix 4-10 digits, or Badge Code)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchGuards(searchQuery.trim());
        if (res.success && res.guards) {
          setSearchResults(res.guards);
        }
      } catch (err) {
        console.warn('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleAddGuard = async (guard) => {
    setActionLoading(true);
    try {
      const res = await addGuardToDuty(guard.id);
      if (res.success) {
        setToastMsg(`${guard.name} is now ON DUTY on this device!`);
        setSearchQuery('');
        setSearchResults([]);
        setShowScanner(false);
        stopScanner();
      } else {
        setToastMsg(res.message || 'Failed to add guard.');
      }
    } catch (err) {
      setToastMsg('Error putting guard on duty.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveGuard = async (session) => {
    setActionLoading(true);
    try {
      const res = await removeGuardFromDuty(session.id, session.guard_id);
      if (res.success) {
        setToastMsg(`${session.guard_name} is now OFF DUTY.`);
      } else {
        setToastMsg(res.message || 'Failed to check out guard.');
      }
    } catch (err) {
      setToastMsg('Error relieving guard.');
    } finally {
      setActionLoading(false);
    }
  };

  // Badge Scanner start/stop
  const startScanner = async () => {
    setShowScanner(true);
    setScannerError('');
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setTimeout(async () => {
        try {
          html5QrCodeRef.current = new Html5Qrcode('guard-badge-reader');
          await html5QrCodeRef.current.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 200, height: 200 } },
            async (decodedText) => {
              stopScanner();
              setShowScanner(false);
              setSearchQuery(decodedText.trim());
            },
            () => {}
          );
        } catch (e) {
          setScannerError('Camera access failed or denied.');
        }
      }, 300);
    } catch (err) {
      setScannerError('Could not initialize camera scanner.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {}
    }
    setShowScanner(false);
  };

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    setBaseUrl(apiUrl);
    setToastMsg('Server API connection URL updated successfully!');
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const deviceId = device?.device_id || 'DEV-NORTH-01';
  const deviceName = device?.device_name || 'North Gate Terminal Phone';
  const gateDisplay = (selectedGate || device?.gate_name || 'NORTH_GATE').replace('_', ' ');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Settings & Duty Roster</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* 1. Ashram Device Info Card (Gate Info is assigned by Super Admin) */}
        <IonCard className="card-wireframe" style={{ borderTop: '4px solid #800000' }}>
          <IonCardContent className="ion-padding" style={{ padding: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IonIcon icon={phonePortraitOutline} style={{ fontSize: '24px', color: '#800000' }} />
                <div>
                  <strong style={{ fontSize: '0.98rem', color: '#1e293b' }}>{deviceName}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                    Device ID: <strong>{deviceId}</strong>
                  </span>
                </div>
              </div>
              <IonBadge color="success">ENROLLED</IonBadge>
            </div>

            <div style={{ marginTop: '0.8rem', paddingTop: '0.7rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Assigned Gate (Fixed by Super Admin):</span>
                <strong style={{ fontSize: '0.85rem', color: '#800000' }}>{gateDisplay}</strong>
              </div>
              <IonBadge color="warning" style={{ fontSize: '0.68rem' }}>SUPER ADMIN ASSIGNED</IonBadge>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 2. On-Duty Guards Roster Management */}
        <IonCard className="card-wireframe" style={{ borderTop: '4px solid #16a34a' }}>
          <IonCardContent className="ion-padding" style={{ padding: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IonIcon icon={shieldCheckmarkOutline} style={{ color: '#16a34a' }} />
                  Currently On-Duty Guards
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Guards actively assigned to this terminal
                </span>
              </div>
              <IonBadge color="primary" style={{ fontSize: '0.78rem' }}>
                {onDutyGuards.length} ACTIVE
              </IonBadge>
            </div>

            {/* List of active guards on this device */}
            {onDutyGuards.length > 0 ? (
              <IonList lines="full" style={{ background: 'transparent', padding: 0 }}>
                {onDutyGuards.map((session) => (
                  <div 
                    key={session.id || session.guard_id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.5rem', background: '#f8fafc', borderRadius: '10px',
                      marginBottom: '0.4rem', border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <IonIcon icon={personCircleOutline} style={{ fontSize: '32px', color: '#16a34a' }} />
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#1e293b', display: 'block' }}>
                          {session.guard_name}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                          📱 {session.guard_phone || 'No phone'} {session.guard_code ? `• Code: ${session.guard_code}` : ''}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block' }}>
                          Checked in: {new Date(session.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <IonButton
                      size="small"
                      color="danger"
                      fill="outline"
                      style={{ fontSize: '0.7rem', fontWeight: 'bold', height: '28px' }}
                      onClick={() => handleRemoveGuard(session)}
                      disabled={actionLoading}
                    >
                      End Duty
                    </IonButton>
                  </div>
                ))}
              </IonList>
            ) : (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem', textAlign: 'center', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 'bold' }}>
                  No guards are currently logged on duty for this device.
                </span>
              </div>
            )}

            <hr style={{ margin: '0.9rem 0', borderColor: '#f1f5f9' }} />

            {/* Add Guard Section with Search by Phone Suffix (4-10 digits), Name, or Scan Badge */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong style={{ fontSize: '0.82rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ➕ Add Guard to Duty
                </strong>
                <IonButton 
                  size="small" 
                  fill="outline" 
                  style={{ '--color': '#800000', '--border-color': '#800000', fontSize: '0.72rem', height: '24px', fontWeight: 'bold' }}
                  onClick={() => {
                    if (showScanner) stopScanner();
                    else startScanner();
                  }}
                >
                  <IonIcon slot="start" icon={qrCodeOutline} />
                  {showScanner ? 'Close Scanner' : 'Scan Badge'}
                </IonButton>
              </div>

              {/* In-page Badge Scanner */}
              {showScanner && (
                <div style={{ textAlign: 'center', margin: '0.8rem 0', padding: '0.6rem', background: '#000000', borderRadius: '12px' }}>
                  <div id="guard-badge-reader" style={{ width: '220px', minHeight: '180px', margin: '0 auto' }}></div>
                  {scannerError && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0 0' }}>{scannerError}</p>}
                  <p style={{ color: '#ffffff', fontSize: '0.72rem', margin: '0.4rem 0 0 0' }}>
                    Point camera at Guard Badge / ID Code
                  </p>
                </div>
              )}

              {/* Flexible Search Input (Name, Phone Suffix 4-10 digits, or Badge ID) */}
              <IonItem lines="full" style={{ background: '#f8fafc', borderRadius: '8px', margin: '0.4rem 0' }}>
                <IonIcon icon={searchOutline} slot="start" style={{ color: '#800000' }} />
                <IonLabel position="floating">Search by Name, Phone (last 4-10 digits), or Guard Code</IonLabel>
                <IonInput
                  value={searchQuery}
                  onIonChange={(e) => setSearchQuery(e.detail.value)}
                  placeholder="e.g. Ramesh, 3213, +91 9876543213, GRD-9"
                  clearInput
                />
              </IonItem>

              {searching && (
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <IonSpinner name="dots" />
                </div>
              )}

              {/* Real-time search matches dropdown */}
              {searchResults.length > 0 && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', marginTop: '0.3rem' }}>
                  {searchResults.map((g) => (
                    <div 
                      key={g.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.55rem 0.7rem', borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: '#1e293b', display: 'block' }}>{g.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          📱 {g.phone} {g.guid ? `• ${g.guid}` : ''}
                        </span>
                      </div>
                      <IonButton
                        size="small"
                        style={{ '--background': '#16a34a', fontSize: '0.72rem', fontWeight: 'bold', height: '26px' }}
                        onClick={() => handleAddGuard(g)}
                        disabled={actionLoading}
                      >
                        + On Duty
                      </IonButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* 3. Backend Cloud Connection Endpoint */}
        <IonCard className="card-wireframe">
          <IonCardContent className="ion-padding" style={{ padding: '0.9rem' }}>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IonIcon icon={globeOutline} style={{ color: '#800000' }} />
              Backend Cloud Server Connection
            </h4>
            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.75rem', color: '#64748b' }}>
              Configured API endpoint. Automatically routes to cloud server or local proxy.
            </p>

            <form onSubmit={handleSaveApiUrl}>
              <IonItem lines="full">
                <IonLabel position="floating">API Server Endpoint</IonLabel>
                <IonInput 
                  value={apiUrl} 
                  onIonChange={(e) => setApiUrl(e.detail.value)} 
                  placeholder="https://smsavmsserver.onrender.com/api" 
                  required
                />
              </IonItem>
              <IonButton expand="block" type="submit" size="small" style={{ '--background': '#800000', fontWeight: 'bold', marginTop: '0.7rem' }}>
                UPDATE ENDPOINT
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>

        {/* 4. Disconnect Ashram Device */}
        <IonButton 
          expand="block" 
          fill="outline" 
          style={{ '--color': '#dc2626', '--border-color': '#dc2626', fontWeight: 'bold', marginTop: '1.2rem', marginBottom: '1.5rem' }} 
          onClick={handleLogout}
        >
          <IonIcon slot="start" icon={logOutOutline} />
          DISCONNECT / RE-ENROLL DEVICE
        </IonButton>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
