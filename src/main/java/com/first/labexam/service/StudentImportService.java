package com.first.labexam.service;

import com.first.labexam.dto.StudentImportPreviewResponse;
import com.first.labexam.dto.StudentImportRowDTO;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentImportService {

    private final UserRepository userRepository;
    private final HodService hodService;
    private final PasswordEncoder passwordEncoder;

    public StudentImportService(
            UserRepository userRepository,
            HodService hodService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.hodService = hodService;
        this.passwordEncoder = passwordEncoder;
    }

    public StudentImportPreviewResponse previewImport(Long hodId, MultipartFile file) {
        User hod = hodService.validateHod(hodId);

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Import file is required and cannot be empty.");
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<StudentImportRowDTO> rawRows;

        if (filename.endsWith(".csv")) {
            rawRows = parseCsv(file);
        } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            rawRows = parseExcel(file);
        } else {
            throw new RuntimeException("Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx) file.");
        }

        if (rawRows.isEmpty()) {
            throw new RuntimeException("No data rows found in the uploaded file.");
        }

        // Validate rows against DB and duplicate entries within the file
        Set<String> seenEmails = new HashSet<>();
        Set<String> seenEnrollments = new HashSet<>();

        int validCount = 0;
        int invalidCount = 0;

        for (StudentImportRowDTO row : rawRows) {
            validateRow(row, hod.getDepartment(), seenEmails, seenEnrollments);
            if (row.isValid()) {
                validCount++;
            } else {
                invalidCount++;
            }
        }

        return new StudentImportPreviewResponse(rawRows.size(), validCount, invalidCount, rawRows);
    }

    public List<UserProfileResponse> confirmImport(Long hodId, List<StudentImportRowDTO> rows) {
        User hod = hodService.validateHod(hodId);

        if (rows == null || rows.isEmpty()) {
            throw new RuntimeException("No student rows provided for import.");
        }

        List<User> studentsToSave = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();
        Set<String> seenEnrollments = new HashSet<>();

        for (StudentImportRowDTO row : rows) {
            validateRow(row, hod.getDepartment(), seenEmails, seenEnrollments);
            if (row.isValid()) {
                User student = new User();
                student.setName(row.getName().trim());
                student.setEmail(row.getEmail().trim().toLowerCase());
                student.setEnrollmentNumber(row.getEnrollmentNumber().trim());
                student.setBatch(row.getBatch() != null ? row.getBatch().trim() : "E1");
                student.setSemester(row.getSemester() != null ? row.getSemester() : 1);
                student.setDepartment(hod.getDepartment().trim());
                student.setRole("STUDENT");
                student.setStatus("ACTIVE");

                String rawPassword = (row.getPassword() != null && !row.getPassword().trim().isEmpty())
                        ? row.getPassword().trim()
                        : "password123";
                student.setPassword(passwordEncoder.encode(rawPassword));

                studentsToSave.add(student);
            }
        }

        if (studentsToSave.isEmpty()) {
            throw new RuntimeException("No valid student records were available to import.");
        }

        List<User> savedList = userRepository.saveAll(studentsToSave);

        return savedList.stream()
                .map(s -> {
                    UserProfileResponse res = new UserProfileResponse(
                            s.getId(), s.getName(), s.getEmail(), s.getRole(), s.getDepartment(), s.getProfileImage()
                    );
                    res.setEnrollmentNumber(s.getEnrollmentNumber());
                    res.setBatch(s.getBatch());
                    res.setSemester(s.getSemester());
                    res.setStatus(s.getStatus());
                    res.setDesignation("Student");
                    return res;
                })
                .collect(Collectors.toList());
    }

    private void validateRow(
            StudentImportRowDTO row,
            String hodDepartment,
            Set<String> seenEmails,
            Set<String> seenEnrollments
    ) {
        // 1. Name validation
        if (row.getName() == null || row.getName().trim().isEmpty()) {
            row.addError("Student name is missing");
        }

        // 2. Email validation
        if (row.getEmail() == null || row.getEmail().trim().isEmpty()) {
            row.addError("Email is missing");
        } else {
            String email = row.getEmail().trim().toLowerCase();
            if (!email.contains("@") || !email.contains(".")) {
                row.addError("Invalid email format (" + email + ")");
            } else if (seenEmails.contains(email)) {
                row.addError("Duplicate email in file (" + email + ")");
            } else if (userRepository.existsByEmail(email)) {
                row.addError("Email already exists in database (" + email + ")");
            } else {
                seenEmails.add(email);
            }
        }

        // 3. Enrollment number validation
        if (row.getEnrollmentNumber() == null || row.getEnrollmentNumber().trim().isEmpty()) {
            row.addError("Enrollment number is missing");
        } else {
            String enroll = row.getEnrollmentNumber().trim();
            if (seenEnrollments.contains(enroll)) {
                row.addError("Duplicate enrollment number in file (" + enroll + ")");
            } else if (userRepository.existsByEnrollmentNumber(enroll)) {
                row.addError("Enrollment number already exists in database (" + enroll + ")");
            } else {
                seenEnrollments.add(enroll);
            }
        }

        // 4. Department validation
        if (row.getDepartment() != null && !row.getDepartment().trim().isEmpty()) {
            if (!row.getDepartment().trim().equalsIgnoreCase(hodDepartment.trim())) {
                row.addError("Department '" + row.getDepartment() + "' does not match HOD department (" + hodDepartment + ")");
            }
        } else {
            row.setDepartment(hodDepartment);
        }

        // 5. Semester validation
        if (row.getSemester() == null || row.getSemester() < 1 || row.getSemester() > 10) {
            row.addError("Invalid semester value (must be 1-10)");
        }
    }

    private List<StudentImportRowDTO> parseCsv(MultipartFile file) {
        List<StudentImportRowDTO> list = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Reader reader = new InputStreamReader(is, StandardCharsets.UTF_8);
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build())) {

            int rowNum = 1;
            for (CSVRecord record : parser) {
                rowNum++;
                StudentImportRowDTO dto = new StudentImportRowDTO();
                dto.setRowNumber(rowNum);
                dto.setName(getRecordValue(record, "name", "student name", "student_name"));
                dto.setEmail(getRecordValue(record, "email", "email address", "student_email"));
                dto.setEnrollmentNumber(getRecordValue(record, "enrollment", "enrollment number", "enrollment_number", "enrollmentno", "enrollment_no"));
                dto.setBatch(getRecordValue(record, "batch", "class", "section"));
                dto.setDepartment(getRecordValue(record, "department", "dept"));
                dto.setPassword(getRecordValue(record, "password", "pass"));

                String semStr = getRecordValue(record, "semester", "sem");
                if (semStr != null && !semStr.isEmpty()) {
                    try {
                        dto.setSemester(Integer.parseInt(semStr.replaceAll("[^0-9]", "")));
                    } catch (NumberFormatException e) {
                        dto.setSemester(null);
                    }
                } else {
                    dto.setSemester(1);
                }

                list.add(dto);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
        return list;
    }

    private List<StudentImportRowDTO> parseExcel(MultipartFile file) {
        List<StudentImportRowDTO> list = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            if (!rowIterator.hasNext()) {
                return list;
            }

            // Header row
            Row headerRow = rowIterator.next();
            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) {
                String val = getCellValueAsString(cell).toLowerCase().trim();
                headerMap.put(val, cell.getColumnIndex());
            }

            int rowNum = 1;
            while (rowIterator.hasNext()) {
                rowNum++;
                Row row = rowIterator.next();
                if (isRowEmpty(row)) continue;

                StudentImportRowDTO dto = new StudentImportRowDTO();
                dto.setRowNumber(rowNum);

                dto.setName(getCellByHeader(row, headerMap, "name", "student name", "student_name"));
                dto.setEmail(getCellByHeader(row, headerMap, "email", "email address", "student_email"));
                dto.setEnrollmentNumber(getCellByHeader(row, headerMap, "enrollment", "enrollment number", "enrollment_number", "enrollmentno", "enrollment_no"));
                dto.setBatch(getCellByHeader(row, headerMap, "batch", "class", "section"));
                dto.setDepartment(getCellByHeader(row, headerMap, "department", "dept"));
                dto.setPassword(getCellByHeader(row, headerMap, "password", "pass"));

                String semStr = getCellByHeader(row, headerMap, "semester", "sem");
                if (semStr != null && !semStr.isEmpty()) {
                    try {
                        dto.setSemester((int) Double.parseDouble(semStr.replaceAll("[^0-9.]", "")));
                    } catch (Exception e) {
                        dto.setSemester(null);
                    }
                } else {
                    dto.setSemester(1);
                }

                list.add(dto);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
        return list;
    }

    private String getRecordValue(CSVRecord record, String... headers) {
        for (String h : headers) {
            if (record.isMapped(h) && record.get(h) != null) {
                return record.get(h).trim();
            }
        }
        return null;
    }

    private String getCellByHeader(Row row, Map<String, Integer> headerMap, String... aliases) {
        for (String alias : aliases) {
            for (Map.Entry<String, Integer> entry : headerMap.entrySet()) {
                if (entry.getKey().contains(alias)) {
                    Cell cell = row.getCell(entry.getValue());
                    return getCellValueAsString(cell);
                }
            }
        }
        return null;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getDateCellValue().toString()
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> null;
        };
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && getCellValueAsString(cell) != null && !getCellValueAsString(cell).isEmpty()) {
                return false;
            }
        }
        return true;
    }
}
