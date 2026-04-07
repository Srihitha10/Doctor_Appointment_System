package com.hms.dto;

import java.util.List;

public class DoctorSlotUpdateRequest {
    private List<SlotItem> slots;

    public static class SlotItem {
        private String startTime;
        private String endTime;

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
    }

    public List<SlotItem> getSlots() {
        return slots;
    }

    public void setSlots(List<SlotItem> slots) {
        this.slots = slots;
    }
}
