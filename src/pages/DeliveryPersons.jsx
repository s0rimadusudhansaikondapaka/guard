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
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonIcon,
} from '@ionic/react';
import { logInOutline, logOutOutline, checkmarkCircleOutline, closeCircleOutline, alertCircleOutline, createOutline } from 'ionicons/icons';
import { getDeliveryPersons, createDeliveryPerson, updateDeliveryPerson, approveOrRejectDeliveryPerson, markDeliveryIn, markDeliveryOut } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DeliveryPersons({ history }) {
  const { user } = useAuth();
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInModal, setShowInModal] = useState(false);
  const [showMissedInModal, setShowMissedInModal] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company_name: 'Amazon',
    id_type: 'Aadhaar',
    id_number: '',
    vehicle_type: 'Two Wheeler',
    vehicle_number: '',
  });

  // Stateless Delivery Visit Form (Vehicle editable)
  const [inVehicleData, setInVehicleData] = useState({
    vehicle_type: 'Two Wheeler',
    vehicle_number: '',
    gate_name: 'NORTH_GATE',
  });

  const isSupervisor = ['SUPERVISOR', 'SECURITY_HEAD', 'ADMIN'].includes((user?.role || '').toUpperCase());

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  const fetchDeliveryPersons = async () => {
    setLoading(true);
    try {
      const res = await getDeliveryPersons();
      if (res.success) {
        setDeliveryPersons(res.delivery_persons || []);
      }
    } catch (e) {
      console.log('Sample delivery data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    try {
      const res = await createDeliveryPerson(formData);
      if (res.success) {
        setToastMsg(res.message);
        setShowAddModal(false);
        fetchDeliveryPersons();
      }
    } catch (err) {
      setToastMsg('Failed to register delivery person.');
    }
  };

  const handleEditPerson = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return;
    try {
      const res = await updateDeliveryPerson(selectedPerson.id, formData);
      if (res.success) {
        setToastMsg('Delivery person details updated.');
        setShowEditModal(false);
        fetchDeliveryPersons();
      }
    } catch (err) {
      setToastMsg('Failed to update delivery person.');
    }
  };

  const handleApproval = async (id, action) => {
    try {
      const res = await approveOrRejectDeliveryPerson(id, action);
      if (res.success) {
        setToastMsg(res.message);
        fetchDeliveryPersons();
      }
    } catch (err) {
      setToastMsg('Failed to update status.');
    }
  };

  const handleOpenIn = (dp) => {
    setSelectedPerson(dp);
    setInVehicleData({
      vehicle_type: dp.vehicle_type || 'Two Wheeler',
      vehicle_number: dp.vehicle_number || '',
      gate_name: 'NORTH_GATE',
    });
    setShowInModal(true);
  };

  const handleSubmitIn = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return;
    try {
      const res = await markDeliveryIn(selectedPerson.id, inVehicleData);
      if (res.success) {
        setToastMsg(res.message);
        setShowInModal(false);
        fetchDeliveryPersons();
      }
    } catch (err) {
      setToastMsg('Failed to mark delivery IN.');
    }
  };

  const handleMarkOut = async (dp, autoIn = false) => {
    try {
      const res = await markDeliveryOut(dp.id, { auto_in: autoIn, gate_name: 'NORTH_GATE' });
      if (res.success) {
        setToastMsg(res.message);
        setShowMissedInModal(false);
        fetchDeliveryPersons();
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.missed_entry) {
        setSelectedPerson(dp);
        setShowMissedInModal(true);
      } else {
        setToastMsg('Failed to mark delivery OUT.');
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/delivery-menu" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Delivery Persons Report</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        <IonButton expand="block" style={{ '--background': '#f59e0b', '--color': '#78350f', fontWeight: 'bold', marginBottom: '1rem' }} onClick={() => setShowAddModal(true)}>
          + REGISTER DELIVERY PERSON
        </IonButton>

        {deliveryPersons.map((dp) => {
          const isApproved = dp.status === 'APPROVED';
          const isIn = dp.current_visit_status === 'IN';
          const isOverstay = dp.is_overstay;

          return (
            <IonCard key={dp.id} className="card-wireframe" style={{ borderLeft: isOverstay ? '5px solid #dc2626' : isIn ? '5px solid #16a34a' : '1px solid #e2e8f0' }}>
              <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{dp.full_name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 'bold' }}>🏢 {dp.company_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {dp.phone}</div>
                    <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: '2px' }}>
                      🚗 {dp.vehicle_type}: <strong>{dp.vehicle_number || 'N/A'}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {isOverstay ? (
                      <IonBadge className="badge-overstay">⚠️ OVERSTAY (&gt;2 hrs)</IonBadge>
                    ) : isIn ? (
                      <IonBadge color="success">🟢 INSIDE</IonBadge>
                    ) : (
                      <IonBadge color={isApproved ? 'secondary' : 'warning'}>{dp.status}</IonBadge>
                    )}
                  </div>
                </div>

                {/* Gate Action Buttons matching specifications */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                  <IonButton
                    size="small"
                    disabled={!isApproved || isIn}
                    style={{ '--background': '#16a34a', flex: 1, fontWeight: 'bold', fontSize: '0.75rem' }}
                    onClick={() => handleOpenIn(dp)}
                  >
                    <IonIcon icon={logInOutline} slot="start" /> IN
                  </IonButton>

                  <IonButton
                    size="small"
                    disabled={!isApproved}
                    style={{ '--background': '#dc2626', flex: 1, fontWeight: 'bold', fontSize: '0.75rem' }}
                    onClick={() => handleMarkOut(dp)}
                  >
                    <IonIcon icon={logOutOutline} slot="start" /> OUT
                  </IonButton>

                  {isSupervisor && (
                    <IonButton
                      size="small"
                      fill="outline"
                      style={{ '--color': '#475569', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSelectedPerson(dp);
                        setFormData({
                          full_name: dp.full_name,
                          phone: dp.phone,
                          company_name: dp.company_name,
                          id_type: dp.id_type || 'Aadhaar',
                          id_number: dp.id_number || '',
                          vehicle_type: dp.vehicle_type || 'Two Wheeler',
                          vehicle_number: dp.vehicle_number || '',
                        });
                        setShowEditModal(true);
                      }}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          );
        })}

        {/* Add Modal */}
        <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
              <IonTitle>Register Delivery Person</IonTitle>
              <IonButtons slot="end"><IonButton onClick={() => setShowAddModal(false)} style={{ color: '#fff' }}>Close</IonButton></IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={handleCreatePerson}>
              <IonItem lines="full">
                <IonLabel position="floating">Full Name *</IonLabel>
                <IonInput required value={formData.full_name} onIonChange={(e) => setFormData({ ...formData, full_name: e.detail.value })} />
              </IonItem>
              <IonItem lines="full">
                <IonLabel position="floating">Phone Number *</IonLabel>
                <IonInput required type="tel" value={formData.phone} onIonChange={(e) => setFormData({ ...formData, phone: e.detail.value })} />
              </IonItem>
              <IonItem lines="full">
                <IonLabel position="floating">Delivery Agency / Company</IonLabel>
                <IonSelect value={formData.company_name} onIonChange={(e) => setFormData({ ...formData, company_name: e.detail.value })}>
                  <IonSelectOption value="Amazon">Amazon</IonSelectOption>
                  <IonSelectOption value="Flipkart">Flipkart</IonSelectOption>
                  <IonSelectOption value="Swiggy / Zomato">Swiggy / Zomato</IonSelectOption>
                  <IonSelectOption value="Dunzo / Zepto">Dunzo / Zepto</IonSelectOption>
                  <IonSelectOption value="FedEx / Courier">FedEx Courier</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem lines="full">
                <IonLabel position="floating">Vehicle Plate Number</IonLabel>
                <IonInput value={formData.vehicle_number} onIonChange={(e) => setFormData({ ...formData, vehicle_number: e.detail.value })} placeholder="e.g. KA-05-EX-9999" />
              </IonItem>
              <IonButton expand="block" type="submit" style={{ '--background': '#800000', fontWeight: 'bold', marginTop: '1.2rem' }}>
                SUBMIT REGISTRATION
              </IonButton>
            </form>
          </IonContent>
        </IonModal>

        {/* Stateless Delivery Visit Modal (Mark IN) */}
        <IonModal isOpen={showInModal} onDidDismiss={() => setShowInModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#16a34a', '--color': '#ffffff' }}>
              <IonTitle style={{ fontWeight: 'bold' }}>Delivery Visit (Mark IN)</IonTitle>
              <IonButtons slot="end"><IonButton onClick={() => setShowInModal(false)} style={{ color: '#fff' }}>Cancel</IonButton></IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedPerson && (
              <form onSubmit={handleSubmitIn}>
                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Disabled Agent Info (Read-Only):</p>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b', display: 'block' }}>{selectedPerson.full_name} ({selectedPerson.company_name})</strong>
                  <span style={{ fontSize: '0.8rem', color: '#334155' }}>Phone: {selectedPerson.phone}</span>
                </div>

                <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#15803d', fontWeight: 'bold' }}>✏️ Verify / Edit Vehicle Details:</h4>
                  <IonItem lines="full">
                    <IonLabel position="floating">Vehicle Plate Number *</IonLabel>
                    <IonInput required value={inVehicleData.vehicle_number} onIonChange={(e) => setInVehicleData({ ...inVehicleData, vehicle_number: e.detail.value })} />
                  </IonItem>
                </div>

                <IonButton expand="block" type="submit" style={{ '--background': '#16a34a', fontWeight: 'bold' }}>
                  CONFIRM IN (MARK IN)
                </IonButton>
              </form>
            )}
          </IonContent>
        </IonModal>

        {/* Missed Entry Auto-IN Alert Modal */}
        <IonModal isOpen={showMissedInModal} onDidDismiss={() => setShowMissedInModal(false)}>
          <IonContent className="ion-padding" style={{ textAlign: 'center' }}>
            <IonIcon icon={alertCircleOutline} style={{ fontSize: '48px', color: '#d97706', marginTop: '1rem' }} />
            <h3 style={{ color: '#92400e', fontWeight: 'bold' }}>Human Error: Missed IN Record</h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
              There is <strong>no record of IN</strong> for <strong>{selectedPerson?.full_name}</strong>.
              <br /><br />
              Would you like to mark <strong>Auto-IN (with MISSED Entry remark)</strong> along with OUT?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <IonButton expand="block" fill="outline" style={{ flex: 1 }} onClick={() => setShowMissedInModal(false)}>
                Cancel
              </IonButton>
              <IonButton expand="block" style={{ flex: 1, '--background': '#d97706', fontWeight: 'bold' }} onClick={() => handleMarkOut(selectedPerson, true)}>
                Auto-IN + OUT
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
