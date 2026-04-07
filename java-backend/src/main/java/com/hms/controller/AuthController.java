package com.hms.controller;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.dto.LoginRequest;
import com.hms.dto.SignupRequest;
import com.hms.model.Doctor;
import com.hms.model.DoctorAvailabilitySlot;
import com.hms.model.Patient;
import com.hms.model.User;
import com.hms.repository.DoctorRepository;
import com.hms.repository.PatientRepository;
import com.hms.repository.UserRepository;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")
public class AuthController {

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
    private static final Pattern STRONG_PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        String role = request.getRole() == null ? null : request.getRole().trim().toLowerCase();
        String username = request.getUsername() == null ? null : request.getUsername().trim();
        String password = request.getPassword();

        if (role == null || role.isBlank() || username == null || username.isBlank() || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required credentials"));
        }

        if (!STRONG_PASSWORD_PATTERN.matcher(password).matches()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"));
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(PASSWORD_ENCODER.encode(password));
        user.setRole(role);
        userRepository.save(user);

        if ("doctor".equals(role)) {
            Doctor doctor = new Doctor();
            doctor.setUserId(user.getId());
            doctor.setName(request.getName());
            try {
                doctor.setSpecialization(Doctor.Specialization.valueOf(request.getSpecialization()));
                doctor.setMode(Doctor.Mode.valueOf(request.getMode()));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid doctor signup values"));
            }

            List<DoctorAvailabilitySlot> slots = new ArrayList<>();
            if (request.getAvailabilitySlots() != null && !request.getAvailabilitySlots().isEmpty()) {
                for (SignupRequest.AvailabilitySlotRequest slotRequest : request.getAvailabilitySlots()) {
                    try {
                        LocalTime start = LocalTime.parse(slotRequest.getStartTime());
                        LocalTime end = LocalTime.parse(slotRequest.getEndTime());
                        if (!start.isBefore(end)) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Each slot must have start time before end time"));
                        }
                        DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
                        slot.setDoctor(doctor);
                        slot.setStartTime(start);
                        slot.setEndTime(end);
                        slots.add(slot);
                    } catch (Exception ex) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid doctor slot values"));
                    }
                }
            } else {
                try {
                    LocalTime start = LocalTime.parse(request.getStartTime());
                    LocalTime end = LocalTime.parse(request.getEndTime());
                    if (!start.isBefore(end)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Start time must be before end time"));
                    }
                    DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
                    slot.setDoctor(doctor);
                    slot.setStartTime(start);
                    slot.setEndTime(end);
                    slots.add(slot);
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid doctor signup values"));
                }
            }

            doctor.setAvailabilitySlots(slots);
            LocalTime earliest = slots.stream().map(DoctorAvailabilitySlot::getStartTime).min(Comparator.naturalOrder()).orElseThrow();
            LocalTime latest = slots.stream().map(DoctorAvailabilitySlot::getEndTime).max(Comparator.naturalOrder()).orElseThrow();
            doctor.setStartTime(earliest);
            doctor.setEndTime(latest);
            doctor.setHospitalName(request.getHospitalName());
            doctor.setHospitalAddress(request.getHospitalAddress());
            doctor.setDoctorCode(username);
            doctorRepository.save(doctor);
        } else if ("patient".equals(role)) {
            Patient patient = new Patient();
            patient.setUserId(user.getId());
            patient.setUsername(username);
            patient.setName(request.getName());
            patient.setPhone(request.getPhone());
            try {
                patient.setAge(Integer.parseInt(request.getAge()));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid age"));
            }
            patientRepository.save(patient);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }

        return ResponseEntity.ok(Map.of("message", "Signup successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing credentials"));
        }

        String username = request.getUsername().trim();
        String password = request.getPassword();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username not found"));
        }

        User user = userOpt.get();
        if (matchesPassword(password, user)) {
            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getId());
            response.put("role", user.getRole());
            response.put("username", user.getUsername());

            if ("doctor".equals(user.getRole())) {
                doctorRepository.findByUserId(user.getId()).ifPresent(doctor -> response.put("doctorId", doctor.getId()));
            }

            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Incorrect password"));
    }

    private boolean matchesPassword(String rawPassword, User user) {
        String stored = user.getPasswordHash();

        try {
            if (PASSWORD_ENCODER.matches(rawPassword, stored)) {
                return true;
            }
        } catch (IllegalArgumentException ex) {
            // Legacy plaintext rows from earlier versions are handled below.
        }

        if (rawPassword.equals(stored)) {
            user.setPasswordHash(PASSWORD_ENCODER.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }
}