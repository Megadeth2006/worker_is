package itmo.is.lab1.dto;

import itmo.is.lab1.model.Color;
import itmo.is.lab1.model.Country;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

public class PersonRequest {
    @NotNull(message = "Цвет глаз обязателен")
    private Color eyeColor;

    private Color hairColor;

    @NotNull(message = "Локация (locationId) обязательна")
    private Long locationId;

    @NotNull(message = "Вес обязателен")
    @Positive(message = "Вес должен быть больше 0")
    private Double weight;

    private Country nationality;

    public Color getEyeColor() { return eyeColor; }
    public void setEyeColor(Color eyeColor) { this.eyeColor = eyeColor; }
    public Color getHairColor() { return hairColor; }
    public void setHairColor(Color hairColor) { this.hairColor = hairColor; }
    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    public Country getNationality() { return nationality; }
    public void setNationality(Country nationality) { this.nationality = nationality; }
}