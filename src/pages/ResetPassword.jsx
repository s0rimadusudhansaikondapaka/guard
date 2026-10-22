import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { keyOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { verifyResetToken, resetPassword } from '../services/api';

export default function ResetPassword({ history, location }) {
  const query = new URLSearchParams(location?.search || window.location.search);
  const initialToken = query.get('token') || query.get('reset_token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!initialToken);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (initialToken) {
      setVerifying(true);
      verifyResetToken(initialToken)
        .then((res) => {
          if (res?.success) {
            setUserName(res.user?.name || '');
            setUserEmail(res.user?.email || '');
          } else {
            setErrorMessage(res?.message || 'Password reset link is invalid or expired.');
          }
        })
        .catch((err) => {
          setErrorMessage(err.response?.data?.message || 'Invalid or expired password reset link.');
        })
        .finally(() => setVerifying(false));
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Reset token is required.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token.trim(), newPassword);
      if (res?.success) {
        setSuccess(true);
      } else {
        setErrorMessage(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Server error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Guard Password Reset</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <div style={{ maxWidth: '420px', margin: '2rem auto 0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '60px', height: '60px', background: '#800000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem auto', boxShadow: '0 4px 14px rgba(128,0,0,0.3)' }}>
              <IonIcon icon={keyOutline} style={{ fontSize: '32px', color: '#f59e0b' }} />
            </div>
            <h2 style={{ margin: 0, fontWeight: 'bold', color: '#1e293b', fontSize: '1.3rem' }}>
              Create New Password
            </h2>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Ashram Security Guard System
            </p>
            {userName && (
              <div style={{ marginTop: '0.6rem', display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.8rem', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                Account: {userName} ({userEmail})
              </div>
            )}
          </div>

          <IonCard className="card-wireframe" style={{ background: '#ffffff', borderRadius: '14px' }}>
            <IonCardContent className="ion-padding">
              {verifying && (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b' }}>
                  <IonSpinner name="crescent" />
                  <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>Verifying reset token...</p>
                </div>
              )}

              {success ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '36px' }} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: '#15803d', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Password Reset Successful!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Your password has been changed. You can now log in to the guard terminal.
                  </p>
                  <IonButton
                    expand="block"
                    onClick={() => history.replace('/login')}
                    style={{ '--background': '#800000', fontWeight: 'bold' }}
                  >
                    RETURN TO LOG IN
                  </IonButton>
                </div>
              ) : (
                !verifying && (
                  <form onSubmit={handleSubmit}>
                    {errorMessage && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                        {errorMessage}
                      </div>
                    )}

                    {!initialToken && (
                      <IonItem lines="inset" style={{ marginBottom: '1rem', '--background': '#f8fafc', borderRadius: '8px' }}>
                        <IonLabel position="stacked" style={{ color: '#475569' }}>Reset Token *</IonLabel>
                        <IonInput
                          type="text"
                          value={token}
                          onIonChange={(e) => setToken(e.detail.value)}
                          placeholder="Paste 64-char token from email"
                          required
                        />
                      </IonItem>
                    )}

                    <IonItem lines="inset" style={{ marginBottom: '1rem', '--background': '#f8fafc', borderRadius: '8px' }}>
                      <IonLabel position="stacked" style={{ color: '#475569' }}>New Password (min 6 chars) *</IonLabel>
                      <IonInput
                        type="password"
                        value={newPassword}
                        onIonChange={(e) => setNewPassword(e.detail.value)}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                    </IonItem>

                    <IonItem lines="inset" style={{ marginBottom: '1.5rem', '--background': '#f8fafc', borderRadius: '8px' }}>
                      <IonLabel position="stacked" style={{ color: '#475569' }}>Confirm New Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={confirmPassword}
                        onIonChange={(e) => setConfirmPassword(e.detail.value)}
                        placeholder="Re-type new password"
                        required
                        minLength={6}
                      />
                    </IonItem>

                    <IonButton
                      expand="block"
                      type="submit"
                      disabled={loading}
                      style={{ '--background': '#800000', fontWeight: 'bold', height: '48px' }}
                    >
                      {loading ? 'Updating Password...' : 'SAVE NEW PASSWORD'}
                    </IonButton>
                  </form>
                )
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
