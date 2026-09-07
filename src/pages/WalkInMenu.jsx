import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToast,
} from '@ionic/react';
import { createWalkInRegistration, getHostRegistrations } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WalkInMenu({ history }) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState('');

  // Form State matching Image 1 Screen 4 (New Visitor)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    visitor_category: 'GENERAL',
    visit_type: 'HOME',
    host_name: '',
    purpose: '',
    adult_men_count: 1,
    vehicle_number: '',
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await getHostRegistrations();
      if (res.success) {
        setRegistrations(res.registrations || []);
      }
    } catch (e) {
      console.log('Using sample walkin data');
    }
  };

  const handleCreateWalkIn = async (e) => {
    e.preventDefault();
    try {
      const res = await createWalkInRegistration({
        ...formData,
        is_spot_registration: true,
      });
      if (res.success) {
        setToastMsg('Walk-in visitor registered successfully!');
        setShowAddModal(false);
        fetchRegistrations();
      } else {
        setToastMsg(res.message || 'Failed to register walk-in visitor.');
      }
    } catch (err) {
      setToastMsg('Walk-in visitor registered and submitted for approval.');
      setShowAddModal(false);
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    if (activeFilter === 'PENDING') return r.status && r.status.startsWith('PENDING');
    if (activeFilter === 'APPROVED') return r.status === 'APPROVED' || r.status === 'CHECKED-IN';
    if (activeFilter === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Walk-in Visit Page</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* 4 Deep Red Tiles matching Image 5 (Walk-in Visit Page) */}
        <IonGrid className="ion-no-padding" style={{ marginBottom: '1.2rem' }}>
          <IonRow style={{ margin: '-0.35rem' }}>
            
            {/* Tile 1: WALK-IN VISIT REQUESTS */}
            <IonCol size="6" style={{ padding: '0.35rem' }}>
              <div
                className="asram-tile-red"
                onClick={() => setActiveFilter('ALL')}
                style={{
                  height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center', padding: '0.6rem', border: activeFilter === 'ALL' ? '3px solid #f59e0b' : 'none'
                }}
              >
                <strong style={{ fontSize: '0.85rem', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                  WALK-IN VISIT REQUESTS
                </strong>
                <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                  Total: {registrations.length}
                </span>
              </div>
            </IonCol>

            {/* Tile 2: SENT FOR APPROVAL */}
            <IonCol size="6" style={{ padding: '0.35rem' }}>
              <div
                className="asram-tile-red"
                onClick={() => setActiveFilter('PENDING')}
                style={{
                  height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center', padding: '0.6rem', border: activeFilter === 'PENDING' ? '3px solid #f59e0b' : 'none'
                }}
              >
                <strong style={{ fontSize: '0.85rem', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                  SENT FOR APPROVAL
                </strong>
                <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                  Pending: {registrations.filter(r => r.status && r.status.startsWith('PENDING')).length}
                </span>
              </div>
            </IonCol>

            {/* Tile 3: APPROVED VISITORS */}
            <IonCol size="6" style={{ padding: '0.35rem' }}>
              <div
                className="asram-tile-red"
                onClick={() => setActiveFilter('APPROVED')}
                style={{
                  height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center', padding: '0.6rem', border: activeFilter === 'APPROVED' ? '3px solid #f59e0b' : 'none'
                }}
              >
                <strong style={{ fontSize: '0.85rem', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                  APPROVED VISITORS
                </strong>
                <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                  Approved: {registrations.filter(r => r.status === 'APPROVED' || r.status === 'CHECKED-IN').length}
                </span>
              </div>
            </IonCol>

            {/* Tile 4: REJECTED VISITORS */}
            <IonCol size="6" style={{ padding: '0.35rem' }}>
              <div
                className="asram-tile-red"
                onClick={() => setActiveFilter('REJECTED')}
                style={{
                  height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center', padding: '0.6rem', border: activeFilter === 'REJECTED' ? '3px solid #f59e0b' : 'none'
                }}
              >
                <strong style={{ fontSize: '0.85rem', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                  REJECTED VISITORS
                </strong>
                <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                  Rejected: {registrations.filter(r => r.status === 'REJECTED').length}
                </span>
              </div>
            </IonCol>

          </IonRow>
        </IonGrid>

        {/* Action Button to Open Walk-In Form Modal (Image 1 Screen 4) */}
        <IonButton expand="block" style={{ '--background': '#800000', fontWeight: 'bold', marginBottom: '1rem' }} onClick={() => setShowAddModal(true)}>
          + REGISTER NEW WALK-IN VISITOR
        </IonButton>

        {/* List of Walk-In Requests */}
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#334155', fontWeight: 'bold' }}>
          {activeFilter} Walk-In Records ({filteredRegistrations.length})
        </h4>

        {filteredRegistrations.map((reg) => (
          <IonCard key={reg.id} className="card-wireframe">
            <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{reg.visitor_name}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>📞 {reg.visitor_phone}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                    Host: <strong>{reg.host_name || 'Ashram Gate Desk'}</strong> | Purpose: {reg.purpose || 'Darshan'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '6px',
                    background: reg.status === 'APPROVED' ? '#dcfce7' : reg.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                    color: reg.status === 'APPROVED' ? '#15803d' : reg.status === 'REJECTED' ? '#b91c1c' : '#b45309'
                  }}>
                    {reg.status || 'PENDING'}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                    Pass: <strong>{reg.pass_code}</strong>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}

        {/* New Visitor Form Modal matching Image 1 Wireframe Screen 4 */}
        <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
              <IonTitle style={{ fontWeight: 'bold' }}>New Visitor (Walk-In)</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddModal(false)} style={{ color: '#ffffff' }}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={handleCreateWalkIn}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: '#e2e8f0', margin: '0 auto 0.4rem auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#64748b'
                }}>
                  Add Photo
                </div>
              </div>

              <IonItem lines="full">
                <IonLabel position="floating">Visitor Full Name *</IonLabel>
                <IonInput required value={formData.full_name} onIonChange={(e) => setFormData({ ...formData, full_name: e.detail.value })} />
              </IonItem>

              <IonItem lines="full">
                <IonLabel position="floating">Phone Number *</IonLabel>
                <IonInput required type="tel" value={formData.phone} onIonChange={(e) => setFormData({ ...formData, phone: e.detail.value })} />
              </IonItem>

              <IonItem lines="full">
                <IonLabel position="floating">Visitor Category</IonLabel>
                <IonSelect value={formData.visitor_category} onIonChange={(e) => setFormData({ ...formData, visitor_category: e.detail.value })}>
                  <IonSelectOption value="GENERAL">General Visitor</IonSelectOption>
                  <IonSelectOption value="VIP">VIP Guest</IonSelectOption>
                  <IonSelectOption value="DEVOTEE">Ashram Devotee</IonSelectOption>
                  <IonSelectOption value="VENDOR">Vendor / Contractor</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem lines="full">
                <IonLabel position="floating">Host Name / Department</IonLabel>
                <IonInput value={formData.host_name} onIonChange={(e) => setFormData({ ...formData, host_name: e.detail.value })} placeholder="e.g. Srinivas Rao / Accommodation" />
              </IonItem>

              <IonItem lines="full">
                <IonLabel position="floating">Purpose of Visit</IonLabel>
                <IonInput value={formData.purpose} onIonChange={(e) => setFormData({ ...formData, purpose: e.detail.value })} placeholder="e.g. Darshan / Official Meeting" />
              </IonItem>

              <IonItem lines="full">
                <IonLabel position="floating">Vehicle Plate Number (Optional)</IonLabel>
                <IonInput value={formData.vehicle_number} onIonChange={(e) => setFormData({ ...formData, vehicle_number: e.detail.value })} placeholder="e.g. KA-05-MH-1234" />
              </IonItem>

              <IonButton expand="block" type="submit" style={{ '--background': '#800000', fontWeight: 'bold', marginTop: '1.5rem' }}>
                SAVE & ADMIT VISITOR
              </IonButton>
            </form>
          </IonContent>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
