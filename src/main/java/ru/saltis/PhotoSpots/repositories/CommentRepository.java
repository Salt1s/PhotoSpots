package ru.saltis.PhotoSpots.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.saltis.PhotoSpots.models.Comment;
import ru.saltis.PhotoSpots.models.Geotag;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {
    List<Comment> findAllByPhoto_Id(int id);
    List<Comment> findAllByOwner_Id(int id);
}
