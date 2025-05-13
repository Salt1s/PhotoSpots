package ru.saltis.PhotoSpots.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public class AuthentificationDTO {

    @NotEmpty(message = "Введите имя")
    @Size(min = 2, max = 100, message = "имя 2-100 символов")
    private String username;

    private String password;

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
