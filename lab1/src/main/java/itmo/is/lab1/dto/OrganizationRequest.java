package itmo.is.lab1.dto;

import itmo.is.lab1.model.OrganizationType;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

public class OrganizationRequest {
    @NotNull(message = "Официальный адрес (officialAddressId) обязателен")
    private Long officialAddressId;

    @NotNull(message = "Годовой оборот обязателен")
    @Positive(message = "Годовой оборот должен быть больше 0")
    private Double annualTurnover;

    @NotNull(message = "Количество сотрудников обязательно")
    @Positive(message = "Количество сотрудников должно быть больше 0")
    private Long employeesCount;

    private String fullName;

    @NotNull(message = "Тип организации обязателен")
    private OrganizationType type;

    private Long postalAddressId;

    public Long getOfficialAddressId() { return officialAddressId; }
    public void setOfficialAddressId(Long officialAddressId) { this.officialAddressId = officialAddressId; }
    public Double getAnnualTurnover() { return annualTurnover; }
    public void setAnnualTurnover(Double annualTurnover) { this.annualTurnover = annualTurnover; }
    public Long getEmployeesCount() { return employeesCount; }
    public void setEmployeesCount(Long employeesCount) { this.employeesCount = employeesCount; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public OrganizationType getType() { return type; }
    public void setType(OrganizationType type) { this.type = type; }
    public Long getPostalAddressId() { return postalAddressId; }
    public void setPostalAddressId(Long postalAddressId) { this.postalAddressId = postalAddressId; }
}