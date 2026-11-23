package itmo.is.lab1.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class LocationRequest {
    @NotNull(message = "Координата X обязательна")
    private Long x;

    @NotNull(message = "Координата Y обязательна")
    private Float y;

    @NotNull(message = "Координата Z обязательна")
    private Float z;

    @NotNull(message = "Название локации не может быть null")
    @NotBlank(message = "Название локации не может быть пустым")
    private String name;

    public Long getX() { return x; }
    public void setX(Long x) { this.x = x; }
    public Float getY() { return y; }
    public void setY(Float y) { this.y = y; }
    public Float getZ() { return z; }
    public void setZ(Float z) { this.z = z; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}