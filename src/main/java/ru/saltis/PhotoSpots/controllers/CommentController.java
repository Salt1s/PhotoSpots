package ru.saltis.PhotoSpots.controllers;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import ru.saltis.PhotoSpots.dto.CommentDTO;
import ru.saltis.PhotoSpots.dto.GeotagDTO;
import ru.saltis.PhotoSpots.models.Comment;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Photo;
import ru.saltis.PhotoSpots.services.CommentService;
import ru.saltis.PhotoSpots.services.GeotagService;
import ru.saltis.PhotoSpots.services.PeopleService;
import ru.saltis.PhotoSpots.services.PhotoService;
import ru.saltis.PhotoSpots.util.CommentNotFoundException;
import ru.saltis.PhotoSpots.util.GeotagNotFoundException;
import ru.saltis.PhotoSpots.util.PersonErrorResponse;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos/{PhotoId}/comments")
public class CommentController {
    private final CommentService commentService;
    private final ModelMapper modelMapper;
    private final PhotoService photoService;

    public CommentController(CommentService commentService, ModelMapper modelMapper, PhotoService photoService) {
        this.commentService = commentService;
        this.modelMapper = modelMapper;
        this.photoService = photoService;
    }

    @GetMapping()
    public List<CommentDTO> getCommentPhoto(@PathVariable("PhotoId") int id) {
        return commentService.findAllByPhotoId(id).stream().map(this::converToCommentDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public CommentDTO getComment(@PathVariable("id") int id) {
        return converToCommentDTO(commentService.findOne(id));
    }

    @PostMapping()
    public ResponseEntity<Comment> create(@PathVariable("PhotoId") int phId,
                                         @RequestBody @Valid CommentDTO commentDTO,
                                         BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            StringBuilder errorMSG = new StringBuilder();
            List<FieldError> errors = bindingResult.getFieldErrors();
            for (FieldError error : errors) {
                errorMSG.append(error.getField()).append(" - ").append(error.getDefaultMessage()).append(";").append("\n");
            }
            throw new CommentNotFoundException(errorMSG.toString());
        }
        Photo photo = photoService.findOne(phId);
        Comment comment = converToComment(commentDTO);
        comment.setPhoto(photo);
        commentService.save(comment);
        //
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id,
                                    @RequestBody @Valid CommentDTO commentDTO,
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
        Comment commentOld = commentService.findOne(id);
        // Преобразуем DTO в сущность
        Comment comment = converToComment(commentDTO);
        comment.setCreatedAt(commentOld.getCreatedAt());
        comment.setOwner(commentOld.getOwner());
        comment.setPhoto(commentOld.getPhoto());
        commentService.update(id, comment);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        commentService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }


    @ExceptionHandler(CommentNotFoundException.class)
    private ResponseEntity<PersonErrorResponse> handleException(CommentNotFoundException exception) {
        PersonErrorResponse response = new PersonErrorResponse(
                "Comment with this ID not found", System.currentTimeMillis()
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

    private Comment converToComment(CommentDTO commentDTO) {
        return modelMapper.map(commentDTO, Comment.class);
    }

    private CommentDTO converToCommentDTO(Comment comment) {
        return modelMapper.map(comment, CommentDTO.class);
    }
}
