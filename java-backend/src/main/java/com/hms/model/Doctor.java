package com.hms.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctor")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 32)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Specialization specialization;

    @NotBlank
    @Size(max = 20)
    @Column(unique = true)
    private String doctorCode;

    @NotNull
    private Long userId;

    private Integer experience;

    @NotBlank
    @Size(max = 100)
    private String hospitalName;

    @NotBlank
    @Size(max = 200)
    private String hospitalAddress;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Mode mode; // Online or Offline

    @NotNull
    private LocalTime startTime; // Default availability start

    @NotNull
    private LocalTime endTime; // Default availability end

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<DoctorAvailabilitySlot> availabilitySlots = new ArrayList<>();

    public enum Specialization {
        OPHTHALMOLOGY, PAEDIATRICS, GYNAECOLOGY
    }

    public enum Mode {
        ONLINE, OFFLINE
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Specialization getSpecialization() {
        return specialization;
    }

    public void setSpecialization(Specialization specialization) {
        this.specialization = specialization;
    }

    public String getDoctorCode() {
        return doctorCode;
    }

    public void setDoctorCode(String doctorCode) {
        this.doctorCode = doctorCode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getExperience() {
        return experience;
    }

    public void setExperience(Integer experience) {
        this.experience = experience;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public String getHospitalAddress() {
        return hospitalAddress;
    }

    public void setHospitalAddress(String hospitalAddress) {
        this.hospitalAddress = hospitalAddress;
    }

    public Mode getMode() {
        return mode;
    }

    public void setMode(Mode mode) {
        this.mode = mode;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public List<DoctorAvailabilitySlot> getAvailabilitySlots() {
        return availabilitySlots;
    }

    public void setAvailabilitySlots(List<DoctorAvailabilitySlot> availabilitySlots) {
        this.availabilitySlots.clear();
        if (availabilitySlots != null) {
            this.availabilitySlots.addAll(availabilitySlots);
        }
    }
}