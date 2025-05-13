package ru.saltis.PhotoSpots.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.models.Comment;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.repositories.CommentRepository;
import ru.saltis.PhotoSpots.util.CommentNotFoundException;
import ru.saltis.PhotoSpots.util.GeotagNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class CommentService {
    private final CommentRepository commentRepository;
    private final PeopleService peopleService;

    public CommentService(CommentRepository commentRepository, PeopleService peopleService) {
        this.commentRepository = commentRepository;
        this.peopleService = peopleService;
    }

    public List<Comment> findAll() {
        return commentRepository.findAll();
    }

    public List<Comment> findAllByPersonId(int id) {
        return commentRepository.findAllByOwner_Id(id);
    }

    public List<Comment> findAllByPhotoId(int id) {
        return commentRepository.findAllByPhoto_Id(id);
    }

    public Comment findOne(int id) {
        Optional<Comment> foundComment =  commentRepository.findById(id);
        return foundComment.orElseThrow(() -> new CommentNotFoundException("Comment not found"));
    }

    @Transactional //помечаем потому что не читаем а пишем в бд
    public void save(Comment comment) {
        enrichComment(comment);
        commentRepository.save(comment);
    }

    @Transactional
    public void delete(int id) {
        commentRepository.deleteById(id);
    }

    @Transactional
    public void update(int id, Comment comment) {
        comment.setId(id);
        commentRepository.save(comment);
    }

    //для создания полноценного пользователя
    private void enrichComment(Comment comment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        comment.setCreatedAt(LocalDateTime.now());
        Person person = peopleService.findOne(username);
        comment.setOwner(person); // установить корректный объект, а не id = 0
    }
}
