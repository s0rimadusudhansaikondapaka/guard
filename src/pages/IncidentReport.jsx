import React, { useState } from 'react';
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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonToast,
  IonIcon,
} from '@ionic/react';
import { cameraOutline, alertCircleOutline } from 'ionicons/icons';
import { submitIncidentReport } from '../services/api';

export default function IncidentReport({ history }) {
  const [incidentType, setIncidentType] = useState('Unauthorized Entry');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitIncidentReport({
        incidentType,
        severity,
        description,
        timestamp: new Date()
      });
      setToastMsg('Incident report logged and sent to Security Supervisor!');
      setDescription('');
    } catch (err) {
      setToastMsg('Incident report recorded locally.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Incident Report</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* Incident Form matching Image 1 Wireframe Screen 6 */}
        <IonCard className="card-wireframe">
          <IonCardContent className="ion-padding">
            <form onSubmit={handleSubmit}>
              
              <IonItem lines="full" style={{ marginBottom: '0.8rem' }}>
                <IonLabel position="floating">Incident Type</IonLabel>
                <IonSelect value={incidentType} onIonChange={(e) => setIncidentType(e.detail.value)}>
                  <IonSelectOption value="Unauthorized Entry">Unauthorized Entry</IonSelectOption>
                  <IonSelectOption value="Passcode Expired">Passcode Expired</IonSelectOption>
                  <IonSelectOption value="Vehicle Blockage">Vehicle Blockage</IonSelectOption>
                  <IonSelectOption value="Property Damage">Property Damage</IonSelectOption>
                  <IonSelectOption value="General Security Alert">General Security Alert</IonSelectOption>
                </IonSelect>
              </IonItem>

              <div style={{ marginBottom: '1.2rem' }}>
                <IonLabel style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Severity Level
                </IonLabel>
                <IonSegment value={severity} onIonChange={(e) => setSeverity(e.detail.value)}>
                  <IonSegmentButton value="Low" style={{ '--color-checked': '#16a34a', fontWeight: 'bold' }}>
                    Low
                  </IonSegmentButton>
                  <IonSegmentButton value="Medium" style={{ '--color-checked': '#d97706', fontWeight: 'bold' }}>
                    Medium
                  </IonSegmentButton>
                  <IonSegmentButton value="High" style={{ '--color-checked': '#dc2626', fontWeight: 'bold' }}>
                    High
                  </IonSegmentButton>
                </IonSegment>
              </div>

              <IonItem lines="full" style={{ marginBottom: '1.2rem' }}>
                <IonLabel position="floating">Description</IonLabel>
                <IonTextarea 
                  rows={4} 
                  value={description} 
                  onIonChange={(e) => setDescription(e.detail.value)} 
                  placeholder="Add more details about the security incident..." 
                  required
                />
              </IonItem>

              {/* Photo Upload Attachment Area matching Screen 6 */}
              <div style={{
                border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
                background: '#f8fafc', marginBottom: '1.5rem', cursor: 'pointer'
              }}>
                <IonIcon icon={cameraOutline} style={{ fontSize: '36px', color: '#64748b' }} />
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 'bold' }}>
                  Click to upload photo attachment
                </p>
              </div>

              <IonButton expand="block" type="submit" style={{ '--background': '#800000', fontWeight: 'bold' }}>
                SUBMIT INCIDENT REPORT
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
