package com.first.labexam.dto;

import java.util.ArrayList;
import java.util.List;

public class StudentImportPreviewResponse {

    private int totalRows;
    private int validCount;
    private int invalidCount;
    private List<StudentImportRowDTO> rows = new ArrayList<>();

    public StudentImportPreviewResponse() {
    }

    public StudentImportPreviewResponse(int totalRows, int validCount, int invalidCount, List<StudentImportRowDTO> rows) {
        this.totalRows = totalRows;
        this.validCount = validCount;
        this.invalidCount = invalidCount;
        this.rows = rows;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getValidCount() {
        return validCount;
    }

    public void setValidCount(int validCount) {
        this.validCount = validCount;
    }

    public int getInvalidCount() {
        return invalidCount;
    }

    public void setInvalidCount(int invalidCount) {
        this.invalidCount = invalidCount;
    }

    public List<StudentImportRowDTO> getRows() {
        return rows;
    }

    public void setRows(List<StudentImportRowDTO> rows) {
        this.rows = rows;
    }
}
