package itmo.is.lab1.model;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

@Entity
@Table(name = "coordinates")
public class Coordinates implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private float x;

    @NotNull
    @Column(nullable = false)
    private Float y;

    public Coordinates() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public float getX() { return x; }
    public void setX(float x) { this.x = x; }
    public Float getY() { return y; }
    public void setY(Float y) { this.y = y; }
}