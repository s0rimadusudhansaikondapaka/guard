import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonBadge,
} from '@ionic/react';
import {
  shieldCheckmark,
  qrCodeOutline,
  personAddOutline,
  peopleOutline,
  timeOutline,
  warningOutline,
  carOutline,
  menuOutline,
  phonePortraitOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

export default function GuardHome({ history }) {
  const { device, onDutyGuards, selectedGate } = useAuth();

  const deviceId = device?.device_id || 'DEV-NORTH-01';
  const deviceName = device?.device_name || 'North Gate Terminal Phone';
  const gateDisplay = (selectedGate || device?.gate_name || 'NORTH_GATE').replace('_', ' ');

  const navigate = (path) => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    history.push(path);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IonIcon icon={shieldCheckmark} style={{ fontSize: '24px', color: '#f59e0b' }} />
              <div>
                <IonTitle style={{ padding: 0, fontSize: '1rem', fontWeight: 'bold' }}>
                  {gateDisplay}
                </IonTitle>
                <span style={{ fontSize: '0.68rem', color: '#fde68a', display: 'block', lineHeight: 1 }}>
                  Ashram Terminal: {deviceId}
                </span>
              </div>
            </div>
            <IonButton fill="clear" style={{ color: '#ffffff' }} onClick={() => navigate('/settings')}>
              <IonIcon icon={menuOutline} style={{ fontSize: '24px' }} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* Ashram Device Profile & On-Duty Guard Status (No Shift Info, Fixed Gate Info) */}
        <IonCard style={{ borderRadius: '14px', margin: '0 0 1rem 0', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', background: '#ffffff' }}>
          <IonCardContent className="ion-padding" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IonIcon icon={phonePortraitOutline} style={{ fontSize: '20px', color: '#800000' }} />
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{deviceName}</strong>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                    ID: <strong>{deviceId}</strong> • Assigned Gate: <strong style={{ color: '#800000' }}>{gateDisplay}</strong>
                  </span>
                </div>
              </div>
              <IonBadge color="success" style={{ fontSize: '0.7rem' }}>ONLINE</IonBadge>
            </div>

            {/* Currently On-Duty Guards Roster for this Device */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.65rem 0.75rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👮 On-Duty Guards ({onDutyGuards.length})
                </span>
                <IonButton 
                  size="small" 
                  fill="clear" 
                  style={{ fontSize: '0.72rem', height: '22px', fontWeight: 'bold', color: '#800000' }}
                  onClick={() => navigate('/settings')}
                >
                  Manage Duty
                </IonButton>
              </div>

              {onDutyGuards.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {onDutyGuards.map((g) => (
                    <div 
                      key={g.id || g.guard_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff',
                        padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '0.75rem'
                      }}
                    >
                      <IonIcon icon={personCircleOutline} style={{ color: '#16a34a', fontSize: '16px' }} />
                      <strong style={{ color: '#1e293b' }}>{g.guard_name}</strong>
                      {g.guard_phone && <span style={{ color: '#64748b', fontSize: '0.7rem' }}>({g.guard_phone.slice(-4)})</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>
                    No guards on-duty yet
                  </span>
                  <IonButton 
                    size="small" 
                    style={{ '--background': '#800000', fontSize: '0.7rem', height: '26px', fontWeight: 'bold' }}
                    onClick={() => navigate('/settings')}
                  >
                    + Add Guard
                  </IonButton>
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* 3 Prominent Wireframe Category Tiles matching Image 3 (Guard Home Page) */}
        <div style={{ marginBottom: '1.2rem' }}>
          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Main Gate Categories
          </h4>

          <IonGrid className="ion-no-padding">
            <IonRow style={{ margin: '-0.3rem' }}>
              {/* Tile 1: WALK-IN VISITOR (Deep Red #800000) */}
              <IonCol size="6" style={{ padding: '0.3rem' }}>
                <div 
                  className="asram-tile-red"
                  onClick={() => navigate('/walkin-menu')}
                  style={{
                    height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', textAlign: 'center', padding: '0.8rem'
                  }}
                >
                  <IonIcon icon={peopleOutline} style={{ fontSize: '32px', marginBottom: '0.4rem' }} />
                  <strong style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>WALK-IN VISITOR</strong>
                </div>
              </IonCol>

              {/* Tile 2: INVITED VISITORS (Royal Blue #1D4ED8, Beside Walk-In Visitor) */}
              <IonCol size="6" style={{ padding: '0.3rem' }}>
                <div 
                  className="asram-tile-blue"
                  onClick={() => navigate('/scan-entry?tab=invited')}
                  style={{
                    height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', textAlign: 'center', padding: '0.8rem'
                  }}
                >
                  <IonIcon icon={qrCodeOutline} style={{ fontSize: '32px', marginBottom: '0.4rem' }} />
                  <strong style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>INVITED VISITORS</strong>
                </div>
              </IonCol>

              {/* Tile 3: DELIVERY (Golden Orange #F59E0B) */}
              <IonCol size="6" style={{ padding: '0.3rem' }}>
                <div 
                  className="asram-tile-orange"
                  onClick={() => navigate('/delivery-menu')}
                  style={{
                    height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', textAlign: 'center', padding: '0.8rem'
                  }}
                >
                  <IonIcon icon={carOutline} style={{ fontSize: '32px', marginBottom: '0.4rem' }} />
                  <strong style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>DELIVERY</strong>
                </div>
              </IonCol>

              {/* Tile 4: VEHICLES (Burnt Amber #B45309) */}
              <IonCol size="6" style={{ padding: '0.3rem' }}>
                <div 
                  className="asram-tile-amber"
                  onClick={() => navigate('/scan-entry')}
                  style={{
                    height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', textAlign: 'center', padding: '0.8rem'
                  }}
                >
                  <IonIcon icon={carOutline} style={{ fontSize: '32px', marginBottom: '0.4rem' }} />
                  <strong style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>VEHICLES GATE</strong>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* 6 Quick Action Tiles matching Image 1 Wireframe Screen 1 */}
        <div>
          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Actions & Verification
          </h4>

          <IonGrid className="ion-no-padding">
            <IonRow style={{ margin: '-0.3rem' }}>
              <IonCol size="4" style={{ padding: '0.3rem' }}>
                <IonCard onClick={() => navigate('/supervisor-console')} style={{ margin: 0, textAlign: 'center', padding: '0.8rem 0.4rem', borderRadius: '12px', background: '#ffffff' }}>
                  <IonIcon icon={timeOutline} color="warning" style={{ fontSize: '28px' }} />
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '0.3rem', color: '#1e293b' }}>
                    Validation Queue
                  </span>
                </IonCard>
              </IonCol>

              <IonCol size="4" style={{ padding: '0.3rem' }}>
                <IonCard onClick={() => navigate('/scan-entry')} style={{ margin: 0, textAlign: 'center', padding: '0.8rem 0.4rem', borderRadius: '12px', background: '#ffffff' }}>
                  <IonIcon icon={qrCodeOutline} color="primary" style={{ fontSize: '28px' }} />
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '0.3rem', color: '#1e293b' }}>
                    Scan QR
                  </span>
                </IonCard>
              </IonCol>

              <IonCol size="4" style={{ padding: '0.3rem' }}>
                <IonCard onClick={() => navigate('/walkin-menu')} style={{ margin: 0, textAlign: 'center', padding: '0.8rem 0.4rem', borderRadius: '12px', background: '#ffffff' }}>
                  <IonIcon icon={personAddOutline} color="success" style={{ fontSize: '28px' }} />
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '0.3rem', color: '#1e293b' }}>
                    New Visitor
                  </span>
                </IonCard>
              </IonCol>

              <IonCol size="4" style={{ padding: '0.3rem' }}>
                <IonCard onClick={() => navigate('/visitors-inside')} style={{ margin: 0, textAlign: 'center', padding: '0.8rem 0.4rem', borderRadius: '12px', background: '#ffffff' }}>
                  <IonIcon icon={peopleOutline} color="tertiary" style={{ fontSize: '28px' }} />
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '0.3rem', color: '#1e293b' }}>
                    Visitors Inside
                  </span>
                </IonCard>
              </IonCol>

              <IonCol size="4" style={{ padding: '0.3rem' }}>
                <IonCard onClick={() => navigate('/gate-logs')} style={{ margin: 0, textAlign: 'center', padding: '0.8rem 0.4rem', borderRadius: '12px', background: '#ffffff' }}>
                  <IonIcon icon={timeOutline} color="medium" style={{ fontSize: '28px' }} />
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '0.3rem', color: '#1e293b' }}>
                    Visitor History
                  </span>
                </IonCard>
              </IonCol>

              <IonCol size="4" style={{ padding: '0.3rem' }}>
                <IonCard onClick={() => navigate('/incident-report')} style={{ margin: 0, textAlign: 'center', padding: '0.8rem 0.4rem', borderRadius: '12px', background: '#ffffff' }}>
                  <IonIcon icon={warningOutline} color="danger" style={{ fontSize: '28px' }} />
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '0.3rem', color: '#1e293b' }}>
                    Incident Report
                  </span>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

      </IonContent>
    </IonPage>
  );
}
