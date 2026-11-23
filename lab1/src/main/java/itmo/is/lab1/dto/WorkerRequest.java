package itmo.is.lab1.dto;

import itmo.is.lab1.model.Position;
import itmo.is.lab1.model.Status;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

public class WorkerRequest {
    @NotNull(message = "Имя сотрудника не может быть null")
    @NotBlank(message = "Имя сотрудника не может быть пустым")
    private String name;

    @NotNull(message = "Координаты (coordinatesId) обязательны")
    private Long coordinatesId;

    @NotNull(message = "Организация (organizationId) обязательна")
    private Long organizationId;

    @NotNull(message = "Зарплата обязательна")
    @Positive(message = "Зарплата должна быть больше 0")
    private Double salary;

    @NotNull(message = "Рейтинг обязателен")
    @Positive(message = "Рейтинг должен быть больше 0")
    private Integer rating;

    @NotNull(message = "Должность обязательна")
    private Position position;

    private Status status;

    @NotNull(message = "Персона (personId) обязательна")
    private Long personId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getCoordinatesId() { return coordinatesId; }
    public void setCoordinatesId(Long coordinatesId) { this.coordinatesId = coordinatesId; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Position getPosition() { return position; }
    public void setPosition(Position position) { this.position = position; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
}