package ru.saltis.PhotoSpots.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.models.Comment;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.models.Review;
import ru.saltis.PhotoSpots.repositories.CommentRepository;
import ru.saltis.PhotoSpots.repositories.ReviewRepository;
import ru.saltis.PhotoSpots.util.CommentNotFoundException;
import ru.saltis.PhotoSpots.util.ReviewNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final PeopleService peopleService;

    public ReviewService(ReviewRepository reviewRepository, PeopleService peopleService) {
        this.reviewRepository = reviewRepository;
        this.peopleService = peopleService;
    }


    public List<Review> findAll() {
        return reviewRepository.findAll();
    }

    public List<Review> findAllByPersonId(int id) {
        return reviewRepository.findAllByOwner_Id(id);
    }

    public List<Review> findAllByGeotagId(int id) {
        return reviewRepository.findAllByGeotag_Id(id);
    }

    public Review findOne(int id) {
        Optional<Review> foundReview =  reviewRepository.findById(id);
        return foundReview.orElseThrow(() -> new ReviewNotFoundException("Review not found"));
    }

    @Transactional //помечаем потому что не читаем а пишем в бд
    public void save(Review review) {
        enrichReview(review);
        reviewRepository.save(review);
    }

    @Transactional
    public void delete(int id) {
        reviewRepository.deleteById(id);
    }

    @Transactional
    public void update(int id, Review review) {
        review.setId(id);
        reviewRepository.save(review);
    }

    //для создания полноценного
    private void enrichReview(Review review) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        review.setCreatedAt(LocalDateTime.now());
        Person person = peopleService.findOne(username);
        review.setOwner(person);
    }
}
