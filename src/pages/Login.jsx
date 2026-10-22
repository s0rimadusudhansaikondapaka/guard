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
  IonModal,
} from '@ionic/react';
import { keyOutline, phonePortraitOutline, shieldCheckmark, closeOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { forgotPassword, resetPassword } from '../services/api';

export default function Login({ history }) {
  const [deviceId, setDeviceId] = useState('DEV-NORTH-01');
  const [secretCode, setSecretCode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const { loginWithDevice, setDevice, setOnDutyGuards } = useAuth();

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTab, setForgotTab] = useState('request'); // 'request' | 'reset'
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotResetUrl, setForgotResetUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleRequestResetLink = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setForgotResetUrl('');

    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email, phone, or username.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotIdentifier.trim());
      if (res?.success) {
        setForgotMsg(res.message || 'Password reset link sent to your email.');
        if (res.reset_url) setForgotResetUrl(res.reset_url);
      } else {
        setForgotError(res?.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetWithToken = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotResetToken.trim()) {
      setForgotError('Reset token is required.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotResetToken.trim(), forgotNewPassword);
      if (res?.success) {
        setForgotMsg('Password reset successful!');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotMsg('');
          setToastMsg('Password changed successfully!');
        }, 1500);
      } else {
        setForgotError(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Server error resetting password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleDeviceLogin = async (e) => {
    e?.preventDefault();
    if (!deviceId || !secretCode) return;
    setLoading(true);
    try {
      const res = await loginWithDevice(deviceId, secretCode);
      if (res && res.success) {
        window.location.href = '/home';
      } else {
        setToastMsg(res?.message || 'Device login failed. Please check Device ID and Secret Code.');
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
      window.location.href = '/home';
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

              <div style={{ textAlign: 'center', marginTop: '0.9rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setForgotError(''); setForgotMsg(''); setForgotResetUrl(''); }}
                  style={{ background: 'none', border: 'none', color: '#800000', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Forgot Password / Reset Password Modal */}
          <IonModal
            isOpen={showForgotModal}
            onDidDismiss={() => setShowForgotModal(false)}
            style={{ '--max-width': '420px', '--height': 'auto', '--border-radius': '16px' }}
          >
            <div style={{ background: '#ffffff', padding: '1.4rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IonIcon icon={keyOutline} style={{ color: '#800000' }} /> Guard Password Recovery
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: '22px' }} />
                </button>
              </div>

              {/* Sub-tab selection */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setForgotTab('request'); setForgotError(''); setForgotMsg(''); }}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: forgotTab === 'request' ? '#800000' : '#f1f5f9',
                    color: forgotTab === 'request' ? '#ffffff' : '#64748b',
                  }}
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => { setForgotTab('reset'); setForgotError(''); setForgotMsg(''); }}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: forgotTab === 'reset' ? '#800000' : '#f1f5f9',
                    color: forgotTab === 'reset' ? '#ffffff' : '#64748b',
                  }}
                >
                  Enter Reset Token
                </button>
              </div>

              {forgotError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.55rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '0.9rem' }}>
                  {forgotError}
                </div>
              )}

              {forgotMsg && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.55rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '0.9rem' }}>
                  {forgotMsg}
                </div>
              )}

              {forgotTab === 'request' ? (
                <form onSubmit={handleRequestResetLink}>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.8rem 0', lineHeight: 1.4 }}>
                    Enter your registered Email address, Phone, or Username to receive a password reset link.
                  </p>

                  <IonItem lines="inset" style={{ '--background': '#f8fafc', borderRadius: '8px', marginBottom: '1rem' }}>
                    <IonLabel position="stacked" style={{ color: '#475569' }}>Email, Phone, or Username</IonLabel>
                    <IonInput
                      type="text"
                      value={forgotIdentifier}
                      onIonChange={(e) => setForgotIdentifier(e.detail.value)}
                      placeholder="e.g. guard1@ashram.org"
                      required
                    />
                  </IonItem>

                  <IonButton expand="block" type="submit" disabled={forgotLoading} style={{ '--background': '#800000', fontWeight: 'bold' }}>
                    {forgotLoading ? 'Sending...' : 'SEND RESET LINK'}
                  </IonButton>

                  {forgotResetUrl && (
                    <div style={{ marginTop: '0.9rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#92400e' }}>Direct Link:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(forgotResetUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          style={{ background: copiedLink ? '#166534' : '#800000', color: '#ffffff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          {copiedLink ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <a href={forgotResetUrl} style={{ fontSize: '0.75rem', color: '#800000', wordBreak: 'break-all' }}>
                        Open Reset Password Page
                      </a>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleResetWithToken}>
                  <IonItem lines="inset" style={{ '--background': '#f8fafc', borderRadius: '8px', marginBottom: '0.8rem' }}>
                    <IonLabel position="stacked" style={{ color: '#475569' }}>Reset Token</IonLabel>
                    <IonInput
                      type="text"
                      value={forgotResetToken}
                      onIonChange={(e) => setForgotResetToken(e.detail.value)}
                      placeholder="Paste 64-char token"
                      required
                    />
                  </IonItem>

                  <IonItem lines="inset" style={{ '--background': '#f8fafc', borderRadius: '8px', marginBottom: '0.8rem' }}>
                    <IonLabel position="stacked" style={{ color: '#475569' }}>New Password (min 6 chars)</IonLabel>
                    <IonInput
                      type="password"
                      value={forgotNewPassword}
                      onIonChange={(e) => setForgotNewPassword(e.detail.value)}
                      required
                    />
                  </IonItem>

                  <IonItem lines="inset" style={{ '--background': '#f8fafc', borderRadius: '8px', marginBottom: '1.2rem' }}>
                    <IonLabel position="stacked" style={{ color: '#475569' }}>Confirm New Password</IonLabel>
                    <IonInput
                      type="password"
                      value={forgotConfirmPassword}
                      onIonChange={(e) => setForgotConfirmPassword(e.detail.value)}
                      required
                    />
                  </IonItem>

                  <IonButton expand="block" type="submit" disabled={forgotLoading} style={{ '--background': '#800000', fontWeight: 'bold' }}>
                    {forgotLoading ? 'Updating...' : 'SAVE NEW PASSWORD'}
                  </IonButton>
                </form>
              )}
            </div>
          </IonModal>

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
