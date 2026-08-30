package com.first.labexam.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class AttendanceUniqueIndexInitializer implements ApplicationRunner {

    private final DataSource dataSource;

    public AttendanceUniqueIndexInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uk_attendance_student_exam_date "
                            + "ON attendance (student_id, exam_id, attendance_date)"
            );
        } catch (Exception ex) {
            System.err.println(
                    "Attendance unique index was not created (existing duplicates or constraint already present): "
                            + ex.getMessage()
            );
        }
    }
}
