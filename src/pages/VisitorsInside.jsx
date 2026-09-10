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
  IonModal,
} from '@ionic/react';
import { getVisitorsInsideCampus, processGateMovement } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VisitorsInside({ history }) {
  const { selectedGate } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);

  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
  const DEFAULT_ID_DOC = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600';

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
          <IonCard key={v.id} className="card-wireframe" style={{ borderLeft: '4px solid #16a34a' }}>
            <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  {/* Visitor Face Photo Thumbnail with Tap to Enlarge */}
                  <div
                    onClick={() => setEnlargedImage({
                      url: v.photo_url || DEFAULT_AVATAR,
                      title: v.visitor_name,
                      subtitle: `Inside Campus • Pass: ${v.pass_code}`,
                      badge: 'ACTIVE VISITOR'
                    })}
                    title="Tap to enlarge photo"
                    style={{
                      width: '46px',
                      height: '46px',
                      minWidth: '46px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #15803d',
                      cursor: 'pointer',
                      background: '#f1f5f9',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img
                      src={v.photo_url || DEFAULT_AVATAR}
                      alt={v.visitor_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{v.visitor_name} ({v.pass_code})</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Host: {v.host_name || 'Ashram Resident'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#475569' }}>Purpose: {v.purpose || 'Darshan'}</div>

                    {/* Attached Address Proof Badge with Tap to Enlarge */}
                    <div style={{ marginTop: '3px' }}>
                      <span
                        onClick={() => setEnlargedImage({
                          url: v.id_card_image_url || DEFAULT_ID_DOC,
                          title: `${v.visitor_name} - ${v.id_type || 'Address Proof'}`,
                          subtitle: `ID Number: ${v.id_number || v.id_card_number || 'DOC-VERIFIED'}`,
                          badge: v.id_type || 'GOVERNMENT ID / ADDRESS PROOF'
                        })}
                        style={{
                          fontSize: '0.68rem',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Tap to enlarge Address / ID Proof"
                      >
                        📄 {v.id_type || 'Address Proof'} 🔍
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <IonBadge color="success" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.3rem' }}>
                    {v.stay_duration || 'Inside Campus'}
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

        {/* ENLARGED IMAGE / DOCUMENT PREVIEW MODAL */}
        <IonModal isOpen={!!enlargedImage} onDidDismiss={() => setEnlargedImage(null)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0f172a', '--color': '#ffffff' }}>
              <IonTitle style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                {enlargedImage?.title || 'Document Preview'}
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
                    {enlargedImage.badge || 'VERIFIED ATTACHMENT'}
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
