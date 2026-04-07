package com.hms.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.hms.model.Appointment;
import com.hms.model.Doctor;
import com.hms.model.Patient;
import com.hms.repository.AppointmentRepository;
import com.hms.repository.DoctorRepository;
import com.hms.repository.PatientRepository;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorService doctorService;

    public String bookAppointment(Long patientId, Long doctorId, LocalDate date, LocalTime time) {
        if (!doctorService.isDoctorAvailable(doctorId, date, time)) {
            throw new RuntimeException("Slot not available");
        }

        Appointment appointment = new Appointment();
        appointment.setPatientId(patientId);
        appointment.setDoctorId(doctorId);
        appointment.setDate(date);
        appointment.setTime(time);
        appointment.setStatus("confirmed");

        try {
            appointmentRepository.save(appointment);
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException("Slot already booked");
        }

        Doctor doctor = doctorRepository.findById(doctorId).orElseThrow();
        if (doctor.getMode() == Doctor.Mode.ONLINE) {
            return "Appointment on " + date + " has been confirmed.";
        } else {
            return "Your appointment on " + date + " at " + time + " has been scheduled for you at " + doctor.getHospitalAddress() + ".";
        }
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return enrichAppointments(appointmentRepository.findByPatientId(patientId));
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return enrichAppointments(appointmentRepository.findByDoctorId(doctorId));
    }

    public Appointment cancelAppointment(Long appointmentId, Long doctorId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized appointment action");
        }

        if ("cancelled".equalsIgnoreCase(appointment.getStatus())) {
            return appointment;
        }

        appointment.setStatus("cancelled");
        appointment.setCancellationReason(reason);
        return appointmentRepository.save(appointment);
    }

    public Appointment cancelAppointmentByPatient(Long appointmentId, Long patientId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getPatientId().equals(patientId)) {
            throw new RuntimeException("Unauthorized appointment action");
        }

        if ("cancelled".equalsIgnoreCase(appointment.getStatus())) {
            return appointment;
        }

        appointment.setStatus("cancelled");
        appointment.setCancellationReason(reason != null && !reason.isBlank() ? reason : "Cancelled by patient");
        return appointmentRepository.save(appointment);
    }

    public Appointment savePrescription(Long appointmentId, Long doctorId, String prescription) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized appointment action");
        }

        appointment.setPrescription(prescription);
        return appointmentRepository.save(appointment);
    }

    public Appointment savePrescriptionFile(Long appointmentId, Long doctorId, MultipartFile file) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized appointment action");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Prescription file is required");
        }

        try {
            appointment.setPrescriptionFileName(file.getOriginalFilename());
            appointment.setPrescriptionFileContentType(file.getContentType());
            appointment.setPrescriptionFileData(file.getBytes());
            return appointmentRepository.save(appointment);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to save prescription file");
        }
    }

    public Appointment getAppointmentById(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        return enrichAppointments(List.of(appointment)).stream().findFirst().orElse(appointment);
    }

    private List<Appointment> enrichAppointments(List<Appointment> appointments) {
        if (appointments == null || appointments.isEmpty()) {
            return appointments;
        }

        Set<Long> doctorIds = appointments.stream()
            .map(Appointment::getDoctorId)
            .collect(Collectors.toSet());
        Set<Long> patientUserIds = appointments.stream()
            .map(Appointment::getPatientId)
            .collect(Collectors.toSet());

        Map<Long, String> doctorNames = doctorRepository.findByIdIn(doctorIds).stream()
            .collect(Collectors.toMap(Doctor::getId, Doctor::getName));
        Map<Long, String> patientNames = patientRepository.findByUserIdIn(patientUserIds).stream()
            .collect(Collectors.toMap(Patient::getUserId, Patient::getName));

        for (Appointment appointment : appointments) {
            appointment.setDoctorName(doctorNames.getOrDefault(appointment.getDoctorId(), "Unknown Doctor"));
            appointment.setPatientName(patientNames.getOrDefault(appointment.getPatientId(), "Unknown Patient"));
            appointment.setHasPrescriptionFile(
                appointment.getPrescriptionFileData() != null && appointment.getPrescriptionFileData().length > 0
            );
        }

        return appointments;
    }
}