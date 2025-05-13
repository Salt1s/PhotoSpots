package ru.saltis.PhotoSpots.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.saltis.PhotoSpots.models.Photo;

import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Integer> {
    List<Photo> findAllByOwner_Id(int id);
    List<Photo> findAllByGeotag_Id(int id);
}
