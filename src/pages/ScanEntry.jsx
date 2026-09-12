import React, { useState, useEffect, useRef } from 'react';
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
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonToast,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonModal,
  IonSearchbar,
  IonList,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import {
  qrCodeOutline,
  cameraOutline,
  refreshOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  searchOutline,
  peopleOutline,
  carOutline,
  timeOutline,
  alertCircleOutline,
  logInOutline,
  logOutOutline,
  saveOutline,
  personOutline,
  homeOutline,
  trashOutline,
  addCircleOutline,
} from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { verifyGatePass, processGateMovement, getInvitedVisitors, updateVisitorGateDetails } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ScanEntry({ history, location }) {
  const { selectedGate } = useAuth();

  // URL Tab handling (?tab=invited)
  const queryParams = new URLSearchParams(location?.search || '');
  const initialTab = queryParams.get('tab') === 'invited' ? 'invited' : 'scan';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Guard Restricted Edit States (Rule 4: ONLY number of people & vehicle details)
  const [editMen, setEditMen] = useState(1);
  const [editWomen, setEditWomen] = useState(0);
  const [editBoys, setEditBoys] = useState(0);
  const [editGirls, setEditGirls] = useState(0);
  const [editVehicle, setEditVehicle] = useState('');
  const [editVehicles, setEditVehicles] = useState([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Invited Visitors List (+8h upcoming & active checked-in)
  const [invitedList, setInvitedList] = useState([]);
  const [invitedSearch, setInvitedSearch] = useState('');
  const [invitedLoading, setInvitedLoading] = useState(false);
  const [quickProcessingId, setQuickProcessingId] = useState(null);

  // Search Results List (Scan & Search Tab)
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Enlarged Image Preview Modal state
  const [enlargedImage, setEnlargedImage] = useState(null); // { url, title, subtitle, badge }

  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
  const DEFAULT_ID_DOC = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600';

  const html5QrCodeRef = useRef(null);

  const cleanDecodedCode = (text) => {
    if (!text) return '';
    let str = text.trim();
    if (str.startsWith('{')) {
      try {
        const obj = JSON.parse(str);
        return obj.pass_code || obj.passCode || obj.code || obj.id || str;
      } catch (e) {}
    }
    if (str.includes('/')) {
      const parts = str.split('/');
      return parts[parts.length - 1] || str;
    }
    return str;
  };

  const startScanner = async () => {
    setCameraError('');
    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {}
      }
      const qrElement = document.getElementById('qr-reader');
      if (!qrElement) return;

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      setIsScanning(true);
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const code = cleanDecodedCode(decodedText);
          stopScanner();
          handleVerifyByCode(code);
        },
        () => {}
      );
    } catch (err) {
      setIsScanning(false);
      setCameraError('Camera access unavailable or permission denied.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {}
    }
    setIsScanning(false);
  };

  useEffect(() => {
    fetchInvitedVisitorsList();
    if (activeTab === 'scan') {
      const timer = setTimeout(() => {
        startScanner();
      }, 400);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab]);

  const fetchInvitedVisitorsList = async (search = '') => {
    setInvitedLoading(true);
    try {
      const res = await getInvitedVisitors({ search, gate_name: selectedGate });
      if (res.success) {
        const seen = new Set();
        const unique = (res.visitors || []).filter((v) => {
          const key = v.pass_code || v.id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setInvitedList(unique);
      }
    } catch (err) {
      console.error('Failed to load invited visitors:', err);
    } finally {
      setInvitedLoading(false);
    }
  };

  const populatePassForm = (pass) => {
    setPassData(pass);
    setEditMen(pass.adult_men_count !== undefined ? pass.adult_men_count : 1);
    setEditWomen(pass.adult_women_count !== undefined ? pass.adult_women_count : 0);
    setEditBoys(pass.boys_count !== undefined ? pass.boys_count : 0);
    setEditGirls(pass.girls_count !== undefined ? pass.girls_count : 0);

    let initialVehs = [];
    if (pass.vehicles && Array.isArray(pass.vehicles) && pass.vehicles.length > 0) {
      initialVehs = pass.vehicles.map((v) => ({
        plate_number: v.plate_number || '',
        vehicle_type: v.vehicle_type || 'Car',
        driver_name: v.driver_name || '',
        driver_phone: v.driver_phone || '',
      }));
    } else if (pass.vehicle_no || pass.registered_plate_number || pass.visitor_vehicle_no) {
      initialVehs = [{
        plate_number: pass.vehicle_no || pass.registered_plate_number || pass.visitor_vehicle_no,
        vehicle_type: pass.vehicle_type || pass.registered_vehicle_type || 'Car',
        driver_name: '',
        driver_phone: '',
      }];
    }
    setEditVehicles(initialVehs);
    setEditVehicle(initialVehs.length > 0 ? initialVehs[0].plate_number : '');
    setShowDetailModal(true);
  };

  const VEHICLE_TYPE_OPTIONS = [
    'Select',
    'Two-Wheeler',
    'Car',
    'Auto Rickshaw',
    'Taxi / Cab',
    'Van',
    'Bus',
    'Mini Bus',
    'Tractor',
    'Construction Vehicle',
    'Other'
  ];

  const handleAddVehicle = () => {
    if (editVehicles.length >= 5) {
      setToastMsg('Maximum of 5 vehicles allowed per visitor.');
      return;
    }
    setEditVehicles((prev) => [
      ...prev,
      { plate_number: '', vehicle_type: 'Select', driver_name: '', driver_phone: '' }
    ]);
  };

  const handleRemoveVehicle = (index) => {
    setEditVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVehicleChange = (index, field, value) => {
    setEditVehicles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleVerifyByCode = async (codeToVerify) => {
    const code = codeToVerify || searchQuery;
    if (!code) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await verifyGatePass(code);
      const rawMatches = res.matches && res.matches.length > 0 ? res.matches : (res.pass ? [res.pass] : []);
      const seen = new Set();
      const uniqueMatches = rawMatches.filter((m) => {
        const k = m.pass_code || m.id;
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      setSearchResults(uniqueMatches);

      if (uniqueMatches.length === 1) {
        // Single record: show in list AND open record details modal
        populatePassForm(uniqueMatches[0]);
        setToastMsg('1 record found and opened.');
      } else if (uniqueMatches.length > 1) {
        // Multiple records: show list so guard can choose
        setShowDetailModal(false);
        setToastMsg(`${uniqueMatches.length} matching visitors found in list. Tap any record to open.`);
      } else {
        setToastMsg(res.message || 'Gate pass not found.');
      }
    } catch (err) {
      setSearchResults([]);
      setToastMsg('Gate pass not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleVerify = (e) => {
    e?.preventDefault();
    handleVerifyByCode(searchQuery);
  };

  // Rule 4: Guard Restricted Edit: ONLY number of people and vehicle details
  const handleSaveVisitorDetails = async () => {
    if (!passData) return;
    setSavingDetails(true);
    const validVehicles = editVehicles.filter(v => v.plate_number && String(v.plate_number).trim() !== '');
    const primaryVehicle = validVehicles.length > 0 ? validVehicles[0].plate_number : '';
    try {
      const res = await updateVisitorGateDetails(passData.id, {
        adult_men_count: parseInt(editMen) || 0,
        adult_women_count: parseInt(editWomen) || 0,
        boys_count: parseInt(editBoys) || 0,
        girls_count: parseInt(editGirls) || 0,
        vehicle_no: primaryVehicle,
        vehicles: validVehicles,
      });
      if (res.success) {
        setToastMsg('Visitor people count and vehicle details updated!');
        const vehicleDetailsStr = validVehicles.length > 0
          ? validVehicles.map(v => `${v.plate_number} (${v.vehicle_type || 'Car'})`).join(', ')
          : 'None';
        setPassData((prev) => ({
          ...prev,
          adult_men_count: parseInt(editMen) || 0,
          adult_women_count: parseInt(editWomen) || 0,
          boys_count: parseInt(editBoys) || 0,
          girls_count: parseInt(editGirls) || 0,
          children_count: (parseInt(editBoys) || 0) + (parseInt(editGirls) || 0),
          person_count: (parseInt(editMen) || 0) + (parseInt(editWomen) || 0) + (parseInt(editBoys) || 0) + (parseInt(editGirls) || 0),
          vehicle_no: primaryVehicle,
          vehicles: validVehicles,
          vehicle_details: vehicleDetailsStr,
        }));
        fetchInvitedVisitorsList(invitedSearch);
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === passData.id
              ? {
                  ...item,
                  adult_men_count: parseInt(editMen) || 0,
                  adult_women_count: parseInt(editWomen) || 0,
                  boys_count: parseInt(editBoys) || 0,
                  girls_count: parseInt(editGirls) || 0,
                  children_count: (parseInt(editBoys) || 0) + (parseInt(editGirls) || 0),
                  person_count: (parseInt(editMen) || 0) + (parseInt(editWomen) || 0) + (parseInt(editBoys) || 0) + (parseInt(editGirls) || 0),
                  vehicle_no: primaryVehicle,
                  vehicles: validVehicles,
                  vehicle_details: vehicleDetailsStr,
                }
              : item
          )
        );
      } else {
        setToastMsg(res.message || 'Failed to update visitor details.');
      }
    } catch (err) {
      setToastMsg('Failed to update visitor details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // Direct Quick Check-In from Invited Visitors Card / List
  const handleQuickCheckIn = async (e, vis) => {
    e.stopPropagation(); // prevent opening details modal
    if (!vis) return;

    const now = new Date();
    const validUntil = vis.valid_until ? new Date(vis.valid_until) : null;
    const isPermanent = vis.is_permanent_pass;
    const departureTimePassed = validUntil && now > validUntil;

    if (!isPermanent && departureTimePassed) {
      setToastMsg(`Cannot check in. Estimated departure time (${validUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) has passed.`);
      return;
    }

    if (vis.presence_status === 'currently_inside') {
      setToastMsg('Visitor is already checked-in and inside campus.');
      return;
    }

    setQuickProcessingId(vis.id);
    try {
      const res = await processGateMovement({
        registration_id: vis.id,
        gate_name: selectedGate || 'NORTH_GATE',
        direction: 'IN',
        adult_men_count: parseInt(vis.adult_men_count) || 1,
        adult_women_count: parseInt(vis.adult_women_count) || 0,
        boys_count: parseInt(vis.boys_count) || 0,
        girls_count: parseInt(vis.girls_count) || 0,
        children_count: (parseInt(vis.boys_count) || 0) + (parseInt(vis.girls_count) || 0) || parseInt(vis.children_count) || 0,
        vehicle_no: vis.vehicle_no || '',
      });

      if (res.success) {
        setToastMsg(res.message || `Check-in recorded for ${vis.visitor_name} at ${selectedGate || 'Gate'}!`);
        setInvitedList((prev) =>
          prev.map((item) =>
            item.id === vis.id
              ? {
                  ...item,
                  status: 'INSIDE_CAMPUS',
                  lifecycle_status: 'CHECKED-IN',
                  presence_status: 'currently_inside',
                  is_in_enabled: false,
                  is_out_enabled: true,
                }
              : item
          )
        );
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === vis.id
              ? {
                  ...item,
                  status: 'INSIDE_CAMPUS',
                  lifecycle_status: 'CHECKED-IN',
                  presence_status: 'currently_inside',
                  is_in_enabled: false,
                  is_out_enabled: true,
                }
              : item
          )
        );
        fetchInvitedVisitorsList(invitedSearch);
      } else {
        setToastMsg(res.message || 'Check-in failed.');
      }
    } catch (err) {
      setToastMsg(err.response?.data?.message || 'Failed to record check-in.');
    } finally {
      setQuickProcessingId(null);
    }
  };

  // Rule 6, 7, 8, 9, 10: Process Gate Movement (IN / OUT)
  const handleMovement = async (direction) => {
    if (!passData) return;

    const now = new Date();
    const validUntil = passData.valid_until ? new Date(passData.valid_until) : null;
    const isPermanent = passData.is_permanent_pass;
    const departureTimePassed = validUntil && now > validUntil;

    // Rule 7: IN button should be only enabled till the Visitor's estimated departure time
    if (direction === 'IN' && !isPermanent && departureTimePassed) {
      setToastMsg(`Cannot enter IN. Estimated departure time (${validUntil.toLocaleTimeString()}) has passed.`);
      return;
    }

    // Rule 8: OUT button should be enabled if Visitor's status is 'currently_inside'
    const isCurrentlyInside = passData.presence_status === 'currently_inside' || passData.presence_status === 'over_stayed' || passData.status === 'INSIDE_CAMPUS';
    if (direction === 'OUT' && !isPermanent && !isCurrentlyInside) {
      setToastMsg('Visitor is not currently inside campus. OUT exit is disabled.');
      return;
    }

    try {
      const validVehicles = editVehicles.filter(v => v.plate_number && String(v.plate_number).trim() !== '');
      const primaryVehicle = validVehicles.length > 0 ? validVehicles[0].plate_number : (editVehicle || '');
      const res = await processGateMovement({
        registration_id: passData.id,
        gate_name: selectedGate,
        direction: direction,
        adult_men_count: parseInt(editMen) || 0,
        adult_women_count: parseInt(editWomen) || 0,
        boys_count: parseInt(editBoys) || 0,
        girls_count: parseInt(editGirls) || 0,
        vehicle_no: primaryVehicle,
        vehicles: validVehicles,
      });

      if (res.success) {
        setToastMsg(res.message || `Movement recorded: ${direction} at ${selectedGate}!`);
        const nextInEnabled = res.is_in_enabled !== undefined ? res.is_in_enabled : (res.presence_status !== 'currently_inside' && res.presence_status !== 'over_stayed' && !departureTimePassed);
        const nextOutEnabled = res.is_out_enabled !== undefined ? res.is_out_enabled : (res.presence_status === 'currently_inside' || res.presence_status === 'over_stayed');

        setPassData((prev) => ({
          ...prev,
          status: res.status,
          lifecycle_status: res.lifecycle_status,
          presence_status: res.presence_status,
          is_in_enabled: nextInEnabled,
          is_out_enabled: nextOutEnabled,
        }));
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === passData.id
              ? {
                  ...item,
                  status: res.status,
                  lifecycle_status: res.lifecycle_status,
                  presence_status: res.presence_status,
                  is_in_enabled: nextInEnabled,
                  is_out_enabled: nextOutEnabled,
                }
              : item
          )
        );
        fetchInvitedVisitorsList(invitedSearch);
      } else {
        setToastMsg(res.message || 'Movement failed.');
      }
    } catch (err) {
      setToastMsg(err.response?.data?.message || 'Failed to record gate movement.');
    }
  };

  // Check Gating for UI buttons
  const isDeparturePassed = passData && !passData.is_permanent_pass && passData.valid_until && new Date() > new Date(passData.valid_until);
  const isInside = passData && (passData.presence_status === 'currently_inside' || passData.status === 'INSIDE_CAMPUS');
  const isOverstayed = passData && passData.presence_status === 'over_stayed';
  const isUnapproved = passData && passData.status && passData.status !== 'APPROVED' && passData.status !== 'INSIDE_CAMPUS' && !passData.is_permanent_pass && !passData.is_vvip && !passData.bypassed_by_admin;
  const isInDisabled = !passData || isUnapproved || (passData.is_in_enabled !== undefined ? !passData.is_in_enabled : (!passData.is_permanent_pass && (isDeparturePassed || isInside || isOverstayed)));
  const isOutDisabled = !passData || (passData.is_out_enabled !== undefined ? !passData.is_out_enabled : (!passData.is_permanent_pass && !isInside && !isOverstayed));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Gate Security Control</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
        {/* Dual Mode Switch: 1. QR Code Scan / Passcode | 2. Invited Visitors */}
        <div style={{ marginBottom: '1rem' }}>
          <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value)} style={{ background: '#e2e8f0', borderRadius: '10px' }}>
            <IonSegmentButton value="scan" style={{ '--color-checked': '#800000', fontWeight: 'bold' }}>
              <IonLabel>📷 Scan QR / Search</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="invited" style={{ '--color-checked': '#1d4ed8', fontWeight: 'bold' }}>
              <IonLabel>📋 Invited Visitors ({invitedList.length})</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* TAB 1: QR CODE CAMERA SCANNER & SEARCH */}
        {activeTab === 'scan' && (
          <div>
            {/* Live Camera Viewport */}
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <div style={{
                width: '280px', minHeight: '230px', margin: '0 auto', border: isScanning ? '3px solid #16a34a' : '3px dashed #800000',
                borderRadius: '16px', background: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
              }}>
                <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>

                {!isScanning && (
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <IonIcon icon={qrCodeOutline} style={{ fontSize: '56px', color: '#800000', marginBottom: '0.4rem' }} />
                    <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 'bold' }}>
                      {cameraError || 'Point camera at Visitor QR code'}
                    </p>
                    <IonButton 
                      size="small" 
                      onClick={startScanner}
                      style={{ '--background': '#800000', fontWeight: 'bold' }}
                    >
                      <IonIcon slot="start" icon={cameraOutline} />
                      START CAMERA
                    </IonButton>
                  </div>
                )}

                {isScanning && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
                    <IonButton 
                      size="small" 
                      color="danger" 
                      fill="solid"
                      onClick={stopScanner}
                      style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      STOP CAMERA
                    </IonButton>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Manual Search */}
            <IonCard className="card-wireframe" style={{ margin: '0 0 1rem 0' }}>
              <IonCardContent className="ion-padding" style={{ padding: '0.8rem' }}>
                <form onSubmit={handleVerify}>
                  <IonItem lines="full">
                    <IonLabel position="floating">Pass Code / Phone / Vehicle Plate</IonLabel>
                    <IonInput 
                      value={searchQuery} 
                      onIonChange={(e) => setSearchQuery(e.detail.value)} 
                      placeholder="e.g. PASS-1001, last 4 digits phone..." 
                      required
                    />
                  </IonItem>
                  <IonButton expand="block" type="submit" style={{ '--background': '#800000', fontWeight: 'bold', marginTop: '0.8rem' }}>
                    {loading ? <IonSpinner name="crescent" /> : 'VERIFY & OPEN RECORD'}
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>

            {/* Search Results List on Scan / Search Tab */}
            {hasSearched && (
              <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#800000' }}>
                      📋 Search Results ({searchResults.length})
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                      {searchResults.length === 1
                        ? '1 matching record found'
                        : `${searchResults.length} matching records found - Tap to view & take action`}
                    </span>
                  </div>
                  <IonButton
                    size="small"
                    fill="outline"
                    color="medium"
                    onClick={handleClearSearch}
                    style={{ fontSize: '0.72rem', height: '28px' }}
                  >
                    CLEAR
                  </IonButton>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <IonSpinner name="crescent" color="primary" />
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>Searching records...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <IonIcon icon={peopleOutline} style={{ fontSize: '38px', color: '#94a3b8' }} />
                    <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', margin: '0.4rem 0 0 0' }}>
                      No matching records found for "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <IonList style={{ background: 'transparent' }}>
                    {searchResults.map((vis) => (
                      <IonCard
                        key={vis.id}
                        onClick={() => populatePassForm(vis)}
                        style={{
                          margin: '0 0 0.8rem 0',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          background: '#ffffff',
                          cursor: 'pointer',
                          borderLeft: `5px solid ${
                            vis.status && vis.status !== 'APPROVED' && vis.status !== 'INSIDE_CAMPUS' && !vis.is_permanent_pass && !vis.is_vvip && !vis.bypassed_by_admin
                              ? '#f59e0b'
                              : vis.presence_status === 'currently_inside'
                              ? '#16a34a'
                              : vis.presence_status === 'over_stayed'
                              ? '#dc2626'
                              : '#2563eb'
                          }`,
                        }}
                      >
                        <IonCardContent style={{ padding: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Visitor Face Photo Thumbnail with Tap to Enlarge */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setEnlargedImage({
                                  url: vis.photo_url || DEFAULT_AVATAR,
                                  title: vis.visitor_name,
                                  subtitle: `Visitor Profile Photo • Pass: ${vis.pass_code}`,
                                  badge: vis.visitor_category || 'VISITOR'
                                });
                              }}
                              title="Tap to enlarge photo"
                              style={{
                                width: '48px',
                                height: '48px',
                                minWidth: '48px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '2px solid #800000',
                                cursor: 'pointer',
                                background: '#f1f5f9',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                              }}
                            >
                              <img
                                src={vis.photo_url || DEFAULT_AVATAR}
                                alt={vis.visitor_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{vis.visitor_name}</strong>
                                {vis.status && vis.status !== 'APPROVED' && vis.status !== 'INSIDE_CAMPUS' && !vis.is_permanent_pass && !vis.is_vvip && !vis.bypassed_by_admin && (
                                  <IonBadge color="warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                    ⏳ NOT YET APPROVED
                                  </IonBadge>
                                )}
                                {vis.visitor_category === 'VIP' && (
                                  <IonBadge color="warning" style={{ fontSize: '0.62rem', padding: '2px 5px' }}>VIP</IonBadge>
                                )}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                                📞 {vis.visitor_phone ? (vis.visitor_phone.length > 4 ? '******' + vis.visitor_phone.slice(-4) : vis.visitor_phone) : ''} • Host: <strong>{vis.host_name || 'Resident'}</strong>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Pass: <strong>{vis.pass_code}</strong> | {vis.host_flat_info || 'Main Campus'}
                              </div>

                              {/* Vehicles & Category Badges */}
                              <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {vis.status && vis.status !== 'APPROVED' && vis.status !== 'INSIDE_CAMPUS' && !vis.is_permanent_pass && !vis.is_vvip && !vis.bypassed_by_admin ? (
                                  <>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fde68a',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                    }}>
                                      Cat 1: Not Yet Approved
                                    </span>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: '#fff7ed',
                                      color: '#c2410c',
                                      border: '1px solid #fed7aa',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                    }}>
                                      Status: {vis.status === 'PENDING_L1' ? 'Awaiting Host' : vis.status === 'PENDING_L2' ? 'Awaiting L2' : vis.status === 'REJECTED' ? 'Rejected' : 'Pending Approval'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: '#f1f5f9',
                                      color: '#334155',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                    }}>
                                      Cat 1: {vis.lifecycle_status || 'Yet to Arrive'}
                                    </span>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: vis.presence_status === 'currently_inside' ? '#dcfce7' : vis.presence_status === 'over_stayed' ? '#fee2e2' : '#e0f2fe',
                                      color: vis.presence_status === 'currently_inside' ? '#15803d' : vis.presence_status === 'over_stayed' ? '#b91c1c' : '#0369a1',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                    }}>
                                      Cat 2: {vis.presence_status === 'currently_inside' ? 'Inside' : vis.presence_status === 'over_stayed' ? 'Over Stayed' : 'Outside'}
                                    </span>
                                  </>
                                )}

                                {vis.vehicles && vis.vehicles.length > 0 ? (
                                  <span style={{ fontSize: '0.7rem', color: '#1e3a8a', fontWeight: 'bold' }}>
                                    🚗 {vis.vehicles.map(v => `${v.plate_number} (${v.vehicle_type || 'Car'})`).join(', ')}
                                  </span>
                                ) : vis.vehicle_details && vis.vehicle_details !== 'None' ? (
                                  <span style={{ fontSize: '0.7rem', color: '#1e3a8a', fontWeight: 'bold' }}>
                                    🚗 {vis.vehicle_details}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Status badge & action button */}
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', minWidth: '95px' }}>
                              <span style={{ fontSize: '0.7rem', color: vis.departure_time_passed ? '#dc2626' : '#475569', fontWeight: 'bold' }}>
                                Dept: {vis.valid_until ? new Date(vis.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </span>

                              {vis.status && vis.status !== 'APPROVED' && vis.status !== 'INSIDE_CAMPUS' && !vis.is_permanent_pass && !vis.is_vvip && !vis.bypassed_by_admin ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ⏳ NOT APPROVED
                                </span>
                              ) : vis.presence_status === 'currently_inside' ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}>
                                  ✓ INSIDE
                                </span>
                              ) : vis.departure_time_passed ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  fontWeight: 'bold'
                                }}>
                                  EXPIRED
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#dbeafe',
                                  color: '#1d4ed8',
                                  fontWeight: 'bold'
                                }}>
                                  OUTSIDE
                                </span>
                              )}

                              <IonButton
                                size="small"
                                fill="clear"
                                style={{ fontSize: '0.72rem', height: '24px', margin: '0', padding: '0', '--color': '#800000', fontWeight: 'bold' }}
                              >
                                DETAILS &gt;
                              </IonButton>
                            </div>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </IonList>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVITED VISITORS (+8 Hours & Active Checked-In) */}
        {activeTab === 'invited' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#1e3a8a' }}>
                  Invited Visitors (+8h & Active)
                </strong>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                  Upcoming visitors within next 8 hours & active checked-in
                </span>
              </div>
              <IonButton 
                size="small" 
                fill="outline"
                onClick={() => fetchInvitedVisitorsList(invitedSearch)}
                style={{ fontSize: '0.75rem', height: '28px' }}
              >
                <IonIcon slot="icon-only" icon={refreshOutline} />
              </IonButton>
            </div>

            {/* Live Search by Name, last 4 digits phone, or Vehicle */}
            <IonSearchbar
              value={invitedSearch}
              onIonChange={(e) => {
                const q = e.detail.value || '';
                setInvitedSearch(q);
                fetchInvitedVisitorsList(q);
              }}
              placeholder="Search by Name, phone (last 4), vehicle..."
              style={{ padding: '0 0 0.8rem 0' }}
            />

            {invitedLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <IonSpinner name="crescent" color="primary" />
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem' }}>Loading visitors...</p>
              </div>
            ) : invitedList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <IonIcon icon={peopleOutline} style={{ fontSize: '42px', color: '#94a3b8' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', margin: '0.4rem 0 0 0' }}>
                  No invited visitors found matching criteria
                </p>
              </div>
            ) : (
              <IonList style={{ background: 'transparent' }}>
                {invitedList.map((vis) => (
                  <IonCard
                    key={vis.id}
                    onClick={() => populatePassForm(vis)}
                    style={{
                      margin: '0 0 0.8rem 0',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      background: '#ffffff',
                      cursor: 'pointer',
                      borderLeft: `5px solid ${vis.presence_status === 'currently_inside' ? '#16a34a' : vis.presence_status === 'over_stayed' ? '#dc2626' : '#2563eb'}`
                    }}
                  >
                    <IonCardContent style={{ padding: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Visitor Face Photo Thumbnail with Tap to Enlarge */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedImage({
                              url: vis.photo_url || DEFAULT_AVATAR,
                              title: vis.visitor_name,
                              subtitle: `Invited Visitor • Pass: ${vis.pass_code}`,
                              badge: vis.visitor_category || 'INVITED VISITOR'
                            });
                          }}
                          title="Tap to enlarge photo"
                          style={{
                            width: '48px',
                            height: '48px',
                            minWidth: '48px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid #1d4ed8',
                            cursor: 'pointer',
                            background: '#f1f5f9',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          }}
                        >
                          <img
                            src={vis.photo_url || DEFAULT_AVATAR}
                            alt={vis.visitor_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{vis.visitor_name}</strong>
                            {vis.visitor_category === 'VIP' && (
                              <IonBadge color="warning" style={{ fontSize: '0.62rem', padding: '2px 5px' }}>VIP</IonBadge>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                            📞 {vis.visitor_phone ? (vis.visitor_phone.length > 4 ? '******' + vis.visitor_phone.slice(-4) : vis.visitor_phone) : ''} • Host: <strong>{vis.host_name || 'Resident'}</strong>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Pass: <strong>{vis.pass_code}</strong> | {vis.host_flat_info || 'Main Campus'}
                          </div>

                          {/* Vehicles list */}
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#1e40af', fontWeight: 'bold' }}>
                            🚗 {vis.vehicles && vis.vehicles.length > 0 ? vis.vehicles.map(v => `${v.plate_number} (${v.vehicle_type || 'Car'})`).join(', ') : (vis.vehicle_details || 'No Vehicle')}
                          </div>
                        </div>

                        {/* Direct Action Button at the end */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', minWidth: '95px' }}>
                          <span style={{ fontSize: '0.7rem', color: vis.departure_time_passed ? '#dc2626' : '#475569', fontWeight: 'bold' }}>
                            Dept: {vis.valid_until ? new Date(vis.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>

                          {vis.presence_status === 'currently_inside' ? (
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}>
                              ✓ INSIDE
                            </span>
                          ) : vis.departure_time_passed ? (
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              fontWeight: 'bold'
                            }}>
                              EXPIRED
                            </span>
                          ) : (
                            <IonButton
                              size="small"
                              color="success"
                              disabled={quickProcessingId === vis.id || !vis.is_in_enabled}
                              onClick={(e) => handleQuickCheckIn(e, vis)}
                              style={{
                                '--border-radius': '6px',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                height: '28px',
                                margin: 0
                              }}
                            >
                              {quickProcessingId === vis.id ? (
                                <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />
                              ) : (
                                '▶ CHECK IN'
                              )}
                            </IonButton>
                          )}
                        </div>
                      </div>

                      {/* Rule 5: TWO Categories of Status Badges */}
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Category 1 */}
                        <IonBadge color={vis.lifecycle_status === 'CHECKED-IN' ? 'primary' : vis.lifecycle_status === 'CHECKED-OUT' ? 'medium' : 'warning'} style={{ fontSize: '0.68rem', padding: '3px 6px' }}>
                          {vis.lifecycle_status || 'Yet to Arrive'}
                        </IonBadge>

                        {/* Category 2 */}
                        <IonBadge color={vis.presence_status === 'currently_inside' ? 'success' : vis.presence_status === 'over_stayed' ? 'danger' : 'secondary'} style={{ fontSize: '0.68rem', padding: '3px 6px' }}>
                          {vis.presence_status === 'currently_inside' ? 'Inside Campus' : vis.presence_status === 'over_stayed' ? 'Over Stayed' : 'Currently Outside'}
                        </IonBadge>

                        <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: 'auto', alignSelf: 'center' }}>
                          👥 {vis.person_count || 1} • 🚗 {vis.vehicle_details || 'None'}
                        </span>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            )}
          </div>
        )}

        {/* VISITOR RECORD DETAILS & GUARD RESTRICTED EDIT MODAL */}
        <IonModal isOpen={showDetailModal} onDidDismiss={() => setShowDetailModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#800000', '--color': '#ffffff' }}>
              <IonTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                Visitor Details & Gate Action
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDetailModal(false)} style={{ color: '#ffffff', fontWeight: 'bold' }}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
            {passData && (
              <div>
                {/* Status Badges (Rule 5: TWO Categories) */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#1e40af', fontWeight: 'bold' }}>
                      CATEGORY 1 (LIFECYCLE)
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: passData.lifecycle_status === 'CHECKED-IN' ? '#1d4ed8' : '#b45309' }}>
                      {passData.lifecycle_status || 'Yet to Arrive'}
                    </strong>
                  </div>

                  <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#166534', fontWeight: 'bold' }}>
                      CATEGORY 2 (PRESENCE)
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: passData.presence_status === 'currently_inside' ? '#15803d' : passData.presence_status === 'over_stayed' ? '#dc2626' : '#0284c7' }}>
                      {passData.presence_status === 'currently_inside' ? 'Currently Inside' : passData.presence_status === 'over_stayed' ? 'Over Stayed' : 'Currently Outside'}
                    </strong>
                  </div>
                </div>

                {/* UNAPPROVED VISITOR ALERT BANNER */}
                {isUnapproved && (
                  <div style={{
                    background: '#fef3c7',
                    border: '2px solid #f59e0b',
                    color: '#92400e',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    marginBottom: '1rem',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 'bold' }}>
                      ⛔ ENTRY BLOCKED: Not Yet Approved
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#78350f', lineHeight: 1.4 }}>
                      The visitor approval process is not finished. Current request status is <strong>{passData.status === 'PENDING_L1' ? 'Awaiting Host Approval' : passData.status === 'PENDING_L2' ? 'Awaiting L2 / PRO Approval' : passData.status}</strong>. Gate check-in cannot be processed until approved.
                    </div>
                  </div>
                )}

                {/* Visitor Face Photo */}
                <IonCard style={{ margin: '0 0 1rem 0', borderRadius: '12px', background: '#ffffff', border: '1.5px solid #cbd5e1', overflow: 'hidden' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.6rem 0.85rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                      📷 Visitor Photo & Verification
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>🔍 Tap photo to enlarge</span>
                  </div>
                  <IonCardContent style={{ padding: '0.85rem', textAlign: 'center' }}>
                    <div 
                      onClick={() => setEnlargedImage({
                        url: passData.photo_url || DEFAULT_AVATAR,
                        title: passData.visitor_name,
                        subtitle: `Visitor Face Photo • Pass: ${passData.pass_code}`,
                        badge: passData.visitor_category || 'VISITOR PROFILE'
                      })}
                      style={{
                        display: 'inline-block',
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.6rem 1.2rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.4rem' }}>
                        👤 Face Photo
                      </span>
                      <div style={{ width: '90px', height: '90px', margin: '0 auto', borderRadius: '50%', overflow: 'hidden', border: '2px solid #800000', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        <img
                          src={passData.photo_url || DEFAULT_AVATAR}
                          alt={passData.visitor_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#1e40af', fontWeight: 'bold' }}>
                        🔍 Enlarge Photo
                      </div>
                    </div>
                    <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      🔒 Aadhaar & personal identification details are hidden from guard terminal for privacy.
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Read-Only Visitor Details (Rule 4: Guard CANNOT edit these) */}
                <IonCard style={{ margin: '0 0 1rem 0', borderRadius: '12px', background: '#ffffff', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                  <IonCardContent style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 'bold' }}>
                          {passData.visitor_name}
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          📞 {passData.visitor_phone ? (passData.visitor_phone.length > 4 ? '******' + passData.visitor_phone.slice(-4) : passData.visitor_phone) : ''} • {passData.visitor_category || 'GENERAL'}
                        </div>
                      </div>
                      <IonBadge color="dark" style={{ fontSize: '0.75rem' }}>{passData.pass_code}</IonBadge>
                    </div>

                    <div style={{ marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
                        <IonIcon icon={homeOutline} style={{ color: '#800000' }} />
                        <span>Host: <strong>{passData.host_name || 'Resident Host'}</strong> ({passData.host_flat_info || 'Main Ashram'})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', marginTop: '4px' }}>
                        <IonIcon icon={timeOutline} style={{ color: '#800000' }} />
                        <span>Scheduled Departure: <strong>{new Date(passData.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({new Date(passData.valid_until).toLocaleDateString()})</span>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Rule 4: Guard Can ONLY edit 'number of people' and 'vehicle details' */}
                <IonCard style={{ margin: '0 0 1rem 0', borderRadius: '12px', background: '#ffffff', border: '2px solid #f59e0b' }}>
                  <IonCardHeader style={{ padding: '0.7rem 0.85rem 0.3rem 0.85rem' }}>
                    <IonCardTitle style={{ fontSize: '0.88rem', color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ✏️ Guard Restricted Edit (People & Vehicle Only)
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent style={{ padding: '0.85rem' }}>
                    {/* People Breakdown */}
                    <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                      Number of People Breakdown:
                    </div>
                    <IonGrid className="ion-no-padding">
                      <IonRow>
                        <IonCol size="6" style={{ padding: '0.2rem' }}>
                          <IonItem lines="outline" style={{ '--border-radius': '6px', fontSize: '0.85rem' }}>
                            <IonLabel position="floating">Adult Men 👨</IonLabel>
                            <IonInput type="number" min="0" value={editMen} onIonChange={(e) => setEditMen(e.detail.value)} />
                          </IonItem>
                        </IonCol>
                        <IonCol size="6" style={{ padding: '0.2rem' }}>
                          <IonItem lines="outline" style={{ '--border-radius': '6px', fontSize: '0.85rem' }}>
                            <IonLabel position="floating">Adult Women 👩</IonLabel>
                            <IonInput type="number" min="0" value={editWomen} onIonChange={(e) => setEditWomen(e.detail.value)} />
                          </IonItem>
                        </IonCol>
                        <IonCol size="6" style={{ padding: '0.2rem' }}>
                          <IonItem lines="outline" style={{ '--border-radius': '6px', fontSize: '0.85rem' }}>
                            <IonLabel position="floating">Boys 👦</IonLabel>
                            <IonInput type="number" min="0" value={editBoys} onIonChange={(e) => setEditBoys(e.detail.value)} />
                          </IonItem>
                        </IonCol>
                        <IonCol size="6" style={{ padding: '0.2rem' }}>
                          <IonItem lines="outline" style={{ '--border-radius': '6px', fontSize: '0.85rem' }}>
                            <IonLabel position="floating">Girls 👧</IonLabel>
                            <IonInput type="number" min="0" value={editGirls} onIonChange={(e) => setEditGirls(e.detail.value)} />
                          </IonItem>
                        </IonCol>
                      </IonRow>
                    </IonGrid>

                    {/* Vehicle Details - Multi-Vehicle Editor (Up to 5) */}
                    <div style={{ marginTop: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 'bold' }}>
                          Registered Vehicles ({editVehicles.length} of 5):
                        </div>
                        {editVehicles.length < 5 && (
                          <IonButton
                            size="small"
                            fill="outline"
                            color="primary"
                            onClick={handleAddVehicle}
                            style={{ '--padding-start': '0.5rem', '--padding-end': '0.5rem', height: '26px', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            <IonIcon slot="start" icon={addCircleOutline} />
                            + Add Vehicle
                          </IonButton>
                        )}
                      </div>

                      {editVehicles.length === 0 ? (
                        <div style={{ padding: '0.8rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.8rem' }}>
                          No vehicles added. Tap <strong>+ Add Vehicle</strong> to record visitor vehicles (up to 5).
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {editVehicles.map((v, i) => (
                            <div key={i} style={{ background: '#f8fafc', padding: '0.5rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#1e293b' }}>
                                  🚘 Vehicle #{i + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVehicle(i)}
                                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', padding: '0.1rem 0.3rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 'bold' }}
                                >
                                  <IonIcon icon={trashOutline} /> Remove
                                </button>
                              </div>
                              <IonRow>
                                <IonCol size="7" style={{ padding: '0.15rem' }}>
                                  <IonItem lines="outline" style={{ '--border-radius': '6px', fontSize: '0.8rem' }}>
                                    <IonLabel position="floating">Plate Number</IonLabel>
                                    <IonInput
                                      value={v.plate_number}
                                      placeholder="e.g. KA 01 AB 1234"
                                      onIonChange={(e) => handleVehicleChange(i, 'plate_number', (e.detail.value || '').toUpperCase())}
                                    />
                                  </IonItem>
                                </IonCol>
                                <IonCol size="5" style={{ padding: '0.15rem' }}>
                                  <IonItem lines="outline" style={{ '--border-radius': '6px', fontSize: '0.8rem' }}>
                                    <IonLabel position="floating">Type</IonLabel>
                                    <IonSelect
                                      value={v.vehicle_type || 'Select'}
                                      interface="popover"
                                      onIonChange={(e) => handleVehicleChange(i, 'vehicle_type', e.detail.value)}
                                    >
                                      {VEHICLE_TYPE_OPTIONS.map((vt) => (
                                        <IonSelectOption key={vt} value={vt}>{vt}</IonSelectOption>
                                      ))}
                                    </IonSelect>
                                  </IonItem>
                                </IonCol>
                              </IonRow>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '0.6rem', textAlign: 'right' }}>
                      <IonButton 
                        size="small" 
                        color="warning" 
                        fill="solid"
                        onClick={handleSaveVisitorDetails}
                        disabled={savingDetails}
                        style={{ fontWeight: 'bold', fontSize: '0.78rem' }}
                      >
                        <IonIcon slot="start" icon={saveOutline} />
                        {savingDetails ? 'Saving...' : 'Save Changes'}
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* GATING RULES NOTICES (Rule 7 & 8) */}
                {isDeparturePassed && (
                  <div style={{ background: '#fee2e2', border: '1.5px solid #ef4444', color: '#991b1b', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>
                    ⛔ Estimated departure time has passed. IN entry button is disabled.
                  </div>
                )}
                {!isInside && !passData.is_permanent_pass && (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem', borderRadius: '8px', fontSize: '0.76rem', marginBottom: '0.8rem' }}>
                    ℹ️ Visitor is currently outside. OUT exit button is enabled only when visitor is recorded inside campus.
                  </div>
                )}

                {/* ACTION BUTTONS (Rule 6, 7, 8, 9, 10) */}
                <IonGrid className="ion-no-padding" style={{ marginTop: '0.5rem' }}>
                  <IonRow>
                    {/* IN BUTTON: Enabled ONLY till estimated departure time */}
                    <IonCol size="6" style={{ padding: '0.3rem' }}>
                      <IonButton
                        expand="block"
                        color={isUnapproved ? 'medium' : 'success'}
                        disabled={isInDisabled}
                        onClick={() => handleMovement('IN')}
                        style={{ fontWeight: 'bold', fontSize: '0.85rem', height: '48px' }}
                      >
                        <IonIcon slot="start" icon={logInOutline} />
                        {isUnapproved
                          ? '⛔ NOT APPROVED'
                          : passData.presence_status === 'currently_outside' && passData.lifecycle_status === 'CHECKED-IN'
                          ? 'RE-ENTRY IN'
                          : 'ALLOW IN'}
                      </IonButton>
                    </IonCol>

                    {/* OUT BUTTON: Enabled ONLY if visitor is 'currently_inside' or 'over_stayed' */}
                    <IonCol size="6" style={{ padding: '0.3rem' }}>
                      <IonButton
                        expand="block"
                        color={passData.presence_status === 'over_stayed' ? 'warning' : 'danger'}
                        disabled={isOutDisabled}
                        onClick={() => handleMovement('OUT')}
                        style={{ fontWeight: 'bold', fontSize: '0.85rem', height: '48px' }}
                      >
                        <IonIcon slot="start" icon={logOutOutline} />
                        {passData.presence_status === 'over_stayed'
                          ? 'OVERSTAY EXIT'
                          : 'ALLOW OUT'}
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            )}
          </IonContent>
        </IonModal>

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
                  <IonBadge color="warning" style={{ fontSize: '0.78rem', padding: '4px 12px', letterSpacing: '0.5px' }}>
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
