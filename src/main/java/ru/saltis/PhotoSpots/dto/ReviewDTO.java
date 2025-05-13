package ru.saltis.PhotoSpots.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ReviewDTO {

    @Size(max = 200, message = "text max 200 symbols")
    private String text;

    private LocalDateTime createdAt;

    private PersonDTO owner;

    private float mark;

    private GeotagDTO geotag;

    public ReviewDTO() {
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
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

    public float getMark() {
        return mark;
    }

    public void setMark(float mark) {
        this.mark = mark;
    }

    public GeotagDTO getGeotag() {
        return geotag;
    }

    public void setGeotag(GeotagDTO geotag) {
        this.geotag = geotag;
    }
}
