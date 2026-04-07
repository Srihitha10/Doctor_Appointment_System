import { useState } from "react";

const AuthPane = ({ onLogin, onSignup, authMessage, authMessageType }) => {
  const validateStrongPassword = (value) => {
    const missing = [];
    if (value.length < 8) missing.push("at least 8 characters");
    if (!/[a-z]/.test(value)) missing.push("one lowercase letter");
    if (!/[A-Z]/.test(value)) missing.push("one uppercase letter");
    if (!/\d/.test(value)) missing.push("one number");
    if (!/[^A-Za-z0-9]/.test(value)) missing.push("one special character");
    return missing;
  };
  const [isLogin, setIsLogin] = useState(true);

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [signupRole, setSignupRole] = useState("patient");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAge, setSignupAge] = useState("");
  const [signupSpecialization, setSignupSpecialization] =
    useState("OPHTHALMOLOGY");
  const [signupMode, setSignupMode] = useState("ONLINE");
  const [signupSlots, setSignupSlots] = useState([
    { startTime: "09:00", endTime: "17:00" },
  ]);
  const [signupHospitalName, setSignupHospitalName] = useState("");
  const [signupHospitalAddress, setSignupHospitalAddress] = useState("");
  const [signupValidationMessage, setSignupValidationMessage] = useState("");

  const addDoctorSlot = () => {
    setSignupSlots((prev) => [
      ...prev,
      { startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const removeDoctorSlot = (index) => {
    setSignupSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDoctorSlot = (index, key, value) => {
    setSignupSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot)),
    );
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin({ username: loginUsername.trim(), password: loginPassword });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const missingPasswordRules = validateStrongPassword(signupPassword);
    if (missingPasswordRules.length > 0) {
      setSignupValidationMessage(
        `Password is missing: ${missingPasswordRules.join(", ")}.`,
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupValidationMessage("Password and retype password must match.");
      return;
    }

    if (signupRole === "doctor") {
      if (!signupSlots.length) {
        setSignupValidationMessage(
          "Add at least one slot for doctor availability.",
        );
        return;
      }
      const hasInvalidSlot = signupSlots.some(
        (slot) =>
          !slot.startTime || !slot.endTime || slot.startTime >= slot.endTime,
      );
      if (hasInvalidSlot) {
        setSignupValidationMessage(
          "Each slot must have start time before end time.",
        );
        return;
      }
    }

    setSignupValidationMessage("");

    const payload = {
      role: signupRole,
      username: signupUsername.trim(),
      password: signupPassword,
      name: signupName,
      phone: signupPhone,
      age: signupAge,
      specialization: signupRole === "doctor" ? signupSpecialization : null,
      mode: signupRole === "doctor" ? signupMode : null,
      startTime: signupRole === "doctor" ? signupSlots[0]?.startTime : null,
      endTime: signupRole === "doctor" ? signupSlots[0]?.endTime : null,
      availabilitySlots: signupRole === "doctor" ? signupSlots : null,
      hospitalName: signupRole === "doctor" ? signupHospitalName : null,
      hospitalAddress: signupRole === "doctor" ? signupHospitalAddress : null,
    };

    const result = await onSignup(payload);
    if (result?.success) {
      setIsLogin(true);
      setLoginUsername(signupUsername);
      setLoginPassword("");
      setSignupPassword("");
      setSignupConfirmPassword("");
    }
  };

  return (
    <div
      className="container animate-in"
      style={{ maxWidth: "500px", marginTop: "4rem" }}
    >
      <div className="glass card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem" }}>HMS Pro</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Hospital Management System
          </p>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            marginBottom: "2rem",
            gap: "0",
          }}
        >
          <button
            className={`btn ${isLogin ? "btn-primary" : "btn-outline"}`}
            style={{ borderRadius: "0.75rem 0 0 0.75rem" }}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`btn ${!isLogin ? "btn-primary" : "btn-outline"}`}
            style={{ borderRadius: "0 0.75rem 0.75rem 0" }}
            onClick={() => setIsLogin(false)}
          >
            Signup
          </button>
        </div>

        {(authMessage || signupValidationMessage) && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: signupValidationMessage
                ? "rgba(239, 68, 68, 0.1)"
                : authMessageType === "success"
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(239, 68, 68, 0.1)",
              color: signupValidationMessage
                ? "#ef4444"
                : authMessageType === "success"
                  ? "#10b981"
                  : "#ef4444",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              textAlign: "center",
            }}
          >
            {signupValidationMessage || authMessage}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "0.5rem",
                }}
              >
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  {showLoginPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} noValidate>
            <div className="form-group">
              <label>Join as</label>
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value)}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
            >
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                  >
                    {showSignupPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Retype Password</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "0.5rem",
                }}
              >
                <input
                  type={showSignupConfirmPassword ? "text" : "password"}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                >
                  {showSignupConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}
            >
              Use at least 8 characters with uppercase, lowercase, number, and
              special character.
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>

            {signupRole === "patient" ? (
              <div
                className="grid"
                style={{ gridTemplateColumns: "2fr 1fr", gap: "1rem" }}
              >
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={signupAge}
                    onChange={(e) => setSignupAge(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
                >
                  <div className="form-group">
                    <label>Specialization</label>
                    <select
                      value={signupSpecialization}
                      onChange={(e) => setSignupSpecialization(e.target.value)}
                      required
                    >
                      <option value="OPHTHALMOLOGY">Ophthalmology</option>
                      <option value="PAEDIATRICS">Paediatrics</option>
                      <option value="GYNAECOLOGY">Gynaecology</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mode</label>
                    <select
                      value={signupMode}
                      onChange={(e) => setSignupMode(e.target.value)}
                      required
                    >
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Slot Timings</span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={addDoctorSlot}
                    >
                      +
                    </button>
                  </label>
                </div>
                {signupSlots.map((slot, index) => (
                  <div
                    key={`${index}-${slot.startTime}-${slot.endTime}`}
                    className="grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: "0.75rem",
                    }}
                  >
                    <div className="form-group">
                      <label>
                        {index === 0 ? "Start Time" : `Start Time ${index + 1}`}
                      </label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateDoctorSlot(index, "startTime", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        {index === 0 ? "End Time" : `End Time ${index + 1}`}
                      </label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateDoctorSlot(index, "endTime", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div
                      className="form-group"
                      style={{ display: "flex", alignItems: "end" }}
                    >
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => removeDoctorSlot(index)}
                        disabled={signupSlots.length === 1}
                      >
                        -
                      </button>
                    </div>
                  </div>
                ))}
                <div className="form-group">
                  <label>Hospital Name</label>
                  <input
                    type="text"
                    value={signupHospitalName}
                    onChange={(e) => setSignupHospitalName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hospital Address</label>
                  <input
                    type="text"
                    value={signupHospitalAddress}
                    onChange={(e) => setSignupHospitalAddress(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPane;
