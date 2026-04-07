package com.hms.controller;

import com.hms.dto.DoctorSlotUpdateRequest;
import com.hms.model.Doctor;
import com.hms.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @GetMapping
    public List<Doctor> getDoctors(@RequestParam(required = false) Doctor.Mode mode,
                                   @RequestParam(required = false) Doctor.Specialization specialization) {
        return doctorService.getDoctorsByFilters(mode, specialization);
    }

    @GetMapping("/by-user/{userId}")
    public Map<String, Long> getDoctorByUserId(@PathVariable Long userId) {
        return doctorService.getDoctorByUserId(userId)
            .map(doctor -> Map.of("doctorId", doctor.getId()))
            .orElse(Map.of());
    }

    @GetMapping("/{doctorId}/availability")
    public List<com.hms.dto.DoctorSlotAvailabilityResponse> getAvailability(@PathVariable Long doctorId,
                                                                            @RequestParam LocalDate date) {
        return doctorService.getSlotAvailability(doctorId, date);
    }

    @PutMapping("/{doctorId}/slots")
    public Doctor updateDoctorSlots(@PathVariable Long doctorId, @RequestBody DoctorSlotUpdateRequest request) {
        return doctorService.updateDoctorSlots(doctorId, request.getSlots());
    }
}