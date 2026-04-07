package com.hms.dto;

public class DoctorSlotAvailabilityResponse {
    private String startTime;
    private String endTime;
    private boolean booked;

    public DoctorSlotAvailabilityResponse() {
    }

    public DoctorSlotAvailabilityResponse(String startTime, String endTime, boolean booked) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.booked = booked;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public boolean isBooked() {
        return booked;
    }

    public void setBooked(boolean booked) {
        this.booked = booked;
    }
}
