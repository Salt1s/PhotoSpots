package ru.saltis.PhotoSpots.util;

public class GeotagNotFoundException extends RuntimeException {
    public GeotagNotFoundException(String string) {
        super(string);
    }
}
