package ru.saltis.PhotoSpots.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import ru.saltis.PhotoSpots.models.Person;

import java.util.Collection;
import java.util.Collections;

public class PersonDetails implements UserDetails {

    private final Person person;

    public PersonDetails(Person person) {
        this.person = person;
    }

    //коллекция прав которые есть у пользователя
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Возвращаются роли или действия
        return Collections.singletonList(new SimpleGrantedAuthority(person.getRole()));
    }

    @Override
    public String getPassword() {
        return this.person.getPassword();
    }

    //можеть быть имейлом и именем чем угодно в модели
    @Override
    public String getUsername() {
        return this.person.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
        //return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return !person.getIsBlocked();
        //return UserDetails.super.isAccountNonLocked();
    }

    //пароль не просрочен
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
        //return UserDetails.super.isCredentialsNonExpired();
    }

    //аккаунт активен
    @Override
    public boolean isEnabled() {
        return true;
        //return UserDetails.super.isEnabled();
    }
    //нуже для получения данных аутентифицированного пользователя
    public Person getPerson() {
        return this.person;
    }
}
