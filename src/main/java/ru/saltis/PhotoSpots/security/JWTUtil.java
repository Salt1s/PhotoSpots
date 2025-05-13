package ru.saltis.PhotoSpots.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.Date;

@Component
public class JWTUtil {

    @Value("${jwt_secret}")
    private String secret;

    public String generateToken(String username) {
        Date expirationDate = Date.from(ZonedDateTime.now().plusHours(9999999).toInstant());

        return JWT.create() //в токен можно закинуть все что угодно
                .withSubject("User details") //Что хранится в токене
                .withClaim("username", username)//пары ключ значение что содержится в токене
                .withIssuedAt(new Date()) //когда был выдан токен
                .withIssuer("PhotoSpots") //кем выдан токен
                .withExpiresAt(expirationDate) //когда истечет токен
                .sign(Algorithm.HMAC256(secret)); //секрет
    }

    //метод для чтения (валидации) токенов
    public String validateTokenAndRetrieveCalm(String token) throws JWTVerificationException {
        JWTVerifier verifier = JWT.require(Algorithm.HMAC256(secret))
                .withSubject("User details")
                .withIssuer("PhotoSpots")
                .build();

        DecodedJWT jwt = verifier.verify(token);
        return jwt.getClaim("username").asString();
    }

}
