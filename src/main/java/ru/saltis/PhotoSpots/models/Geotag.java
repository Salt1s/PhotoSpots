package ru.saltis.PhotoSpots.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "geotag")
public class Geotag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "title")
    @Size(max = 50, message = "title 0-50 symbols")
    private String title;

    @Column(name = "description")
    @Size(max = 200, message = "Description max 200 symbols")
    private String description;

    @Column(name = "latitude")
    @NotNull(message = "latitude should not be empty")
    private double latitude;

    @Column(name = "longtitude")
    @NotNull(message = "longitude should not be empty")
    private double longitude;

    @Column(name = "created_at")
    @NotNull(message = "created_at should not be empty")
    private LocalDateTime createdAt;

    @Column(name = "rating")
    private float rating;

    @ManyToOne()
    @JoinColumn(name = "person_id", referencedColumnName = "id")
    private Person owner;

    @OneToMany(mappedBy = "geotag", cascade = CascadeType.ALL)
    private List<Photo> photos = new ArrayList<>();

    @OneToMany(mappedBy = "geotag", cascade = CascadeType.ALL)
    private List<Review> reviews = new ArrayList<>();

    public Geotag() {
    }

    public List<Photo> getPhotos() {
        return photos;
    }

    public void setPhotos(List<Photo> photos) {
        this.photos = photos;
    }

    public List<Review> getReviews() {
        return reviews;
    }

    public void setReviews(List<Review> reviews) {
        this.reviews = reviews;
    }

    public Person getOwner() {
        return owner;
    }

    public void setOwner(Person owner) {
        this.owner = owner;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getlongitude() {
        return longitude;
    }

    public void setlongitude(double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public float getRating() {
        return rating;
    }

    public void setRating(float rating) {
        this.rating = rating;
    }
}
