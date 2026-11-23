package itmo.is.lab1.dto;

import javax.validation.constraints.NotNull;

public class AddressRequest {
    @NotNull(message = "Почтовый индекс (zipCode) обязателен")
    private String zipCode;

    @NotNull(message = "Город (townId) обязателен")
    private Long townId;

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }
    public Long getTownId() { return townId; }
    public void setTownId(Long townId) { this.townId = townId; }
}