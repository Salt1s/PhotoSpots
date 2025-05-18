package ru.saltis.PhotoSpots.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.repositories.PeopleRepository;

@Service
public class AdminService {

    private final PeopleRepository peopleRepository;
    private final PhotoService photoService;
    private final CommentService commentService;
    private final ReviewService reviewService;

    @Autowired
    public AdminService(PeopleRepository peopleRepository, PhotoService photoService, CommentService commentService, ReviewService reviewService) {
        this.peopleRepository = peopleRepository;
        this.photoService = photoService;
        this.commentService = commentService;
        this.reviewService = reviewService;
    }

    @Transactional
    public void delete(int id) {
        peopleRepository.deleteById(id);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void saveBlocked(Person person) {
        peopleRepository.save(person);
    }


}
