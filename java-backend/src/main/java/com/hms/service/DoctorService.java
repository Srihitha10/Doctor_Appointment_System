package com.hms.service;

import com.hms.dto.DoctorSlotUpdateRequest;
import com.hms.model.Doctor;
import com.hms.model.DoctorAvailabilitySlot;
import com.hms.model.Appointment;
import com.hms.model.DoctorUnavailability;
import com.hms.repository.DoctorRepository;
import com.hms.repository.DoctorUnavailabilityRepository;
import com.hms.repository.AppointmentRepository;
import com.hms.dto.DoctorSlotAvailabilityResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorUnavailabilityRepository unavailabilityRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public List<Doctor> getDoctorsByFilters(Doctor.Mode mode, Doctor.Specialization specialization) {
        if (mode != null && specialization != null) {
            return doctorRepository.findByModeAndSpecialization(mode, specialization);
        } else if (mode != null) {
            return doctorRepository.findByMode(mode);
        } else if (specialization != null) {
            return doctorRepository.findBySpecialization(specialization);
        } else {
            return doctorRepository.findAll();
        }
    }

    public Optional<Doctor> getDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId);
    }

    public Doctor updateDoctorSlots(Long doctorId, List<DoctorSlotUpdateRequest.SlotItem> slotItems) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (slotItems == null || slotItems.isEmpty()) {
            throw new RuntimeException("At least one slot is required");
        }

        List<DoctorAvailabilitySlot> slots = new ArrayList<>();
        for (DoctorSlotUpdateRequest.SlotItem item : slotItems) {
            if (item.getStartTime() == null || item.getEndTime() == null) {
                throw new RuntimeException("Each slot must have start and end time");
            }

            LocalTime start = LocalTime.parse(item.getStartTime());
            LocalTime end = LocalTime.parse(item.getEndTime());
            if (!start.isBefore(end)) {
                throw new RuntimeException("Each slot must have start time before end time");
            }

            DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
            slot.setDoctor(doctor);
            slot.setStartTime(start);
            slot.setEndTime(end);
            slots.add(slot);
        }

        slots.sort(Comparator.comparing(DoctorAvailabilitySlot::getStartTime));
        for (int i = 1; i < slots.size(); i++) {
            DoctorAvailabilitySlot previous = slots.get(i - 1);
            DoctorAvailabilitySlot current = slots.get(i);
            if (current.getStartTime().isBefore(previous.getEndTime())) {
                throw new RuntimeException("Slots must not overlap");
            }
        }

        doctor.setAvailabilitySlots(slots);
        doctor.setStartTime(slots.get(0).getStartTime());
        doctor.setEndTime(slots.get(slots.size() - 1).getEndTime());
        return doctorRepository.save(doctor);
    }

    public boolean isDoctorAvailable(Long doctorId, LocalDate date, LocalTime time) {
        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) return false;

        // Booking must match a configured slot start time exactly.
        boolean withinAnySlot = false;
        List<DoctorAvailabilitySlot> slots = doctor.getAvailabilitySlots();
        if (slots != null && !slots.isEmpty()) {
            withinAnySlot = slots.stream()
                .anyMatch(slot -> slot.getStartTime().equals(time));
        } else {
            withinAnySlot = doctor.getStartTime() != null && doctor.getStartTime().equals(time);
        }

        if (!withinAnySlot) {
            return false;
        }

        if (appointmentRepository.existsByDoctorIdAndDateAndTimeAndStatusNot(doctorId, date, time, "cancelled")) {
            return false;
        }

        // Check unavailability
        List<DoctorUnavailability> unavailabilities = unavailabilityRepository.findByDoctorIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(doctorId, date, date);
        for (DoctorUnavailability u : unavailabilities) {
            if (u.isUnavailable(date, time)) {
                return false;
            }
        }

        return true;
    }

    public List<DoctorSlotAvailabilityResponse> getSlotAvailability(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return List.of();
        }

        List<DoctorAvailabilitySlot> slots = doctor.getAvailabilitySlots();
        if (slots == null || slots.isEmpty()) {
            return List.of();
        }

        return slots.stream().map(slot -> {
            boolean booked = appointmentRepository.existsByDoctorIdAndDateAndTimeAndStatusNot(doctorId, date, slot.getStartTime(), "cancelled");
            return new DoctorSlotAvailabilityResponse(
                slot.getStartTime().toString(),
                slot.getEndTime().toString(),
                booked
            );
        }).collect(Collectors.toList());
    }
}