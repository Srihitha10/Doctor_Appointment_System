package com.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointment", uniqueConstraints = @UniqueConstraint(columnNames = {"doctorId", "date", "time", "status"}))
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long patientId;

    @NotNull
    private Long doctorId;

    @NotNull
    private LocalDate date;

    @NotNull
    private LocalTime time;

    @NotBlank
    @Size(max = 20)
    private String status;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String prescription;

    @Size(max = 255)
    private String prescriptionFileName;

    @Size(max = 120)
    private String prescriptionFileContentType;

    @JsonIgnore
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] prescriptionFileData;

    @Size(max = 500)
    private String cancellationReason;

    @Transient
    private String doctorName;

    @Transient
    private String patientName;

    @Transient
    private boolean hasPrescriptionFile;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPrescription() {
        return prescription;
    }

    public void setPrescription(String prescription) {
        this.prescription = prescription;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getPrescriptionFileName() {
        return prescriptionFileName;
    }

    public void setPrescriptionFileName(String prescriptionFileName) {
        this.prescriptionFileName = prescriptionFileName;
    }

    public String getPrescriptionFileContentType() {
        return prescriptionFileContentType;
    }

    public void setPrescriptionFileContentType(String prescriptionFileContentType) {
        this.prescriptionFileContentType = prescriptionFileContentType;
    }

    public byte[] getPrescriptionFileData() {
        return prescriptionFileData;
    }

    public void setPrescriptionFileData(byte[] prescriptionFileData) {
        this.prescriptionFileData = prescriptionFileData;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public boolean isHasPrescriptionFile() {
        return hasPrescriptionFile;
    }

    public void setHasPrescriptionFile(boolean hasPrescriptionFile) {
        this.hasPrescriptionFile = hasPrescriptionFile;
    }
}