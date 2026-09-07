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
  IonSegment,
  IonSegmentButton,
  IonToast,
  IonBadge,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { qrCodeOutline, cameraOutline, refreshOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { verifyGatePass, processGateMovement } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ScanEntry({ history }) {
  const { selectedGate } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState('IN');
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const html5QrCodeRef = useRef(null);

  const cleanDecodedCode = (text) => {
    if (!text) return '';
    let str = text.trim();
    if (str.startsWith('{')) {
      try {
        const obj = JSON.parse(str);
        return obj.pass_code || obj.passCode || obj.code || obj.id || str;
      } catch (e) {}
    }
    if (str.includes('/')) {
      const parts = str.split('/');
      return parts[parts.length - 1] || str;
    }
    return str;
  };

  const startScanner = async () => {
    setCameraError('');
    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {}
      }
      const qrElement = document.getElementById('qr-reader');
      if (!qrElement) return;

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      setIsScanning(true);
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          const code = cleanDecodedCode(decodedText);
          setSearchQuery(code);
          stopScanner();
          handleVerifyByCode(code);
        },
        (errorMessage) => {
          // ignore scan errors
        }
      );
    } catch (err) {
      setIsScanning(false);
      setCameraError('Camera access unavailable or permission denied.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // Safe silence for scanner teardown
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) startScanner();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    };
  }, []);

  const handleVerifyByCode = async (codeToVerify) => {
    const code = codeToVerify || searchQuery;
    if (!code) return;
    setLoading(true);
    setPassData(null);
    try {
      const res = await verifyGatePass(code);
      if (res.success && res.pass) {
        setPassData(res.pass);
        setToastMsg('Pass verified successfully!');
      } else {
        setToastMsg(res.message || 'Gate pass not found.');
      }
    } catch (err) {
      setToastMsg('Gate pass not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e) => {
    e?.preventDefault();
    handleVerifyByCode(searchQuery);
  };

  const handleGateMovement = async () => {
    if (!passData) return;
    try {
      const res = await processGateMovement({
        registration_id: passData.id,
        gate_name: selectedGate,
        direction: direction,
        person_count: passData.person_count || 1,
        vehicle_no: passData.vehicle_no || '',
      });
      if (res.success) {
        setToastMsg(`Movement recorded: ${direction} at ${selectedGate}!`);
        setPassData((prev) => ({ ...prev, status: res.status }));
      } else {
        setToastMsg(res.message || 'Movement failed.');
      }
    } catch (err) {
      setToastMsg('Failed to record gate movement.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Scan Entry</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* Live Camera Viewport */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{
            width: '280px', minHeight: '250px', margin: '0 auto', border: isScanning ? '3px solid #16a34a' : '3px dashed #800000',
            borderRadius: '16px', background: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
          }}>
            
            <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>

            {!isScanning && (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <IonIcon icon={qrCodeOutline} style={{ fontSize: '64px', color: '#800000', marginBottom: '0.5rem' }} />
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                  {cameraError || 'Tap button to start camera scan'}
                </p>
                <IonButton 
                  size="small" 
                  onClick={startScanner}
                  style={{ '--background': '#800000', fontWeight: 'bold' }}
                >
                  <IonIcon slot="start" icon={cameraOutline} />
                  START SCANNER
                </IonButton>
              </div>
            )}

            {isScanning && (
              <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
                <IonButton 
                  size="small" 
                  color="danger" 
                  fill="solid"
                  onClick={stopScanner}
                  style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  STOP CAMERA
                </IonButton>
              </div>
            )}
          </div>
        </div>

        {/* Direction Toggle matching Screen 3 (Entry / Exit) */}
        <div style={{ marginBottom: '1rem' }}>
          <IonSegment value={direction} onIonChange={(e) => setDirection(e.detail.value)} style={{ background: '#e2e8f0', borderRadius: '10px' }}>
            <IonSegmentButton value="IN" style={{ '--color-checked': '#15803d', fontWeight: 'bold' }}>
              <IonLabel>Entry (IN)</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="OUT" style={{ '--color-checked': '#dc2626', fontWeight: 'bold' }}>
              <IonLabel>Exit (OUT)</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Search by Passcode or Phone Form */}
        <IonCard className="card-wireframe">
          <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
            <form onSubmit={handleVerify}>
              <IonItem lines="full">
                <IonLabel position="floating">Search by Pass Code / ID / Phone / Vehicle</IonLabel>
                <IonInput 
                  value={searchQuery} 
                  onIonChange={(e) => setSearchQuery(e.detail.value)} 
                  placeholder="e.g. PASS-1001, MAID-5001, +91..." 
                  required
                />
              </IonItem>
              <IonButton expand="block" type="submit" style={{ '--background': '#800000', fontWeight: 'bold', marginTop: '0.8rem' }}>
                {loading ? <IonSpinner name="crescent" /> : 'VERIFY GATE PASS'}
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>

        {/* Verification Result Card */}
        {passData && (
          <IonCard className="card-wireframe" style={{ borderLeft: '6px solid #15803d', background: '#f0fdf4' }}>
            <IonCardContent className="ion-padding" style={{ padding: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <IonBadge color="success" style={{ fontSize: '0.75rem' }}>VALID PASS</IonBadge>
                  <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 'bold' }}>
                    {passData.visitor_name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                    Host: <strong>{passData.host_name || 'Ashram Resident'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Pass Code: <strong>{passData.pass_code}</strong> | Status: {passData.status}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <IonButton 
                  expand="block" 
                  style={{ flex: 1, '--background': direction === 'IN' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}
                  onClick={handleGateMovement}
                >
                  CONFIRM {direction} MOVEMENT
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
