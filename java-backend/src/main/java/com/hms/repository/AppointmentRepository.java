package com.hms.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hms.model.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorIdAndDate(Long doctorId, LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId AND a.date = :date AND a.time = :time")
    List<Appointment> findByDoctorIdAndDateAndTime(@Param("doctorId") Long doctorId, @Param("date") LocalDate date, @Param("time") LocalTime time);

    boolean existsByDoctorIdAndDateAndTimeAndStatusNot(Long doctorId, LocalDate date, LocalTime time, String status);

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);
}