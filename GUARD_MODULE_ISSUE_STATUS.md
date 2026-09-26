# Security Guard Module – Implementation Verification & Issue Status

**Document Version:** 1.2  
**FRD Reference:** Functional Requirements Document – Security Guard Module (v1.0, 16 Sept 2026)  
**Date of Audit:** 26 September 2026  
**Module:** Gate Security / Visitor Management System (Security Guard Mobile Application)  
**Clarification Note:** **Spot Registration is Walk-In Registration** (they represent the same functional capability: on-the-spot registration of unscheduled visitors at the gate).

---

## 1. Executive Summary

A comprehensive verification of the **Security Guard Application** (`guard/src/`) and supporting backend endpoints (`backend/SMSAVMS/src/controllers/gateController.js`) was performed against the **Functional Requirements Document (FRD v1.0)**, incorporating the domain clarification that **Spot Registration = Walk-In Registration**.

### Overall Compliance Matrix
| Category | Total Items | Implemented | Partially Implemented | Pending / Missing | Out of Scope (Later Phase) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Functional Requirements (FR-SG-01 to 10)** | 10 | 5 | 0 | 2 | 3 |
| **Screen Requirements (Section 5.1 to 5.6)** | 6 | 6 | 0 | 0 | 0 |
| **Total** | **16** | **11** | **0** | **2** | **3** |

---

## 2. Requirement-by-Requirement Verification

### Core Functional Requirements (FR-SG)

| Ref | Requirement Description | Current Implementation Status | Severity | Details & Observations |
|---|---|:---:|---|---|
| **FR-SG-01** | **Visitor Entry Management**<br>Scan QR, cross-check pre-registered info, verify identity (photo, masked phone), allow entry only after verification. | **IMPLEMENTED** | Low | Supported via camera QR scanning (`Html5Qrcode`) and passcode search in `ScanEntry.jsx`. Shows photo, masked phone, host details, and restricts unapproved passes (`PENDING_L1`, `PENDING_L2`). |
| **FR-SG-02** | **Updating Visitor Information**<br>Guard can update **ONLY** headcount (men/women/boys/girls) and vehicle details. No other field editable. | **IMPLEMENTED** | Low | Strict compliance in `ScanEntry.jsx`. All visitor profile fields are read-only; only headcount breakdown and up to 5 vehicles are editable by the guard. |
| **FR-SG-03** | **Spot Registration (Walk-In Registration)**<br>Process spot/walk-in registrations for visitors, vendors, contractors by capturing details, initiating approval workflow with Host/L2, and admitting visitor upon approval. | **IMPLEMENTED & OPERATIONAL**<br>*(Phase 1 Integration)* | Low | **Implemented as Walk-In / Spot Registration in `WalkInMenu.jsx`**. Guard can capture name, phone, category, host, purpose, vehicle, submitting with `is_spot_registration: true` and `registration_type: 'SPOT_REGISTRATION'`. Requests are categorized into Sent for Approval, Approved, and Rejected. |
| **FR-SG-04** | **Exit Management**<br>Verify visitor at exit, record exit time, ensure departing visitor properly checked out. | **IMPLEMENTED** | Low | `ALLOW OUT` in `ScanEntry.jsx` and `Check Out` in `VisitorsInside.jsx` record exit movement and update lifecycle/presence status. |
| **FR-SG-05** | **Exit Discrepancy Handling**<br>On exit discrepancy (e.g. headcount mismatch), immediately notify and phone Host for confirmation, record remarks, complete exit only after verification. | **IMPLEMENTED** | Low | **RESOLVED**: In `ScanEntry.jsx`, departing headcount is verified against checked-in count. On mismatch, a dedicated modal prompts the guard, offers direct one-tap Host calling (`tel:${host_phone}`), and mandates discrepancy remarks before completing the exit. |
| **FR-SG-06** | **Escalation Process**<br>Record unresolved exit discrepancies; auto-escalate unresolved cases to next level security management at day-end with remarks. | **PENDING** | **HIGH** | Remarks are captured in `gate_logs.remarks`. Automated day-end escalation job for security head/admin review remains pending. |
| **FR-SG-07** | **Vehicle Management**<br>Record entry/exit of guest, vendor, supply, delivery, contractor vehicles, cab services. | **OUT OF SCOPE** | Info | Explicitly marked in FRD v1.0: *"Out of scope for initial release; planned for subsequent phases."* |
| **FR-SG-08** | **Management of Regular Visitors**<br>Verify delivery personnel, maids, contract workers, regular cab drivers, foreign nationals. | **OUT OF SCOPE** | Info | Explicitly marked in FRD v1.0: *"Out of scope for initial release; planned for subsequent phases."* |
| **FR-SG-09** | **Ashram Resident Entry & Exit Management**<br>Resident entry/exit tracking, auto-alert on non-return without pre-information, foreign resident tracking. | **OUT OF SCOPE** | Info | Explicitly marked in FRD v1.0: *"Out of scope for initial release; planned for subsequent phases."* |
| **FR-SG-10** | **Late Entry Form (10:00 PM – 5:00 AM)**<br>Process entries and exits outside standard hours via Late Entry procedure (Appendix A). | **PENDING** | **HIGH** | **Not implemented**. Operating hours gate enforces 5:00 AM – 10:00 PM. Emergency late entry override form workflow for 10:00 PM - 5:00 AM remains pending. |

---

### Screen Functional Requirements (Section 5)

