package ru.saltis.PhotoSpots.services;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.repositories.PeopleRepository;
import ru.saltis.PhotoSpots.security.PersonDetails;

import java.util.Optional;

@Service
public class PersonDetailsService implements UserDetailsService{

    private final PeopleRepository peopleRepository;

    public PersonDetailsService(PeopleRepository peopleRepository) {
        this.peopleRepository = peopleRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<Person> person =  peopleRepository.findByUsername(username);
        if(person.isEmpty()) throw new UsernameNotFoundException("User  " + username + " not found! \n");

        return new PersonDetails(person.get());
    }
}
