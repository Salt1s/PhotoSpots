package ru.saltis.PhotoSpots.dto;

import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;

import java.time.LocalDateTime;

public class PhotoDTO {

    private int id;

    @NotEmpty(message = "url should not be empty")
    private String url;

    @Size(max = 200, message = "Description max 200 symbols")
    private String description;

    private LocalDateTime uploadedAt;

    private PersonDTO owner;

    private GeotagDTO geotag;

    public PhotoDTO() {
    }

    public PersonDTO getOwner() {
        return owner;
    }

    public void setOwner(PersonDTO owner) {
        this.owner = owner;
    }

    public GeotagDTO getGeotag() {
        return geotag;
    }

    public void setGeotag(GeotagDTO geotag) {
        this.geotag = geotag;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }


}