| Section | Requirement Description | Status | Severity | Details & Observations |
|---|---|:---:|---|---|
| **5.1** | **QR Code Scanner**<br>Camera captures valid QR code and automatically pops up visitor details on screen. | **IMPLEMENTED** | Low | Camera scanner automatically decodes QR, verifies via API, and immediately opens the visitor detail modal when a match is found. |
| **5.2** | **Scanned Visitor Details**<br>Must display: Photo, Name, Encrypted phone (last 4 digits), Gender, Scheduled Arrival & Departure Date/Time, Editable Vehicle details, Editable Headcount (single/group minor/adult), "ALLOW IN" & "ALLOW OUT" buttons, Visit State (Yet to Arrive / Checked-In / Checked-Out), Inside Status (Currently Inside / Currently Outside / Overstayed). | **IMPLEMENTED** | Low | **RESOLVED**: Displays Photo, Name, Masked Phone (`******3210`), Gender (👤), Scheduled Arrival Date/Time (ETA), Scheduled Departure (ETD), Headcount breakdown, Vehicle details, Direct Call Host button, "ALLOW IN" / "ALLOW OUT", Visit State, and Inside Status. |
| **5.3** | **Invited Visitors List**<br>Upcoming visitors of the day + checked-in visitors. Summary card shows: Name, Vehicle No, Scheduled departure, Count of people, Masked phone (last 4), Host name & Visiting to, Visit State, Inside Status, "ALLOW IN" button, Search by name/phone/vehicle. | **IMPLEMENTED** | Low | **RESOLVED**: Summary cards list all required attributes with search filtering in `ScanEntry.jsx`. Action button explicitly labeled `ALLOW IN`. |
| **5.4** | **Walk-in / Spot Visitors Form**<br>Process unscheduled arrivals at the gate, record details, initiate host approval workflow. | **IMPLEMENTED** | Low | Fully built in `WalkInMenu.jsx` with dedicated registration modal, host routing, and filter views (`ALL`, `PENDING`, `APPROVED`, `REJECTED`). |
| **5.5** | **Gate and Security Guard Information**<br>Gate name/code displayed on gate screen; Logged-in guard's name displayed at top of screen. | **IMPLEMENTED** | Low | **RESOLVED**: Gate name/code and duty guard roster displayed on `GuardHome.jsx`, and active Gate Name & Duty Guard Name prominently displayed in the top header toolbar of `ScanEntry.jsx`. |
| **5.6** | **Delivery and Vehicles**<br>Integrated from existing methods/systems. | **IMPLEMENTED** | Low | `DeliveryMenu.jsx`, `DeliveryPersons.jsx`, and `DeliveryVisits.jsx` handle delivery entry/exit and vehicle details. |
| **Section 5 Navigation** | **Dedicated Screens / Views:**<br>- QR Code Scanner<br>- Invited Visitors List<br>- Checked-In Visitors List<br>- Inside Visitors List<br>- Walk-in / Spot Visitors<br>- Overstayed Visitors<br>- Gate and Guard Information<br>- Delivery and Vehicles | **PARTIALLY IMPLEMENTED** | **MEDIUM** | Currently, "Checked-In" and "Overstayed" visitors do not have dedicated filter tabs or quick-access segmented views; they are mixed within Invited List or Visitors Inside. |

---

## 3. Prioritized Action Items (What is Pending)

### Priority 1: High Severity (Core Security & Exit Gaps)

1. **[FR-SG-05] Exit Discrepancy Handling:**
   - Add an **Exit Verification Modal** when clicking `ALLOW OUT` or `Check Out`.
   - Compare entry headcount breakdown with exit headcount.
   - If mismatch detected:
     - Prompt guard to call Host (display Host phone with direct call trigger).
     - Require mandatory Discrepancy Remarks (e.g., "Visitor left 1 person behind with host").
     - Allow supervisor override / host confirmed exit.

2. **[FR-SG-06] Escalation Process for Unresolved Discrepancies:**
   - Create a database flag / status for `EXIT_DISCREPANCY_UNRESOLVED`.
   - Provide an escalation queue for Security Supervisors in `SupervisorConsole.jsx`.
   - Add day-end cron/task in backend to escalate unresolved cases to L2 Security Management.

3. **[FR-SG-10] Late Entry Form (10:00 PM – 5:00 AM):**
   - Implement time window detection (current time between 22:00 and 05:00).
   - Display Late Entry badge/notice and open the Late Entry Form procedure (capturing Reason for late entry, Resident host acknowledgment, Guard remarks, and Entry approval).

### Priority 2: Medium Severity (Screen & UX Gaps)

4. **[Section 5.2] Scanned Details Modal Display Enhancements:**
   - Display **Gender** (`passData.gender || 'Not Specified'`).
   - Display **Scheduled Arrival Date & Time** (`passData.valid_from`) alongside Scheduled Departure.

5. **[Section 5.5] Gate & Guard Information in Header:**
   - Update `ScanEntry.jsx` header to prominently display:
     - Assigned Gate Name (e.g., **North Gate**)
     - Logged-in Guard Name (e.g., **Guard: Ramesh**)

6. **[Section 5 Navigation] Dedicated Filter Views:**
   - In `ScanEntry.jsx` or `VisitorsInside.jsx`, provide explicit segmented filters:
     - **All Invited**
     - **Checked-In Visitors**
     - **Inside Campus**
     - **Overstayed Visitors**

7. **[Walk-In / Spot Registration Enhancements] (FR-SG-03 / 5.4):**
   - Connect live camera for taking the visitor's profile photo in `WalkInMenu.jsx` instead of static placeholder.
   - Trigger host push notification/SMS upon walk-in submission.

8. **[Section 5.3] Action Button Label Alignment:**
   - Change button text from `▶ CHECK IN` to `ALLOW IN` on the Invited Visitors card to match FRD 5.3 verbatim.
