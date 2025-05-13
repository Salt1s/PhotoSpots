package ru.saltis.PhotoSpots.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.Comments;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "photo")
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "url")
    @NotEmpty(message = "url should not be empty")
    private String url;

    @Column(name = "description")
    @Size(max = 200, message = "Description max 200 symbols")
    private String description;


    @Column(name = "uploaded_at")
    @NotNull(message = "uploaded_at should not be empty")
    private LocalDateTime uploadedAt;

    @ManyToOne()
    @JoinColumn(name = "person_id", referencedColumnName = "id")
    private Person owner;

    @ManyToOne
    @JoinColumn(name = "geotag_id")
    private Geotag geotag;

    @OneToMany(mappedBy = "photo", cascade = CascadeType.ALL)
    private List<Comment> comments;

    public Photo() {
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public Geotag getGeotag() {
        return geotag;
    }

    public void setGeotag(Geotag geotag) {
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

    public Person getOwner() {
        return owner;
    }

    public void setOwner(Person owner) {
        this.owner = owner;
    }
}
