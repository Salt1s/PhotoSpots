package ru.saltis.PhotoSpots.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeotagRepository extends JpaRepository<Geotag, Integer> {
    List<Geotag> findAllByOwner_Id(int id);

}
