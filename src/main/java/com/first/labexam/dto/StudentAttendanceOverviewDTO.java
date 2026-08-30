package com.first.labexam.dto;

import java.util.ArrayList;
import java.util.List;

public class StudentAttendanceOverviewDTO {

    private int totalExams;
    private int presentCount;
    private int absentCount;
    private double percentage;
    private List<StudentAttendanceRecordDTO> records = new ArrayList<>();

    public StudentAttendanceOverviewDTO() {
    }

    public int getTotalExams() {
        return totalExams;
    }

    public void setTotalExams(int totalExams) {
        this.totalExams = totalExams;
    }

    public int getPresentCount() {
        return presentCount;
    }

    public void setPresentCount(int presentCount) {
        this.presentCount = presentCount;
    }

    public int getAbsentCount() {
        return absentCount;
    }

    public void setAbsentCount(int absentCount) {
        this.absentCount = absentCount;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public List<StudentAttendanceRecordDTO> getRecords() {
        return records;
    }

    public void setRecords(List<StudentAttendanceRecordDTO> records) {
        this.records = records;
    }
}
