package ru.saltis.PhotoSpots.models;


import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import ru.saltis.PhotoSpots.dto.PersonDTO;
import ru.saltis.PhotoSpots.dto.PhotoDTO;

import java.time.LocalDateTime;

@Entity
@Table(name = "photo_comment")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Size(max = 200, message = "text max 200 symbols")
    @Column(name = "text")
    private String text;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "person_id")
    private Person owner;

    @ManyToOne
    @JoinColumn(name = "photo_id")
    private Photo photo;

    public Comment() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public Person getOwner() {
        return owner;
    }

    public void setOwner(Person owner) {
        this.owner = owner;
    }

    public Photo getPhoto() {
        return photo;
    }

    public void setPhoto(Photo photo) {
        this.photo = photo;
    }
}
