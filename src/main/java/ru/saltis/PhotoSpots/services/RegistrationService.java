package ru.saltis.PhotoSpots.services;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.dto.PersonDTO;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.repositories.PeopleRepository;

@Service
public class RegistrationService {
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final PeopleService peopleService;

    @Autowired
    public RegistrationService(PasswordEncoder passwordEncoder, ModelMapper modelMapper, PeopleService peopleService) {
        this.passwordEncoder = passwordEncoder;
        this.modelMapper = modelMapper;
        this.peopleService = peopleService;
    }

    @Transactional
    public void register(Person person){
        person.setPassword(passwordEncoder.encode(person.getPassword()));
        person.setRole("ROLE_USER");
        peopleService.save(person);
    }

    public PersonDTO converToPersonDTO(Person person) {
        return modelMapper.map(person, PersonDTO.class);
    }

    public Person convertToPerson(@Valid PersonDTO personDTO) {
        return modelMapper.map(personDTO, Person.class);
    }
}
