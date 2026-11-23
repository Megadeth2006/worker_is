package itmo.is.lab1.dto;

import javax.validation.constraints.NotNull;

public class CoordinatesRequest {
    @NotNull(message = "Координата X обязательна")
    private Float x;

    @NotNull(message = "Координата Y обязательна")
    private Float y;

    public Float getX() { return x; }
    public void setX(Float x) { this.x = x; }
    public Float getY() { return y; }
    public void setY(Float y) { this.y = y; }
}