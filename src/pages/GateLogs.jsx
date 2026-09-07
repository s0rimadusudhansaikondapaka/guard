import React from 'react';
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
} from '@ionic/react';

export default function GateLogs() {
  const sampleLogs = [
    { id: 1, visitor_name: 'Suresh Kumar', pass_code: 'PASS-1001', direction: 'IN', timestamp: '10:15 AM', gate: 'North Gate' },
    { id: 2, visitor_name: 'Amazon Delivery Agent', pass_code: 'DELIVERY-883', direction: 'IN', timestamp: '10:30 AM', gate: 'North Gate' },
    { id: 3, visitor_name: 'Ramesh Vendor', pass_code: 'VENDOR-402', direction: 'OUT', timestamp: '11:05 AM', gate: 'South Gate' },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Visitor History & Logs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', color: '#334155', fontWeight: 'bold' }}>
          Recent Gate Movement Logs
        </h4>

        {sampleLogs.map((log) => (
          <IonCard key={log.id} className="card-wireframe">
            <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{log.visitor_name}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pass Code: {log.pass_code} | Gate: {log.gate}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{log.timestamp}</div>
                </div>

                <IonBadge color={log.direction === 'IN' ? 'success' : 'danger'}>
                  {log.direction}
                </IonBadge>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
}
