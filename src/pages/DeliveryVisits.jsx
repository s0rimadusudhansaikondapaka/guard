import React, { useState, useEffect } from 'react';
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
  IonBadge,
  IonButton,
  IonToast,
  IonModal,
} from '@ionic/react';
import { getDeliveryPersons, markDeliveryOut } from '../services/api';

export default function DeliveryVisits({ history }) {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);

  const DEFAULT_COURIER_AVATAR = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300';
  const DEFAULT_COURIER_DOC = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600';

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await getDeliveryPersons();
      if (res.success) {
        setDeliveryPersons(res.delivery_persons || []);
      }
    } catch (e) {}
  };

  const activeVisits = deliveryPersons.filter(dp => dp.current_visit_status === 'IN');

  const handleOut = async (dp) => {
    try {
      const res = await markDeliveryOut(dp.id);
      if (res.success) {
        setToastMsg(res.message);
        fetchVisits();
      }
    } catch (e) {
      setToastMsg('Failed to check out delivery visit.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#d97706', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/delivery-menu" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Delivery Visits & Overstay</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', color: '#334155', fontWeight: 'bold' }}>
          Active Delivery Vehicles Inside Campus ({activeVisits.length})
        </h4>

        {activeVisits.length === 0 ? (
          <IonCard className="card-wireframe">
            <IonCardContent className="ion-padding" style={{ textAlign: 'center', color: '#64748b' }}>
              No active delivery vehicles currently inside campus.
            </IonCardContent>
          </IonCard>
        ) : (
          activeVisits.map((dp) => (
            <IonCard key={dp.id} className="card-wireframe" style={{ borderLeft: dp.is_overstay ? '5px solid #dc2626' : '5px solid #16a34a' }}>
              <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Courier Face Photo Thumbnail with Tap to Enlarge */}
                  <div
                    onClick={() => setEnlargedImage({
                      url: dp.photo_url || DEFAULT_COURIER_AVATAR,
                      title: dp.full_name,
                      subtitle: `${dp.company_name} Courier • Active Delivery Visit`,
                      badge: 'ACTIVE COURIER'
                    })}
                    title="Tap to enlarge photo"
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #d97706',
                      cursor: 'pointer',
                      background: '#f1f5f9',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img
                      src={dp.photo_url || DEFAULT_COURIER_AVATAR}
                      alt={dp.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{dp.full_name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 'bold' }}>🏢 {dp.company_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {dp.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px', fontWeight: 'bold' }}>
                      🚗 {dp.vehicle_type}: {dp.vehicle_number || 'N/A'}
                    </div>

                    {/* Attached ID Proof Badge with Tap to Enlarge */}
                    <div style={{ marginTop: '4px' }}>
                      <span
                        onClick={() => setEnlargedImage({
                          url: dp.id_card_image_url || DEFAULT_COURIER_DOC,
                          title: `${dp.full_name} - ${dp.id_type || 'Courier ID'}`,
                          subtitle: `ID Number: ${dp.id_number || 'DOC-VERIFIED'} • Company: ${dp.company_name}`,
                          badge: dp.id_type || 'DELIVERY ID PROOF'
                        })}
                        style={{
                          fontSize: '0.68rem',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Tap to enlarge ID card / Address Proof"
                      >
                        📄 {dp.id_type || 'ID Card'} 🔍
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {dp.is_overstay ? (
                      <IonBadge className="badge-overstay">⚠️ OVERSTAY ({dp.stay_duration_minutes} mins)</IonBadge>
                    ) : (
                      <IonBadge color="success">In for {dp.stay_duration_minutes || 5} mins</IonBadge>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                  <IonButton expand="block" style={{ '--background': '#dc2626', fontWeight: 'bold', fontSize: '0.78rem' }} onClick={() => handleOut(dp)}>
                    MARK EXIT (CHECK OUT)
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {/* ENLARGED IMAGE / DOCUMENT PREVIEW MODAL */}
        <IonModal isOpen={!!enlargedImage} onDidDismiss={() => setEnlargedImage(null)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0f172a', '--color': '#ffffff' }}>
              <IonTitle style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                {enlargedImage?.title || 'Courier Document'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setEnlargedImage(null)} style={{ color: '#ffffff', fontWeight: 'bold' }}>
                  CLOSE ✕
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding" style={{ '--background': '#0f172a' }}>
            {enlargedImage && (
              <div style={{ textAlign: 'center', padding: '0.8rem 0' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <IonBadge color="warning" style={{ fontSize: '0.78rem', padding: '4px 12px' }}>
                    {enlargedImage.badge || 'VERIFIED COURIER'}
                  </IonBadge>
                  <h3 style={{ color: '#f8fafc', margin: '0.6rem 0 0.2rem 0', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {enlargedImage.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                    {enlargedImage.subtitle}
                  </p>
                </div>

                <div style={{
                  background: '#1e293b',
                  padding: '8px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  maxWidth: '100%',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                  border: '1px solid #334155'
                }}>
                  <img
                    src={enlargedImage.url}
                    alt={enlargedImage.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '62vh',
                      borderRadius: '8px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </div>

                <div style={{ marginTop: '1.2rem' }}>
                  <IonButton
                    color="light"
                    fill="outline"
                    onClick={() => setEnlargedImage(null)}
                    style={{ fontWeight: 'bold', fontSize: '0.82rem' }}
                  >
                    CLOSE PREVIEW
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
