package ru.saltis.PhotoSpots.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.dto.PhotoDTO;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.models.Photo;
import ru.saltis.PhotoSpots.repositories.PhotoRepository;
import ru.saltis.PhotoSpots.util.GeotagNotFoundException;
import ru.saltis.PhotoSpots.util.PhotoNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final PeopleService peopleService;

    public PhotoService(PhotoRepository photoRepository, PeopleService peopleService) {
        this.photoRepository = photoRepository;
        this.peopleService = peopleService;
    }


    public List<Photo> findAll() {
        return photoRepository.findAll();
    }

    public List<Photo> findAllByPersonId(int id) {
        return photoRepository.findAllByOwner_Id(id);
    }

    public List<Photo> findAllByGeotagId(int id) {
        return photoRepository.findAllByGeotag_Id(id);
    }

    public Photo findById(int id) {
        return photoRepository.findById(id).orElse(null);
    }

    public Photo findOne(int id) {
        Optional<Photo> foundPhoto = photoRepository.findById(id);
        return foundPhoto.orElseThrow(() -> new PhotoNotFoundException("Geotag not found"));
    }

    @Transactional //помечаем потому что не читаем а пишем в бд
    public void save(Photo photo) {
        enrichPhoto(photo);
        photoRepository.save(photo);
    }

    @Transactional
    public void delete(int id) {
        photoRepository.deleteById(id);
    }

    @Transactional
    public void update(int id, Photo photo) {
        photo.setId(id);
        photoRepository.save(photo);
    }

    private void enrichPhoto(Photo photo) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        photo.setUploadedAt(LocalDateTime.now());
        Person person = peopleService.findOne(username);
        photo.setOwner(person);
    }
}
