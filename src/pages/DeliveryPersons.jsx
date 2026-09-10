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
  const [enlargedImage, setEnlargedImage] = useState(null);

  const DEFAULT_COURIER_AVATAR = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300';
  const DEFAULT_COURIER_DOC = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600';

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Courier Face Photo Thumbnail with Tap to Enlarge */}
                  <div
                    onClick={() => setEnlargedImage({
                      url: dp.photo_url || DEFAULT_COURIER_AVATAR,
                      title: dp.full_name,
                      subtitle: `${dp.company_name} Courier Partner • Phone: ${dp.phone}`,
                      badge: 'COURIER PROFILE'
                    })}
                    title="Tap to enlarge photo"
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #4f46e5',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{dp.full_name}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 'bold' }}>🏢 {dp.company_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {dp.phone}</div>
                    <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: '2px' }}>
                      🚗 {dp.vehicle_type}: <strong>{dp.vehicle_number || 'N/A'}</strong>
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
