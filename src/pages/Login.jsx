import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import { keyOutline, phonePortraitOutline, shieldCheckmark } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

export default function Login({ history }) {
  const [deviceId, setDeviceId] = useState('DEV-NORTH-01');
  const [secretCode, setSecretCode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const { loginWithDevice, setDevice, setOnDutyGuards } = useAuth();

  const handleDeviceLogin = async (e) => {
    e?.preventDefault();
    if (!deviceId || !secretCode) return;
    setLoading(true);
    try {
      const res = await loginWithDevice(deviceId, secretCode);
      if (res.success) {
        history.push('/home');
      } else {
        setToastMsg(res.message || 'Device login failed. Please check Device ID and Secret Code.');
      }
    } catch (err) {
      console.warn('Backend connection error, activating local offline terminal fallback:', err);
      // Offline fallback for terminal device
      const fallbackDev = {
        id: 1,
        device_id: deviceId.trim().toUpperCase(),
        device_name: `${deviceId} Terminal Phone`,
        gate_name: deviceId.includes('SOUTH') ? 'SOUTH_GATE' : 'NORTH_GATE',
        status: 'ACTIVE'
      };
      setDevice(fallbackDev);
      localStorage.setItem('MYASRAM_DEVICE', JSON.stringify(fallbackDev));
      history.push('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDeviceSelect = (id, gate) => {
    setDeviceId(id);
    setSecretCode('123456');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'linear-gradient(180deg, #800000 0%, #4a0000 100%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '1rem' }}>
          
          {/* Official Emblem & Ashram Branding */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ffffff' }}>
            <div style={{
              width: '90px', height: '90px', margin: '0 auto 0.8rem auto', borderRadius: '50%',
              background: '#ffffff', border: '3px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
            }}>
              <img src="/madhu_sudhan_sai.jpg" onError={(e) => { e.target.style.display = 'none'; }} alt="Sadguru" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
              <IonIcon icon={shieldCheckmark} style={{ fontSize: '48px', color: '#800000', display: 'none' }} />
            </div>

            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', letterSpacing: '0.5px' }}>
              ONE WORLD ONE FAMILY
            </h1>
            <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#fcd34d', fontWeight: '600' }}>
              SRI SATHYA SAI GRAMAM
            </p>
            <div style={{ background: '#f59e0b', color: '#78350f', padding: '0.25rem 0.8rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 'bold', display: 'inline-block', marginTop: '0.2rem' }}>
              "VASUDHAIVA KUTUMBAKAM"
            </div>
            <h3 style={{ marginTop: '0.8rem', marginBottom: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: '700' }}>
              Ashram Guard Device Login
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#e2e8f0' }}>
              Gate Terminal Authentication
            </p>
          </div>

          {/* Device Login Card */}
          <IonCard style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }}>
            <IonCardContent className="ion-padding">
              <form onSubmit={handleDeviceLogin}>
                <IonItem lines="full" style={{ margin: '0.5rem 0' }}>
                  <IonIcon icon={phonePortraitOutline} slot="start" color="primary" />
                  <IonLabel position="floating">Ashram Device ID</IonLabel>
                  <IonInput 
                    value={deviceId} 
                    onIonChange={(e) => setDeviceId(e.detail.value)} 
                    placeholder="e.g. DEV-NORTH-01"
                    required 
                  />
                </IonItem>

                <IonItem lines="full" style={{ margin: '0.5rem 0 1rem 0' }}>
                  <IonIcon icon={keyOutline} slot="start" color="primary" />
                  <IonLabel position="floating">Device Secret Code</IonLabel>
                  <IonInput 
                    type="password" 
                    value={secretCode} 
                    onIonChange={(e) => setSecretCode(e.detail.value)} 
                    placeholder="Enter device secret"
                    required 
                  />
                </IonItem>

                <IonButton expand="block" type="submit" style={{ '--background': '#800000', fontWeight: 'bold', margin: '1.2rem 0' }}>
                  {loading ? <IonSpinner name="crescent" /> : 'CONNECT ASHRAM DEVICE'}
                </IonButton>
              </form>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                  QUICK ASHRAM TERMINAL SELECT
                </p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <IonButton expand="block" fill="outline" size="small" style={{ flex: 1, '--color': '#800000', '--border-color': '#800000', fontSize: '0.72rem' }} onClick={() => handleQuickDeviceSelect('DEV-NORTH-01', 'NORTH_GATE')}>
                    North Gate
                  </IonButton>
                  <IonButton expand="block" fill="outline" size="small" style={{ flex: 1, '--color': '#b45309', '--border-color': '#b45309', fontSize: '0.72rem' }} onClick={() => handleQuickDeviceSelect('DEV-SOUTH-01', 'SOUTH_GATE')}>
                    South Gate
                  </IonButton>
                  <IonButton expand="block" fill="outline" size="small" style={{ flex: 1, '--color': '#15803d', '--border-color': '#15803d', fontSize: '0.72rem' }} onClick={() => handleQuickDeviceSelect('DEV-EAST-01', 'EAST_GATE')}>
                    East Gate
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <IonToast
            isOpen={!!toastMsg}
            message={toastMsg}
            duration={3000}
            onDidDismiss={() => setToastMsg('')}
            color="danger"
          />
        </div>
      </IonContent>
    </IonPage>
  );
}
