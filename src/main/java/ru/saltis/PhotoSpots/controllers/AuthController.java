package ru.saltis.PhotoSpots.controllers;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import ru.saltis.PhotoSpots.dto.AuthentificationDTO;
import ru.saltis.PhotoSpots.dto.PersonDTO;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.security.JWTUtil;
import ru.saltis.PhotoSpots.services.RegistrationService;
import ru.saltis.PhotoSpots.util.PersonValidator;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final PersonValidator personValidator;
    private final ModelMapper modelMapper;
    private final JWTUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthController(RegistrationService registrationService, PersonValidator personValidator, ModelMapper modelMapper, JWTUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.registrationService = registrationService;
        this.personValidator = personValidator;
        this.modelMapper = modelMapper;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    @PostMapping("/registration")
    public Map<String, String> performRegistration(@RequestBody @Valid PersonDTO personDTO,
                                                   BindingResult bindingResult){
        Person person = convertToPerson(personDTO);

        personValidator.validate(person, bindingResult);

        //if(bindingResult.hasErrors()) return Map.of("message", "Ошибка в AUTH контроллере перформ"); //здесь по хорошему надо ловить ошибку через EXcHandler и выкидывать JSON
        if (bindingResult.hasErrors()) {
            bindingResult.getFieldErrors().forEach(error -> {
                System.out.println(error.getField() + ": " + error.getDefaultMessage());
            });
            return Map.of("message", "Ошибка в AUTH контроллере перформ");
        }
        registrationService.register(person);

        String token = jwtUtil.generateToken(person.getUsername());
        return Map.of("jwt-token", token);
    }

    @PostMapping("/login")
    public Map<String, String> performLogin(@RequestBody AuthentificationDTO authentificationDTO){
        UsernamePasswordAuthenticationToken authInputToken =
                new UsernamePasswordAuthenticationToken(authentificationDTO.getUsername(),
                        authentificationDTO.getPassword());
        try {
            authenticationManager.authenticate(authInputToken);
        } catch (BadCredentialsException e){
            return Map.of("message", "Incorrect username or password! (credentials)");
        }

        String token = jwtUtil.generateToken(authentificationDTO.getUsername());
        return Map.of("jwt-token", token);
    }

    public Person convertToPerson(PersonDTO personDTO){
        return modelMapper.map(personDTO, Person.class);
    }

}
