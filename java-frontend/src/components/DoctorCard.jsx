const DoctorCard = ({ doctor, onBook, role, bookingDate, formatTime12 }) => {
  const formatTime = (timeValue) => formatTime12?.(timeValue) || "--:--";

  const availabilitySlots = doctor.availabilitySlots?.length
    ? doctor.availabilitySlots
    : [{ startTime: doctor.startTime, endTime: doctor.endTime }];

  return (
    <div className="glass card animate-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "var(--primary)" }}>
            Dr. {doctor.name}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {doctor.specialization}
          </p>
        </div>
        <span
          className={`badge ${doctor.mode === "ONLINE" ? "badge-online" : "badge-offline"}`}
        >
          {doctor.mode}
        </span>
      </div>

      <div style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span>🏥</span>
          <span>
            {doctor.hospitalName} - {doctor.hospitalAddress}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span>🕒</span>
          <span>
            {availabilitySlots
              .map(
                (slot) =>
                  `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
              )
              .join(", ")}
          </span>
        </div>
      </div>

      {role === "patient" && (
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={() => onBook(doctor)}
        >
          Book Appointment
        </button>
      )}
    </div>
  );
};

export default DoctorCard;
