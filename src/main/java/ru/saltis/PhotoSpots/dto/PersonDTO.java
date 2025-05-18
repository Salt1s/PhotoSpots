package ru.saltis.PhotoSpots.dto;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class PersonDTO {

    @NotNull
    @Column(name = "id")
    private int id;

    @NotEmpty(message = "Name not should be empty")
    @Size(min = 2, max = 30, message = "name 2-30")
    private String name;

    @NotEmpty(message = "Email should not be empty")
    @Size(min = 1, max = 100, message = "Email 1-100 symbols")
    @Email(message = "Email should be valid -> '@mail.com'")
    private String email;

    @Size(max = 200, message = "Description max 200 symbols")
    private String description;

    @NotEmpty(message = "Username should not be empty")
    @Size(min = 1, max = 100, message = "Username 1-50 symbols")
    private String username;

    @NotEmpty(message = "Password should not be empty")
    @Size(min = 1, max = 100, message = "Password 1-100 symbols")
    private String password;

    private String role;

    private LocalDate createdAt;

    private Boolean isBlocked;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getBlocked() {
        return isBlocked;
    }

    public void setBlocked(Boolean blocked) {
        isBlocked = blocked;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
