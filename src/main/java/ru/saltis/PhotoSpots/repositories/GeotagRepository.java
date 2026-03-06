package ru.saltis.PhotoSpots.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.saltis.PhotoSpots.models.Geotag;

import java.util.List;

@Repository
public interface GeotagRepository extends JpaRepository<Geotag, Integer> {
    List<Geotag> findAllByOwner_Id(int id);

}
