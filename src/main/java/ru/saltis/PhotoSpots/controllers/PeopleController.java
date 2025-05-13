package ru.saltis.PhotoSpots.controllers;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import ru.saltis.PhotoSpots.dto.PersonDTO;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.services.PeopleService;
import ru.saltis.PhotoSpots.util.PersonErrorResponse;
import ru.saltis.PhotoSpots.util.PersonNotCreatedException;
import ru.saltis.PhotoSpots.util.PersonNotFoundException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PeopleController {
    private final PeopleService peopleService;
    private final ModelMapper modelMapper;


    public PeopleController(PeopleService peopleService, ModelMapper modelMapper) {
        this.peopleService = peopleService;
        this.modelMapper = modelMapper;
    }

    @GetMapping()
    public List<PersonDTO> getPeople() {
        return peopleService.findAll().stream().map(this::converToPersonDTO).collect(Collectors.toList()); //здесь автоматически Jackson конвертирует обьекты в JSON
    }

    @GetMapping("/me")
    public PersonDTO getMyProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Person person = peopleService.findByUsername(username);
        return converToPersonDTO(person);
    }

    @GetMapping("/{username}")
    public PersonDTO getPersonByUsername(@PathVariable("username") String username) {
        return converToPersonDTO(peopleService.findByUsername(username));
           }

    @GetMapping("/id/{id}")
    public PersonDTO getPerson(@PathVariable("id") int id) {
        return converToPersonDTO(peopleService.findOne(id));
    }

    @PostMapping()
    public ResponseEntity<Person> create(@RequestBody @Valid PersonDTO personDTO,
                                         BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            StringBuilder errorMSG = new StringBuilder();
            List<FieldError> errors = bindingResult.getFieldErrors();
            for (FieldError error : errors) {
                errorMSG.append(error.getField()).append(" - ").append(error.getDefaultMessage()).append(";").append("\n");
            }
            throw new PersonNotCreatedException(errorMSG.toString());
        }
        peopleService.save(converToPerson(personDTO));
        //
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @PatchMapping("/{username}")
    public ResponseEntity<?> update(@PathVariable String username,
                                    @RequestBody @Valid PersonDTO personDTO,
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
        Person personOld = peopleService.findByUsername(username);
        System.out.println(personOld);
        // Преобразуем DTO в сущность
        Person person = converToPerson(personDTO);
        person.setIsBlocked(personOld.getIsBlocked());
        person.setRole(personOld.getRole());
        person.setCreatedAt(personOld.getCreatedAt());
        System.out.println("pers = " + person);
        peopleService.update(personOld.getId(), person);
        System.out.println("pers = " + person);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/people/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        peopleService.delete(id);
        return ResponseEntity.noContent().build();
    }


    @ExceptionHandler(PersonNotFoundException.class)
    private ResponseEntity<PersonErrorResponse> handleException(PersonNotFoundException exception) {
        PersonErrorResponse response = new PersonErrorResponse(
                "Person with this ID not found", System.currentTimeMillis()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND); //404
    }

    @ExceptionHandler(PersonNotCreatedException.class)
    private ResponseEntity<PersonErrorResponse> handleException(PersonNotCreatedException exception) {
        PersonErrorResponse response = new PersonErrorResponse(
                exception.getMessage(), System.currentTimeMillis()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); //400
    }

    private Person converToPerson(PersonDTO personDTO) {
        return modelMapper.map(personDTO, Person.class);
    }

    private PersonDTO converToPersonDTO(Person person) {
        return modelMapper.map(person, PersonDTO.class);
    }
}
