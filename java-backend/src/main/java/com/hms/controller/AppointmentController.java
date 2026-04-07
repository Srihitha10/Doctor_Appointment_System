package com.hms.controller;

import com.hms.model.Appointment;
import com.hms.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping("/book")
    public String bookAppointment(@RequestParam Long patientId,
                                  @RequestParam Long doctorId,
                                  @RequestParam String date,
                                  @RequestParam String time) {
        LocalDate localDate = LocalDate.parse(date);
        LocalTime localTime = LocalTime.parse(time);
        return appointmentService.bookAppointment(patientId, doctorId, localDate, localTime);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointments(@PathVariable Long patientId) {
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        return appointmentService.getAppointmentsByDoctor(doctorId);
    }

    @PostMapping("/{appointmentId}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long appointmentId,
                                               @RequestBody Map<String, String> payload) {
        try {
            Long doctorId = Long.valueOf(payload.get("doctorId"));
            String reason = payload.getOrDefault("reason", "Cancelled by doctor");
            return ResponseEntity.ok(appointmentService.cancelAppointment(appointmentId, doctorId, reason));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{appointmentId}/cancel-by-patient")
    public ResponseEntity<?> cancelAppointmentByPatient(@PathVariable Long appointmentId,
                                                        @RequestBody Map<String, String> payload) {
        try {
            Long patientId = Long.valueOf(payload.get("patientId"));
            String reason = payload.getOrDefault("reason", "Cancelled by patient");
            return ResponseEntity.ok(appointmentService.cancelAppointmentByPatient(appointmentId, patientId, reason));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{appointmentId}/prescription")
    public ResponseEntity<?> savePrescription(@PathVariable Long appointmentId,
                                              @RequestBody Map<String, String> payload) {
        try {
            Long doctorId = Long.valueOf(payload.get("doctorId"));
            String prescription = payload.getOrDefault("prescription", "");
            return ResponseEntity.ok(appointmentService.savePrescription(appointmentId, doctorId, prescription));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping(value = "/{appointmentId}/prescription-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPrescriptionFile(@PathVariable Long appointmentId,
                                                    @RequestParam Long doctorId,
                                                    @RequestParam MultipartFile file) {
        try {
            return ResponseEntity.ok(appointmentService.savePrescriptionFile(appointmentId, doctorId, file));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{appointmentId}/prescription-file")
    public ResponseEntity<byte[]> downloadPrescriptionFile(@PathVariable Long appointmentId) {
        Appointment appointment = appointmentService.getAppointmentById(appointmentId);
        if (appointment.getPrescriptionFileData() == null || appointment.getPrescriptionFileData().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String contentType = appointment.getPrescriptionFileContentType() != null
            ? appointment.getPrescriptionFileContentType()
            : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + appointment.getPrescriptionFileName() + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .body(appointment.getPrescriptionFileData());
    }
}