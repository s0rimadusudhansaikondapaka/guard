import React from 'react';
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
  IonIcon,
} from '@ionic/react';
import { carOutline, timeOutline } from 'ionicons/icons';

export default function DeliveryMenu({ history }) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#d97706', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Guard - Delivery Page</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        
        {/* 2 Golden Orange Tiles matching Image 4 (Guard - Delivery Page) */}
        <IonGrid className="ion-no-padding" style={{ marginTop: '1rem' }}>
          <IonRow style={{ margin: '-0.5rem' }}>
            
            {/* Tile 1: DELIVERY PERSONS */}
            <IonCol size="6" style={{ padding: '0.5rem' }}>
              <div
                className="asram-tile-orange"
                onClick={() => history.push('/delivery-persons')}
                style={{
                  height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center', padding: '1rem'
                }}
              >
                <IonIcon icon={carOutline} style={{ fontSize: '40px', marginBottom: '0.6rem' }} />
                <strong style={{ fontSize: '0.95rem', letterSpacing: '0.5px', lineHeight: '1.3' }}>
                  DELIVERY<br />PERSONS
                </strong>
              </div>
            </IonCol>

            {/* Tile 2: DELIVERY VISITS */}
            <IonCol size="6" style={{ padding: '0.5rem' }}>
              <div
                className="asram-tile-orange"
                onClick={() => history.push('/delivery-visits')}
                style={{
                  height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textAlign: 'center', padding: '1rem'
                }}
              >
                <IonIcon icon={timeOutline} style={{ fontSize: '40px', marginBottom: '0.6rem' }} />
                <strong style={{ fontSize: '0.95rem', letterSpacing: '0.5px', lineHeight: '1.3' }}>
                  DELIVERY<br />VISITS
                </strong>
              </div>
            </IonCol>

          </IonRow>
        </IonGrid>

      </IonContent>
    </IonPage>
  );
}
