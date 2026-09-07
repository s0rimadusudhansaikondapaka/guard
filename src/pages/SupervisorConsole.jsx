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
  IonButton,
  IonBadge,
  IonToast,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/react';
import { getAllPendingApprovals, processApproval } from '../services/api';

export default function SupervisorConsole({ history }) {
  const [approvals, setApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await getAllPendingApprovals();
      if (res.success) {
        setApprovals(res.pending_approvals || []);
      }
    } catch (e) {}
  };

  const handleAction = async (regId, action) => {
    try {
      const res = await processApproval(regId, action, `Processed by Supervisor`);
      if (res.success) {
        setToastMsg(`Request ${action}D successfully!`);
        fetchApprovals();
      }
    } catch (e) {
      setToastMsg('Failed to process approval.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#f59e0b', '--color': '#78350f' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#78350f' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Supervisor Validation Queue</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', color: '#334155', fontWeight: 'bold' }}>
          Pending Approvals Queue ({approvals.length})
        </h4>

        {approvals.length === 0 ? (
          <IonCard className="card-wireframe">
            <IonCardContent className="ion-padding" style={{ textAlign: 'center', color: '#64748b' }}>
              No pending approval requests in queue.
            </IonCardContent>
          </IonCard>
        ) : (
          approvals.map((item) => (
            <IonCard key={item.id} className="card-wireframe" style={{ borderLeft: '5px solid #f59e0b' }}>
              <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{item.visitor_name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5' }}>Category: {item.visitor_category}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Host: {item.host_name || 'Ashram Host'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#334155' }}>Purpose: {item.purpose}</div>
                  </div>

                  <IonBadge color="warning">{item.status}</IonBadge>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                  <IonButton 
                    size="small" 
                    style={{ flex: 1, '--background': '#16a34a', fontWeight: 'bold' }}
                    onClick={() => handleAction(item.id, 'APPROVE')}
                  >
                    APPROVE
                  </IonButton>
                  <IonButton 
                    size="small" 
                    style={{ flex: 1, '--background': '#dc2626', fontWeight: 'bold' }}
                    onClick={() => handleAction(item.id, 'REJECT')}
                  >
                    REJECT
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
