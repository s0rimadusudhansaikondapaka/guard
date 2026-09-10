import React, { createContext, useState, useEffect, useContext } from 'react';
import { deviceAuth, getOnDutyGuards, checkInGuard, checkOutGuard, logoutDevice, loginUser, logoutUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [device, setDevice] = useState(null);
  const [onDutyGuards, setOnDutyGuards] = useState([]);
  const [user, setUser] = useState(null); // backward compatibility
  const [loading, setLoading] = useState(true);

  // Selected Gate is assigned by Super Admin to the Device
  const selectedGate = device?.gate_name || 'NORTH_GATE';

  const deduplicateGuards = (guards = []) => {
    if (!Array.isArray(guards)) return [];
    const seen = new Set();
    return guards.filter((g) => {
      const key = String(g.guard_id || g.id || g.guard_phone || g.guard_name || '').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const updateOnDutyGuards = (guards = []) => {
    const clean = deduplicateGuards(guards);
    setOnDutyGuards(clean);
    localStorage.setItem('MYASRAM_ON_DUTY_GUARDS', JSON.stringify(clean));
  };

  useEffect(() => {
    initDeviceSession();
  }, []);

  const initDeviceSession = async () => {
    const savedDevice = localStorage.getItem('MYASRAM_DEVICE');
    const savedGuards = localStorage.getItem('MYASRAM_ON_DUTY_GUARDS');
    const savedToken = localStorage.getItem('MYASRAM_TOKEN');

    if (savedDevice) {
      try {
        const parsedDevice = JSON.parse(savedDevice);
        setDevice(parsedDevice);
        if (savedGuards) {
          try {
            updateOnDutyGuards(JSON.parse(savedGuards));
          } catch (e) {}
        }
        // Fetch fresh on-duty guards from backend
        try {
          const res = await getOnDutyGuards(parsedDevice.device_id);
          if (res?.on_duty_guards) {
            updateOnDutyGuards(res.on_duty_guards);
          }
        } catch (e) {
          // Offline / network fallback
        }
      } catch (err) {
        console.warn('Error restoring device session:', err);
      }
    } else {
      // Default initial enrolled device fallback for seamless preview
      const defaultDevice = {
        id: 1,
        device_id: 'DEV-NORTH-01',
        device_name: 'North Gate Main Terminal Phone',
        gate_name: 'NORTH_GATE',
        status: 'ACTIVE'
      };
      setDevice(defaultDevice);
      localStorage.setItem('MYASRAM_DEVICE', JSON.stringify(defaultDevice));

      const defaultGuards = [
        {
          id: 1,
          guard_id: 4,
          guard_name: 'Ramesh Guard (North Gate)',
          guard_phone: '+91 9876543213',
          guard_code: 'GRD-4',
          checked_in_at: new Date().toISOString(),
          status: 'ON_DUTY',
          gate_name: 'NORTH_GATE'
        }
      ];
      updateOnDutyGuards(defaultGuards);

      // Attempt live device authentication if online, or set seamless preview token
      try {
        const res = await deviceAuth('DEV-NORTH-01', '123456');
        if (res?.token) {
          localStorage.setItem('MYASRAM_TOKEN', res.token);
          if (res.on_duty_guards) updateOnDutyGuards(res.on_duty_guards);
        }
      } catch (e) {
        if (!localStorage.getItem('MYASRAM_TOKEN')) {
          localStorage.setItem('MYASRAM_TOKEN', 'offline_terminal_session_token');
        }
      }
    }
    setLoading(false);
  };

  const loginWithDevice = async (deviceId, secretCode) => {
    const res = await deviceAuth(deviceId, secretCode);
    if (res.success && res.device) {
      setDevice(res.device);
      if (res.on_duty_guards) {
        updateOnDutyGuards(res.on_duty_guards);
      }
    }
    return res;
  };

  const refreshGuards = async () => {
    if (!device?.device_id) return;
    try {
      const res = await getOnDutyGuards(device.device_id);
      if (res?.on_duty_guards) {
        updateOnDutyGuards(res.on_duty_guards);
      }
    } catch (e) {
      // Graceful fallback to cached state
    }
  };

  const addGuardToDuty = async (guardId) => {
    if (!device?.device_id) return { success: false, message: 'Device not enrolled' };
    const res = await checkInGuard(device.device_id, guardId);
    if (res.success && res.on_duty_guards) {
      updateOnDutyGuards(res.on_duty_guards);
    }
    return res;
  };

  const removeGuardFromDuty = async (sessionId, guardId) => {
    if (!device?.device_id) return { success: false, message: 'Device not enrolled' };
    const res = await checkOutGuard(device.device_id, sessionId, guardId);
    if (res.success && res.on_duty_guards) {
      updateOnDutyGuards(res.on_duty_guards);
    }
    return res;
  };

  const logout = () => {
    logoutDevice();
    logoutUser();
    setDevice(null);
    updateOnDutyGuards([]);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        device,
        setDevice,
        onDutyGuards,
        setOnDutyGuards,
        user: onDutyGuards[0] ? { name: onDutyGuards[0].guard_name, role: 'GUARD', phone: onDutyGuards[0].guard_phone } : { name: device?.device_name || 'Ashram Guard Terminal', role: 'GUARD' },
        setUser,
        loading,
        loginWithDevice,
        login: loginWithDevice, // backward compatibility
        logout,
        selectedGate,
        refreshGuards,
        addGuardToDuty,
        removeGuardFromDuty,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
