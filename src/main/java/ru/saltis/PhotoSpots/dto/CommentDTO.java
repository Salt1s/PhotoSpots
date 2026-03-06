package ru.saltis.PhotoSpots.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CommentDTO {

    private int id;

    @Size(max = 200, message = "text max 200 symbols")
    private String text;

    private LocalDateTime createdAt;

    private PersonDTO owner;

    private PhotoDTO photo;

    public CommentDTO() {
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public PersonDTO getOwner() {
        return owner;
    }

    public void setOwner(PersonDTO owner) {
        this.owner = owner;
    }

    public PhotoDTO getPhoto() {
        return photo;
    }

    public void setPhoto(PhotoDTO photo) {
        this.photo = photo;
    }
}
