package ru.saltis.PhotoSpots.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.services.PersonDetailsService;

@Component
public class PersonValidator implements Validator {

    private final PersonDetailsService personDetailsService;

    @Autowired
    public PersonValidator(PersonDetailsService personDetailsService) {
        this.personDetailsService = personDetailsService;
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return Person.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        Person person = (Person) target;

        try {
            personDetailsService.loadUserByUsername(person.getUsername());
        } catch (UsernameNotFoundException ignored) {
            return; //все ок, пользователь не найден! Но лучше создать свой сервис который возвращает Optional и проверять есть ли в нем человек, если есть вернуть ошибку
        }

        errors.rejectValue("username", "", "Человек с таким именем пользователя уже существует");
    }
}
