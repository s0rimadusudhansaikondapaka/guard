import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonIcon,
  IonLabel,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  homeOutline,
  peopleOutline,
  qrCodeOutline,
  carOutline,
  timeOutline,
  settingsOutline,
} from 'ionicons/icons';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import GuardHome from './pages/GuardHome';
import WalkInMenu from './pages/WalkInMenu';
import DeliveryMenu from './pages/DeliveryMenu';
import DeliveryPersons from './pages/DeliveryPersons';
import DeliveryVisits from './pages/DeliveryVisits';
import ScanEntry from './pages/ScanEntry';
import VisitorsInside from './pages/VisitorsInside';
import IncidentReport from './pages/IncidentReport';
import SupervisorConsole from './pages/SupervisorConsole';
import GateLogs from './pages/GateLogs';
import Settings from './pages/Settings';

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/login" component={Login} />
              <Route exact path="/home" component={GuardHome} />
              <Route exact path="/walkin-menu" component={WalkInMenu} />
              <Route exact path="/delivery-menu" component={DeliveryMenu} />
              <Route exact path="/delivery-persons" component={DeliveryPersons} />
              <Route exact path="/delivery-visits" component={DeliveryVisits} />
              <Route exact path="/scan-entry" component={ScanEntry} />
              <Route exact path="/visitors-inside" component={VisitorsInside} />
              <Route exact path="/incident-report" component={IncidentReport} />
              <Route exact path="/supervisor-console" component={SupervisorConsole} />
              <Route exact path="/gate-logs" component={GateLogs} />
              <Route exact path="/settings" component={Settings} />
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            {/* Bottom Navigation Tab Bar matching Image 1 Wireframe Screen 1 */}
            <IonTabBar slot="bottom" style={{ '--background': '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={homeOutline} color="primary" />
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>Home</IonLabel>
              </IonTabButton>

              <IonTabButton tab="walkin" href="/walkin-menu">
                <IonIcon icon={peopleOutline} color="primary" />
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>Walk-In</IonLabel>
              </IonTabButton>

              <IonTabButton tab="scan" href="/scan-entry">
                <IonIcon icon={qrCodeOutline} color="primary" />
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>Scan</IonLabel>
              </IonTabButton>

              <IonTabButton tab="delivery" href="/delivery-menu">
                <IonIcon icon={carOutline} color="warning" />
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>Delivery</IonLabel>
              </IonTabButton>

              <IonTabButton tab="settings" href="/settings">
                <IonIcon icon={settingsOutline} color="medium" />
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>Settings</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
