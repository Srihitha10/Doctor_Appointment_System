const AppointmentList = ({
  appointments,
  role,
  onCancelAppointment,
  onCancelByPatient,
  onPrescriptionChange,
  onSavePrescription,
  onUploadPrescriptionFile,
  onDownloadPrescriptionFile,
  prescriptionDrafts = {},
  selectedFiles = {},
}) => {
  const formatTime12 = (timeValue) => {
    if (!timeValue) return "--:--";
    const [hourPart, minutePart] = timeValue.slice(0, 5).split(":");
    let hour = Number(hourPart);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, "0")}:${minutePart} ${ampm}`;
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div
        className="glass card animate-in"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <p style={{ color: "var(--text-muted)" }}>No appointments found.</p>
      </div>
    );
  }

  const statusBadgeStyle = (status) => {
    if (status === "cancelled") {
      return { background: "rgba(239, 68, 68, 0.18)", color: "#ef4444" };
    }
    return { background: "rgba(99, 102, 241, 0.2)", color: "var(--primary)" };
  };

  return (
    <div
      className="glass card animate-in"
      style={{ padding: "1rem", overflowX: "auto" }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem", color: "var(--text-muted)" }}>
              {role === "patient" ? "Doctor ID" : "Patient ID"}
            </th>
            <th style={{ padding: "1rem", color: "var(--text-muted)" }}>
              Date
            </th>
            <th style={{ padding: "1rem", color: "var(--text-muted)" }}>
              Time
            </th>
            <th style={{ padding: "1rem", color: "var(--text-muted)" }}>
              Status
            </th>
            {(role === "doctor" || role === "patient") && (
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>
                Prescription
              </th>
            )}
            {(role === "doctor" || role === "patient") && (
              <th style={{ padding: "1rem", color: "var(--text-muted)" }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {appointments.map((app) => (
            <tr
              key={app.id}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td style={{ padding: "1rem" }}>
                {role === "patient"
                  ? `${app.doctorName || "Doctor"} (ID: ${app.doctorId})`
                  : `${app.patientName || "Patient"} (ID: ${app.patientId})`}
              </td>
              <td style={{ padding: "1rem" }}>{app.date}</td>
              <td style={{ padding: "1rem" }}>{formatTime12(app.time)}</td>
              <td style={{ padding: "1rem" }}>
                <span className="badge" style={statusBadgeStyle(app.status)}>
                  {app.status}
                </span>
                {app.status === "cancelled" && app.cancellationReason && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    {app.cancellationReason}
                  </div>
                )}
              </td>
              {role === "doctor" && (
                <td style={{ padding: "1rem", minWidth: "260px" }}>
                  <textarea
                    value={prescriptionDrafts[app.id] ?? app.prescription ?? ""}
                    onChange={(e) =>
                      onPrescriptionChange(app.id, e.target.value)
                    }
                    placeholder={
                      app.status === "cancelled"
                        ? "Appointment cancelled"
                        : "Type prescription here"
                    }
                    rows={3}
                    disabled={app.status === "cancelled"}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="file"
                      onChange={(e) =>
                        onUploadPrescriptionFile(app.id, e.target.files?.[0])
                      }
                      disabled={app.status === "cancelled"}
                    />
                    {app.hasPrescriptionFile && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() =>
                          onDownloadPrescriptionFile(
                            app.id,
                            app.prescriptionFileName,
                          )
                        }
                      >
                        Download File
                      </button>
                    )}
                    {selectedFiles[app.id] && (
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {selectedFiles[app.id]}
                      </span>
                    )}
                  </div>
                </td>
              )}
              {role === "patient" && (
                <td style={{ padding: "1rem", minWidth: "260px" }}>
                  <div
                    style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}
                  >
                    {app.prescription || "No prescription added yet."}
                  </div>
                  {app.hasPrescriptionFile && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        onDownloadPrescriptionFile(
                          app.id,
                          app.prescriptionFileName,
                        )
                      }
                    >
                      Download Prescription File
                    </button>
                  )}
                </td>
              )}
              {role === "doctor" && (
                <td style={{ padding: "1rem", minWidth: "170px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onSavePrescription(app.id)}
                      disabled={app.status === "cancelled"}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ borderColor: "#ef4444", color: "#ef4444" }}
                      onClick={() => onCancelAppointment(app.id)}
                      disabled={app.status === "cancelled"}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              )}
              {role === "patient" && (
                <td style={{ padding: "1rem", minWidth: "170px" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ borderColor: "#ef4444", color: "#ef4444" }}
                    onClick={() => onCancelByPatient(app.id)}
                    disabled={app.status?.toLowerCase() !== "confirmed"}
                  >
                    Cancel Appointment
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentList;
