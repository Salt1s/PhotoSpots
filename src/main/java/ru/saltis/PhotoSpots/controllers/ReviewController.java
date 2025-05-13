package ru.saltis.PhotoSpots.controllers;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import ru.saltis.PhotoSpots.dto.CommentDTO;
import ru.saltis.PhotoSpots.dto.ReviewDTO;
import ru.saltis.PhotoSpots.models.Comment;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Photo;
import ru.saltis.PhotoSpots.models.Review;
import ru.saltis.PhotoSpots.services.CommentService;
import ru.saltis.PhotoSpots.services.GeotagService;
import ru.saltis.PhotoSpots.services.PhotoService;
import ru.saltis.PhotoSpots.services.ReviewService;
import ru.saltis.PhotoSpots.util.CommentNotFoundException;
import ru.saltis.PhotoSpots.util.PersonErrorResponse;
import ru.saltis.PhotoSpots.util.ReviewNotFoundException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/map/{geotagId}/reviews")
public class ReviewController {
    private final ReviewService reviewService;
    private final ModelMapper modelMapper;
    private final GeotagService geotagService;

    public ReviewController(ReviewService reviewService, ModelMapper modelMapper, GeotagService geotagService) {
        this.reviewService = reviewService;
        this.modelMapper = modelMapper;
        this.geotagService = geotagService;
    }


    @GetMapping()
    public List<ReviewDTO> getReviewGeotag(@PathVariable("geotagId") int id) {
        return reviewService.findAllByGeotagId(id).stream().map(this::converToReviewDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ReviewDTO getReview(@PathVariable("id") int id) {
        return converToReviewDTO(reviewService.findOne(id));
    }

    @PostMapping()
    public ResponseEntity<Review> create(@PathVariable("geotagId") int geoId,
                                         @RequestBody @Valid ReviewDTO reviewDTO,
                                         BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            StringBuilder errorMSG = new StringBuilder();
            List<FieldError> errors = bindingResult.getFieldErrors();
            for (FieldError error : errors) {
                errorMSG.append(error.getField()).append(" - ").append(error.getDefaultMessage()).append(";").append("\n");
            }
            throw new CommentNotFoundException(errorMSG.toString());
        }
        Geotag geotag = geotagService.findOne(geoId);
        Review review = converToReview(reviewDTO);
        review.setGeotag(geotag);
        reviewService.save(review);
        updateGeotagMark(geoId, geotag);
        //
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id,
                                    @RequestBody @Valid ReviewDTO reviewDTO,
                                    BindingResult bindingResult) {
        // Проверка на ошибки валидации
        if (bindingResult.hasErrors()) {
            StringBuilder errorMSG = new StringBuilder();
            List<FieldError> errors = bindingResult.getFieldErrors();
            // Собираем ошибки и возвращаем их
            for (FieldError error : errors) {
                errorMSG.append(error.getField()).append(" - ").append(error.getDefaultMessage()).append("; ").append("\n");
            }
            // Возвращаем ошибки с кодом 400 Bad Request
            return ResponseEntity.badRequest().body(errorMSG.toString());
        }
        Review reviewOld = reviewService.findOne(id);
        // Преобразуем DTO в сущность
        Review review = converToReview(reviewDTO);
        review.setCreatedAt(reviewOld.getCreatedAt());
        review.setOwner(reviewOld.getOwner());
        review.setGeotag(reviewOld.getGeotag());
        reviewService.update(id, review);
        updateGeotagMark(reviewOld.getGeotag().getId(), reviewOld.getGeotag());
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        Review review = reviewService.findOne(id);
        reviewService.delete(id);
        updateGeotagMark(review.getGeotag().getId(), review.getGeotag());
        return new ResponseEntity<>(HttpStatus.OK);
    }


    @ExceptionHandler(ReviewNotFoundException.class)
    private ResponseEntity<PersonErrorResponse> handleException(ReviewNotFoundException exception) {
        PersonErrorResponse response = new PersonErrorResponse(
                "Review with this ID not found", System.currentTimeMillis()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND); //404
    }
//
//    @ExceptionHandler(PersonNotCreatedException.class)
//    private ResponseEntity<PersonErrorResponse> handleException(PersonNotCreatedException exception) {
//        PersonErrorResponse response = new PersonErrorResponse(
//                exception.getMessage(), System.currentTimeMillis()
//        );
//        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); //400
//    }
    private void updateGeotagMark(int geotagId, Geotag geotag) {
        List<Review> reviews = reviewService.findAllByGeotagId(geotagId);
        float mark = 0;
        int counter = 0;
        for (Review review1 : reviews) {
            if (review1.getMark()>0){
                mark+=review1.getMark();
                counter++;
            }
        }
        geotag.setRating(mark/counter);
        geotagService.update(geotagId, geotag);
    }

    private Review converToReview(ReviewDTO reviewDTO) {
        return modelMapper.map(reviewDTO, Review.class);
    }

    private ReviewDTO converToReviewDTO(Review review) {
        return modelMapper.map(review, ReviewDTO.class);
    }
}
