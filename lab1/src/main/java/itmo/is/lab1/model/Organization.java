package itmo.is.lab1.model;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.io.Serializable;

@Entity
@Table(name = "organization")
public class Organization implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "official_address_id", nullable = false)
    private Address officialAddress;

    @NotNull
    @Positive
    @Column(name = "annual_turnover", nullable = false)
    private Double annualTurnover;

    @Positive
    @Column(name = "employees_count", nullable = false)
    private long employeesCount;

    @Column(name = "full_name")
    private String fullName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationType type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "postal_address_id")
    private Address postalAddress;

    public Organization() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Address getOfficialAddress() { return officialAddress; }
    public void setOfficialAddress(Address officialAddress) { this.officialAddress = officialAddress; }
    public Double getAnnualTurnover() { return annualTurnover; }
    public void setAnnualTurnover(Double annualTurnover) { this.annualTurnover = annualTurnover; }
    public long getEmployeesCount() { return employeesCount; }
    public void setEmployeesCount(long employeesCount) { this.employeesCount = employeesCount; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public OrganizationType getType() { return type; }
    public void setType(OrganizationType type) { this.type = type; }
    public Address getPostalAddress() { return postalAddress; }
    public void setPostalAddress(Address postalAddress) { this.postalAddress = postalAddress; }
}