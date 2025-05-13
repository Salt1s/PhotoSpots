package ru.saltis.PhotoSpots.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name="person")
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "name")
    @NotEmpty(message = "Name should not be empty")
    @Size(min = 1, max = 50, message = "name 1-50 symbols")
    private String name;

    @Column(name = "email")
    @NotEmpty(message = "Email should not be empty")
    @Size(min = 1, max = 100, message = "Email 1-100 symbols")
    @Email(message = "Email should be valid -> '@mail.com'")
    private String email;

    @Column(name = "description")
    @Size(max = 200, message = "Description max 200 symbols")
    private String description;

    @Column(name = "username")
    @NotEmpty(message = "Username should not be empty")
    @Size(min = 1, max = 100, message = "Username 1-50 symbols")
    private String username;

    @Column(name = "password")
    @NotEmpty(message = "Password should not be empty")
    @Size(min = 5, max = 100, message = "Password 5-100 symbols")
    private String password;

    @Column(name = "is_blocked")
    @NotNull
    private Boolean isBlocked;

    @Column(name = "role")
    @NotEmpty
    private String role;

    @Column(name = "created_at")
    @NotNull
    private LocalDate createdAt;

    @OneToMany(mappedBy = "owner")
    private List<Photo> photos;

    @OneToMany(mappedBy = "owner")
    private List<Geotag> geotags;

    @OneToMany(mappedBy = "owner")
    private List<Comment> comments;

    public Person() {
    }

    public Person(String name, String email, String description, String username, String password, String role) {
        this.name = name;
        this.email = email;
        this.description = description;
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public List<Photo> getPhotos() {
        return photos;
    }

    public void setPhotos(List<Photo> photos) {
        this.photos = photos;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public Boolean getIsBlocked() {
        return isBlocked;
    }
    public void setIsBlocked(Boolean isBlocked) {
        this.isBlocked = isBlocked;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getBlocked() {
        return isBlocked;
    }

    public void setBlocked(Boolean blocked) {
        isBlocked = blocked;
    }

    public List<Geotag> getGeotags() {
        return geotags;
    }

    public void setGeotags(List<Geotag> geotags) {
        this.geotags = geotags;
    }

    @Override
    public String toString() {
        return "Person{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", description='" + description + '\'' +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                ", isBlocked=" + isBlocked +
                ", role='" + role + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
