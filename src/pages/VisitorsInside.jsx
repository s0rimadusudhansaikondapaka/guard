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
  IonSearchbar,
  IonButton,
  IonBadge,
  IonToast,
} from '@ionic/react';
import { getVisitorsInsideCampus, processGateMovement } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VisitorsInside({ history }) {
  const { selectedGate } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchVisitorsInside();
  }, []);

  const fetchVisitorsInside = async () => {
    try {
      const res = await getVisitorsInsideCampus();
      if (res.success) {
        setVisitors(res.visitors || []);
      }
    } catch (e) {
      console.log('Sample visitors inside');
    }
  };

  const handleCheckOut = async (v) => {
    try {
      const res = await processGateMovement({
        registration_id: v.id,
        gate_name: selectedGate,
        direction: 'OUT',
        person_count: v.person_count || 1,
      });
      if (res.success) {
        setToastMsg(`Checked Out ${v.visitor_name} successfully!`);
        fetchVisitorsInside();
      }
    } catch (e) {
      setToastMsg('Failed to check out visitor.');
    }
  };

  const filteredVisitors = visitors.filter(v =>
    (v.visitor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.pass_code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Visitors Inside</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* Search bar matching Image 1 Wireframe Screen 5 */}
        <IonSearchbar 
          value={search} 
          onIonChange={(e) => setSearch(e.detail.value)} 
          placeholder="Search by name or passcode"
          style={{ padding: 0, marginBottom: '0.8rem' }}
        />

        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>
          Currently Inside Campus ({filteredVisitors.length})
        </h4>

        {/* Visitors Inside Cards matching Image 1 Screen 5 */}
        {filteredVisitors.map((v) => (
          <IonCard key={v.id} className="card-wireframe">
            <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', color: '#800000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {v.visitor_name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{v.visitor_name} ({v.pass_code})</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Host: {v.host_name || 'Ashram Resident'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#475569' }}>Purpose: {v.purpose || 'Darshan'}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <IonBadge color="medium" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.3rem' }}>
                    {v.stay_duration || '2h 15m'}
                  </IonBadge>
                  <IonButton 
                    size="small" 
                    fill="outline" 
                    style={{ '--color': '#dc2626', '--border-color': '#dc2626', fontWeight: 'bold', fontSize: '0.72rem' }}
                    onClick={() => handleCheckOut(v)}
                  >
                    Check Out
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
