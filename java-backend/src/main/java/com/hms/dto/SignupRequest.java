package com.hms.dto;

import java.util.List;

public class SignupRequest {
    private String role;
    private String username;
    private String password;
    private String name;
    private String phone;
    private String age;
    private String specialization;
    private String mode;
    private String startTime;
    private String endTime;
    private List<AvailabilitySlotRequest> availabilitySlots;
    private String hospitalName;
    private String hospitalAddress;

    public static class AvailabilitySlotRequest {
        private String startTime;
        private String endTime;

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
    }

    // Getters and Setters
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public List<AvailabilitySlotRequest> getAvailabilitySlots() { return availabilitySlots; }
    public void setAvailabilitySlots(List<AvailabilitySlotRequest> availabilitySlots) { this.availabilitySlots = availabilitySlots; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getHospitalAddress() { return hospitalAddress; }
    public void setHospitalAddress(String hospitalAddress) { this.hospitalAddress = hospitalAddress; }
}
