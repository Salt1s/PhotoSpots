package ru.saltis.PhotoSpots.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.repositories.GeotagRepository;
import ru.saltis.PhotoSpots.util.GeotagNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class GeotagService {
    private final GeotagRepository geotagRepository;
    private final PeopleService peopleService;

    @Autowired
    public GeotagService(GeotagRepository geotagRepository, PeopleService peopleService) {
        this.geotagRepository = geotagRepository;
        this.peopleService = peopleService;
    }

    public List<Geotag> findAll() {
        return geotagRepository.findAll();
    }

    public List<Geotag> findAllByPersonId(int id) {
        return geotagRepository.findAllByOwner_Id(id);
    }

    public Geotag findOne(int id) {
        Optional<Geotag> foundGeotag =  geotagRepository.findById(id);
        return foundGeotag.orElseThrow(() -> new GeotagNotFoundException("Geotag not found"));
    }

    @Transactional //помечаем потому что не читаем а пишем в бд
    public void save(Geotag geotag) {

        enrichGeotag(geotag);
        geotagRepository.save(geotag);
    }

    @Transactional
    public void delete(int id) {
        geotagRepository.deleteById(id);
    }

    @Transactional
    public void update(int id, Geotag geotag) {
        geotag.setId(id);
        geotagRepository.save(geotag);
    }

    //для создания полноценного пользователя
    private void enrichGeotag(Geotag geotag) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        geotag.setCreatedAt(LocalDateTime.now());
        geotag.setRating(0);
        Person person = peopleService.findOne(username);
        geotag.setOwner(person); // установить корректный объект, а не id = 0
    }
}
