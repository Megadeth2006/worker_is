package itmo.is.lab1.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

@Entity
@Table(name = "location")
public class Location implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private long x;

    @Column(nullable = false)
    private float y;

    @NotNull
    @Column(nullable = false)
    private Float z;

    @NotNull
    @NotBlank
    @Column(nullable = false)
    private String name;

    public Location() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public long getX() { return x; }
    public void setX(long x) { this.x = x; }
    public float getY() { return y; }
    public void setY(float y) { this.y = y; }
    public Float getZ() { return z; }
    public void setZ(Float z) { this.z = z; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}