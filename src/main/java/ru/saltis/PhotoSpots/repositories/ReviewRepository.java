package ru.saltis.PhotoSpots.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.saltis.PhotoSpots.models.Comment;
import ru.saltis.PhotoSpots.models.Review;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findAllByGeotag_Id(int id);
    List<Review> findAllByOwner_Id(int id);
}
