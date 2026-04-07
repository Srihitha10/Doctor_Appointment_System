import { useState, useEffect, useMemo } from "react";
import "./App.css";
import AuthPane from "./components/AuthPane";
import Sidebar from "./components/Sidebar";
import DoctorCard from "./components/DoctorCard";
import AppointmentList from "./components/AppointmentList";

const API_BASE = "http://localhost:8080/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [mode, setMode] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [message, setMessage] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageType, setAuthMessageType] = useState("error");
  const [doctorId, setDoctorId] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [prescriptionDrafts, setPrescriptionDrafts] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [doctorSettingsSlots, setDoctorSettingsSlots] = useState([]);

  const HOUR_OPTIONS = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const MINUTE_OPTIONS = ["00", "15", "30", "45"];

  const to12hParts = (timeValue) => {
    if (!timeValue) {
      return { hour: "09", minute: "00", period: "AM" };
    }
    const [hRaw, mRaw] = timeValue.slice(0, 5).split(":");
    let hour = Number(hRaw);
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return {
      hour: String(hour).padStart(2, "0"),
      minute: mRaw,
      period,
    };
  };

  const to24hTime = ({ hour, minute, period }) => {
    let h = Number(hour);
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${minute}`;
  };

  const formatTime12 = (timeValue) => {
    if (!timeValue) return "--:--";
    const [hourPart, minutePart] = timeValue.slice(0, 5).split(":");
    let hour = Number(hourPart);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, "0")}:${minutePart} ${ampm}`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsLoggedIn(true);
      setDoctorId(parsed.doctorId || null);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "doctor" && !doctorId) {
      const resolveDoctorId = async () => {
        try {
          const response = await fetch(
            `${API_BASE}/doctors/by-user/${user.userId}`,
          );
          const data = await response.json();
          if (response.ok && data.doctorId) {
            setDoctorId(data.doctorId);
            setUser((prev) => ({ ...prev, doctorId: data.doctorId }));
            localStorage.setItem(
              "user",
              JSON.stringify({ ...user, doctorId: data.doctorId }),
            );
          }
        } catch (error) {
          console.error("Error resolving doctor ID:", error);
        }
      };

      resolveDoctorId();
      return;
    }

    if (user) {
      fetchDoctors();
      fetchAppointments();
    }
  }, [user, doctorId]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_BASE}/doctors`);
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      const endpoint =
        user.role === "patient"
          ? `${API_BASE}/appointments/patient/${user.userId}`
          : `${API_BASE}/appointments/doctor/${doctorId || user.doctorId || user.userId}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      if (mode && doctor.mode !== mode) return false;
      if (specialization && doctor.specialization !== specialization)
        return false;
      return true;
    });
  }, [doctors, mode, specialization]);

  useEffect(() => {
    if (user?.role !== "doctor") return;

    const profile = doctors.find((d) => d.id === (doctorId || user.doctorId));
    if (!profile) return;

    const sourceSlots =
      profile.availabilitySlots?.length > 0
        ? profile.availabilitySlots
        : [{ startTime: profile.startTime, endTime: profile.endTime }];

    const uiSlots = sourceSlots.map((slot) => ({
      start: to12hParts(slot.startTime),
      end: to12hParts(slot.endTime),
    }));

    setDoctorSettingsSlots(
      uiSlots.length
        ? uiSlots
        : [{ start: to12hParts("09:00"), end: to12hParts("17:00") }],
    );
  }, [doctors, doctorId, user]);

  const addDoctorSettingsSlot = () => {
    setDoctorSettingsSlots((prev) => [
      ...prev,
      {
        start: { hour: "09", minute: "00", period: "AM" },
        end: { hour: "05", minute: "00", period: "PM" },
      },
    ]);
  };

  const removeDoctorSettingsSlot = (index) => {
    setDoctorSettingsSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDoctorSettingsSlot = (index, side, field, value) => {
    setDoctorSettingsSlots((prev) =>
      prev.map((slot, i) =>
        i === index
          ? {
              ...slot,
              [side]: {
                ...slot[side],
                [field]: value,
              },
            }
          : slot,
      ),
    );
  };

  const saveDoctorSlotSettings = async () => {
    const resolvedDoctorId = doctorId || user?.doctorId;
    if (!resolvedDoctorId) {
      setMessage("Doctor profile not found");
      return;
    }

    const slots = doctorSettingsSlots.map((slot) => ({
      startTime: to24hTime(slot.start),
      endTime: to24hTime(slot.end),
    }));

    try {
      const response = await fetch(
        `${API_BASE}/doctors/${resolvedDoctorId}/slots`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Slot timings updated successfully.");
        fetchDoctors();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.error || "Could not update slot timings");
      }
    } catch (error) {
      setMessage("Server connection failed");
    }
  };

  const loadDoctorSlots = async (doctor) => {
    if (!bookingDate) {
      setMessage("⚠️ Please select a preferred date first.");
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setSlotError("");
    setSlotLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/doctors/${doctor.id}/availability?date=${bookingDate}`,
      );
      const data = await response.json();
      if (response.ok) {
        setDoctorSlots(data);
      } else {
        setDoctorSlots([]);
        setSlotError(data?.error || "Unable to load slots");
      }
    } catch (error) {
      setDoctorSlots([]);
      setSlotError("Server connection failed");
    } finally {
      setSlotLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setIsLoggedIn(true);
        setDoctorId(data.doctorId || null);
        localStorage.setItem("user", JSON.stringify(data));
        setAuthMessage("");
        setAuthMessageType("success");
      } else {
        setAuthMessage(data.error || "Login failed");
        setAuthMessageType("error");
      }
    } catch (error) {
      setAuthMessage("Server connection failed");
      setAuthMessageType("error");
    }
  };

  const handleSignup = async (payload) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthMessage("Account created! Sign in now.");
        setAuthMessageType("success");
        return { success: true };
      } else {
        setAuthMessage(data.error || "Signup failed");
        setAuthMessageType("error");
        return { success: false };
      }
    } catch (error) {
      setAuthMessage("Server connection failed");
      setAuthMessageType("error");
      return { success: false };
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActiveSection("dashboard");
    localStorage.removeItem("user");
  };

  const bookAppointment = async (doctorId, date, time) => {
    if (!date || !time) {
      setMessage("⚠️ Please select a valid date and time.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          patientId: user.userId.toString(),
          doctorId: doctorId.toString(),
          date,
          time,
        }),
      });
      const resMessage = await response.text();
      setMessage(resMessage);
      fetchAppointments();
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setDoctorSlots([]);
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setMessage("❌ Booking failed");
    }
  };

  const confirmSelectedSlot = async () => {
    if (!selectedDoctor || !selectedSlot) {
      setSlotError("Please choose an available slot.");
      return;
    }

    await bookAppointment(
      selectedDoctor.id,
      bookingDate,
      selectedSlot.startTime,
    );
  };

  const updatePrescriptionDraft = (appointmentId, value) => {
    setPrescriptionDrafts((prev) => ({ ...prev, [appointmentId]: value }));
  };

  const savePrescription = async (appointmentId) => {
    try {
      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}/prescription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: (doctorId || user.doctorId || user.userId).toString(),
            prescription: prescriptionDrafts[appointmentId] || "",
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Prescription saved successfully.");
        setPrescriptionDrafts((prev) => ({
          ...prev,
          [appointmentId]: data.prescription || "",
        }));
        fetchAppointments();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.error || "Could not save prescription");
      }
    } catch (error) {
      setMessage("Server connection failed");
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: (doctorId || user.doctorId || user.userId).toString(),
            reason: "Emergency cancellation by doctor",
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Appointment cancelled.");
        fetchAppointments();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.error || "Could not cancel appointment");
      }
    } catch (error) {
      setMessage("Server connection failed");
    }
  };

  const cancelAppointmentByPatient = async (appointmentId) => {
    try {
      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}/cancel-by-patient`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: user.userId.toString(),
            reason: "Emergency cancellation by patient",
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Appointment cancelled.");
        fetchAppointments();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.error || "Could not cancel appointment");
      }
    } catch (error) {
      setMessage("Server connection failed");
    }
  };

  const uploadPrescriptionFile = async (appointmentId, file) => {
    if (!file) return;

    setSelectedFiles((prev) => ({ ...prev, [appointmentId]: file.name }));
    try {
      const formData = new FormData();
      formData.append(
        "doctorId",
        (doctorId || user.doctorId || user.userId).toString(),
      );
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}/prescription-file`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      if (response.ok) {
        setMessage("Prescription file uploaded.");
        fetchAppointments();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.error || "Could not upload prescription file");
      }
    } catch (error) {
      setMessage("Server connection failed");
    }
  };

  const downloadPrescriptionFile = async (appointmentId, fileName) => {
    try {
      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}/prescription-file`,
      );
      if (!response.ok) {
        setMessage("Prescription file not available");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName || `prescription-${appointmentId}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage("Failed to download prescription file");
    }
  };

  if (!isLoggedIn) {
    return (
      <AuthPane
        onLogin={handleLogin}
        onSignup={handleSignup}
        authMessage={authMessage}
        authMessageType={authMessageType}
      />
    );
  }

  const confirmedAppointments = appointments.filter(
    (app) => app.status?.toLowerCase() === "confirmed",
  );
  const cancelledAppointments = appointments.filter(
    (app) => app.status?.toLowerCase() === "cancelled",
  );
  const currentDoctorProfile =
    user?.role === "doctor"
      ? doctors.find((d) => d.id === (doctorId || user.doctorId))
      : null;

  return (
    <div
      className="container"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(250px, 300px) 1fr",
        gap: "2rem",
      }}
    >
      <Sidebar
        user={user}
        onLogout={handleLogout}
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      <main className="animate-in">
        <header style={{ marginBottom: "3rem" }}>
          <h1>Dashboard</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Welcome back, {user.username}. Here's what's happening today.
          </p>
        </header>

        {message && (
          <div
            className="glass"
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--secondary)",
              border: "1px solid var(--secondary)",
            }}
          >
            {message}
          </div>
        )}

        {activeSection === "dashboard" && (
          <section style={{ marginBottom: "4rem" }}>
            <h2 style={{ marginBottom: "1.25rem" }}>Overview</h2>
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              <div className="glass" style={{ padding: "1rem" }}>
                <div
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  Total
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                  {appointments.length}
                </div>
              </div>
              <div className="glass" style={{ padding: "1rem" }}>
                <div
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  Confirmed
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                  {confirmedAppointments.length}
                </div>
              </div>
              <div className="glass" style={{ padding: "1rem" }}>
                <div
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  Cancelled
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                  {cancelledAppointments.length}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "appointments" && (
          <section style={{ marginBottom: "4rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ margin: 0 }}>My Appointments</h2>
              <button className="btn btn-outline" onClick={fetchAppointments}>
                Refresh
              </button>
            </div>
            <AppointmentList
              appointments={appointments}
              role={user.role}
              onCancelAppointment={cancelAppointment}
              onCancelByPatient={cancelAppointmentByPatient}
              onPrescriptionChange={updatePrescriptionDraft}
              onSavePrescription={savePrescription}
              onUploadPrescriptionFile={uploadPrescriptionFile}
              onDownloadPrescriptionFile={downloadPrescriptionFile}
              prescriptionDrafts={prescriptionDrafts}
              selectedFiles={selectedFiles}
            />
          </section>
        )}

        {user.role === "doctor" && activeSection === "dashboard" && (
          <section style={{ marginBottom: "4rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>Doctor Tools</h2>
            <div
              className="glass"
              style={{ padding: "1.25rem", color: "var(--text-muted)" }}
            >
              Use the appointment table above to upload prescriptions or cancel
              emergency appointments.
            </div>
          </section>
        )}

        {user.role === "patient" && activeSection === "appointments" && (
          <section className="animate-in">
            <h2 style={{ marginBottom: "2rem" }}>Available Specialists</h2>

            <div
              className="glass"
              style={{ marginBottom: "2.5rem", padding: "1.5rem" }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  alignItems: "end",
                  gap: "1rem",
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="">All Modes</option>
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Specialization</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="">All Specs</option>
                    <option value="OPHTHALMOLOGY">Ophthalmology</option>
                    <option value="PAEDIATRICS">Paediatrics</option>
                    <option value="GYNAECOLOGY">Gynaecology</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Preferred Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Booking Time</label>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                      paddingTop: "0.6rem",
                    }}
                  >
                    Pick a doctor slot after selecting a date.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBook={loadDoctorSlots}
                  role={user.role}
                  bookingDate={bookingDate}
                  formatTime12={formatTime12}
                />
              ))}
            </div>
          </section>
        )}

        {activeSection === "settings" && (
          <section style={{ marginBottom: "4rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>Settings</h2>
            <div className="glass" style={{ padding: "1.25rem" }}>
              <p style={{ marginTop: 0, color: "var(--text-muted)" }}>
                Profile Overview
              </p>
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
              {user.role === "doctor" && currentDoctorProfile && (
                <>
                  <p>
                    <strong>Specialization:</strong>{" "}
                    {currentDoctorProfile.specialization}
                  </p>
                  <p>
                    <strong>Mode:</strong> {currentDoctorProfile.mode}
                  </p>
                  <p>
                    <strong>Hospital:</strong>{" "}
                    {currentDoctorProfile.hospitalName}
                  </p>

                  <div
                    className="glass"
                    style={{ padding: "1.25rem", marginTop: "1rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>Slot Timings</h3>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={addDoctorSettingsSlot}
                      >
                        +
                      </button>
                    </div>
                    <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
                      Add any number of non-overlapping slots (AM/PM).
                    </p>

                    {doctorSettingsSlots.map((slot, index) => (
                      <div
                        key={`settings-slot-${index}`}
                        className="glass"
                        style={{ padding: "0.9rem", marginBottom: "0.8rem" }}
                      >
                        <div
                          style={{
                            marginBottom: "0.6rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Slot {index + 1}
                        </div>
                        <div
                          className="grid"
                          style={{
                            gridTemplateColumns: "1fr 1fr auto",
                            gap: "0.75rem",
                          }}
                        >
                          <div>
                            <label>Start</label>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "0.4rem",
                              }}
                            >
                              <select
                                value={slot.start.hour}
                                onChange={(e) =>
                                  updateDoctorSettingsSlot(
                                    index,
                                    "start",
                                    "hour",
                                    e.target.value,
                                  )
                                }
                              >
                                {HOUR_OPTIONS.map((v) => (
                                  <option key={`s-h-${v}`} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={slot.start.minute}
                                onChange={(e) =>
                                  updateDoctorSettingsSlot(
                                    index,
                                    "start",
                                    "minute",
                                    e.target.value,
                                  )
                                }
                              >
                                {MINUTE_OPTIONS.map((v) => (
                                  <option key={`s-m-${v}`} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={slot.start.period}
                                onChange={(e) =>
                                  updateDoctorSettingsSlot(
                                    index,
                                    "start",
                                    "period",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label>End</label>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "0.4rem",
                              }}
                            >
                              <select
                                value={slot.end.hour}
                                onChange={(e) =>
                                  updateDoctorSettingsSlot(
                                    index,
                                    "end",
                                    "hour",
                                    e.target.value,
                                  )
                                }
                              >
                                {HOUR_OPTIONS.map((v) => (
                                  <option key={`e-h-${v}`} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={slot.end.minute}
                                onChange={(e) =>
                                  updateDoctorSettingsSlot(
                                    index,
                                    "end",
                                    "minute",
                                    e.target.value,
                                  )
                                }
                              >
                                {MINUTE_OPTIONS.map((v) => (
                                  <option key={`e-m-${v}`} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={slot.end.period}
                                onChange={(e) =>
                                  updateDoctorSettingsSlot(
                                    index,
                                    "end",
                                    "period",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "end" }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => removeDoctorSettingsSlot(index)}
                              disabled={doctorSettingsSlots.length === 1}
                            >
                              -
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={saveDoctorSlotSettings}
                    >
                      Save Slot Timings
                    </button>
                  </div>
                </>
              )}
              {user.role === "patient" && (
                <p style={{ color: "var(--text-muted)" }}>
                  Manage your appointments from the Appointments tab.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {selectedDoctor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 10, 25, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
          onClick={() => {
            setSelectedDoctor(null);
            setDoctorSlots([]);
            setSelectedSlot(null);
            setSlotError("");
          }}
        >
          <div
            className="glass card"
            style={{
              width: "min(720px, 100%)",
              maxHeight: "85vh",
              overflow: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Choose Slot</h2>
                <p
                  style={{ margin: "0.35rem 0 0", color: "var(--text-muted)" }}
                >
                  Dr. {selectedDoctor.name} on {bookingDate}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSelectedDoctor(null);
                  setDoctorSlots([]);
                  setSelectedSlot(null);
                  setSlotError("");
                }}
              >
                Close
              </button>
            </div>

            {slotLoading && (
              <p style={{ color: "var(--text-muted)" }}>Loading slots...</p>
            )}
            {slotError && (
              <div style={{ marginBottom: "1rem", color: "#ef4444" }}>
                {slotError}
              </div>
            )}

            {!slotLoading && !slotError && (
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {doctorSlots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      disabled={slot.booked}
                      onClick={() => setSelectedSlot(slot)}
                      className="btn"
                      style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "0.9rem",
                        border: isSelected
                          ? "1px solid var(--primary)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: slot.booked
                          ? "rgba(239, 68, 68, 0.12)"
                          : isSelected
                            ? "rgba(99, 102, 241, 0.2)"
                            : "rgba(255,255,255,0.04)",
                        color: slot.booked ? "#ef4444" : "inherit",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
                        {formatTime12(slot.startTime)} -{" "}
                        {formatTime12(slot.endTime)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: slot.booked ? "#ef4444" : "var(--text-muted)",
                        }}
                      >
                        {slot.booked ? "Unavailable" : "Available"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1.25rem",
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedDoctor(null);
                  setDoctorSlots([]);
                  setSelectedSlot(null);
                  setSlotError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmSelectedSlot}
                disabled={!selectedSlot || selectedSlot.booked}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
