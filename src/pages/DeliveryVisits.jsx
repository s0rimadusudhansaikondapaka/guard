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
} from '@ionic/react';
import { getDeliveryPersons, markDeliveryOut } from '../services/api';

export default function DeliveryVisits({ history }) {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{dp.full_name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 'bold' }}>🏢 {dp.company_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {dp.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px', fontWeight: 'bold' }}>
                      🚗 {dp.vehicle_type}: {dp.vehicle_number || 'N/A'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
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

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
