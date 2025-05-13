package ru.saltis.PhotoSpots.services;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltis.PhotoSpots.dto.PersonDTO;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.repositories.PeopleRepository;
import ru.saltis.PhotoSpots.util.PersonNotFoundException;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PeopleService {

    private final PeopleRepository peopleRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public PeopleService(PeopleRepository peopleRepository, ModelMapper modelMapper) {
        this.peopleRepository = peopleRepository;
        this.modelMapper = modelMapper;
    }

    public List<Person> findAll() {
        return peopleRepository.findAll();
    }

    public Person findByUsername(String username) {
        return peopleRepository.findByUsername(username).orElseThrow(PersonNotFoundException::new);
    }
    public Person findOne(int id) {
        Optional<Person> foundPerson =  peopleRepository.findById(id);
        return foundPerson.orElseThrow(PersonNotFoundException::new);
    }

    public Person findOne(String username) {
        Optional<Person> foundPerson =  peopleRepository.findByUsername(username);
        System.out.println(username + " " + foundPerson.isPresent());
        return foundPerson.orElseThrow(PersonNotFoundException::new);
    }

    @Transactional //помечаем потому что не читаем а пишем в бд
    public void save(Person person) {
        enrichPerson(person);
        peopleRepository.save(person);
    }

    @Transactional
    public void delete(int id) {
        peopleRepository.deleteById(id);
    }

    @Transactional
    public void update(int id, Person person) {
        person.setId(id);
        peopleRepository.save(person);
    }

    //для создания полноценного пользователя
    private void enrichPerson(Person person) {
        person.setDescription("");
        person.setCreatedAt(LocalDate.now());
        person.setRole("ROLE_USER");
        person.setIsBlocked(false);
    }
    public PersonDTO converToPersonDTO(Person person) {
        return modelMapper.map(person, PersonDTO.class);
    }

    public Person convertToPerson(@Valid PersonDTO personDTO) {
        return modelMapper.map(personDTO, Person.class);
    }
}

