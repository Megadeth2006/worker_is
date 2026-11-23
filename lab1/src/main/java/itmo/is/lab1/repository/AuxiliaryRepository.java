package itmo.is.lab1.repository;

import itmo.is.lab1.model.*;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.List;

@Stateless
public class AuxiliaryRepository {

    @PersistenceContext(unitName = "WorkerPU")
    private EntityManager em;


    public List<Location> findAllLocations() {
        return em.createQuery("SELECT l FROM Location l ORDER BY l.id DESC", Location.class).getResultList();
    }
    public Location findLocation(Long id) { return em.find(Location.class, id); }
    public Location saveLocation(Location l) { em.persist(l); return l; }
    public Location updateLocation(Location l) { return em.merge(l); }
    public void deleteLocation(Location l) { em.remove(em.contains(l) ? l : em.merge(l)); }
    public long countAddressesByLocation(Long locId) {
        return em.createQuery("SELECT COUNT(a) FROM Address a WHERE a.town.id = :id", Long.class)
                .setParameter("id", locId).getSingleResult();
    }
    public long countPersonsByLocation(Long locId) {
        return em.createQuery("SELECT COUNT(p) FROM Person p WHERE p.location.id = :id", Long.class)
                .setParameter("id", locId).getSingleResult();
    }


    public List<Address> findAllAddresses() {
        return em.createQuery("SELECT a FROM Address a ORDER BY a.id DESC", Address.class).getResultList();
    }
    public Address findAddress(Long id) { return em.find(Address.class, id); }
    public Address saveAddress(Address a) { em.persist(a); return a; }
    public Address updateAddress(Address a) { return em.merge(a); }
    public void deleteAddress(Address a) { em.remove(em.contains(a) ? a : em.merge(a)); }
    public long countOrganizationsByAddress(Long addrId) {
        return em.createQuery(
                        "SELECT COUNT(o) FROM Organization o WHERE o.officialAddress.id = :id OR o.postalAddress.id = :id", Long.class)
                .setParameter("id", addrId).getSingleResult();
    }


    public List<Coordinates> findAllCoordinates() {
        return em.createQuery("SELECT c FROM Coordinates c ORDER BY c.id DESC", Coordinates.class).getResultList();
    }
    public Coordinates findCoordinates(Long id) { return em.find(Coordinates.class, id); }
    public Coordinates saveCoordinates(Coordinates c) { em.persist(c); return c; }
    public Coordinates updateCoordinates(Coordinates c) { return em.merge(c); }
    public void deleteCoordinates(Coordinates c) { em.remove(em.contains(c) ? c : em.merge(c)); }
    public long countWorkersByCoordinates(Long coordId) {
        return em.createQuery("SELECT COUNT(w) FROM Worker w WHERE w.coordinates.id = :id", Long.class)
                .setParameter("id", coordId).getSingleResult();
    }


    public List<Organization> findAllOrganizations() {
        return em.createQuery("SELECT o FROM Organization o ORDER BY o.id DESC", Organization.class).getResultList();
    }
    public Organization findOrganization(Long id) { return em.find(Organization.class, id); }
    public Organization saveOrganization(Organization o) { em.persist(o); return o; }
    public Organization updateOrganization(Organization o) { return em.merge(o); }
    public void deleteOrganization(Organization o) { em.remove(em.contains(o) ? o : em.merge(o)); }
    public long countWorkersByOrganization(Long orgId) {
        return em.createQuery("SELECT COUNT(w) FROM Worker w WHERE w.organization.id = :id", Long.class)
                .setParameter("id", orgId).getSingleResult();
    }


    public List<Person> findAllPersons() {
        return em.createQuery("SELECT p FROM Person p ORDER BY p.id DESC", Person.class).getResultList();
    }
    public Person findPerson(Long id) { return em.find(Person.class, id); }
    public Person savePerson(Person p) { em.persist(p); return p; }
    public Person updatePerson(Person p) { return em.merge(p); }
    public void deletePerson(Person p) { em.remove(em.contains(p) ? p : em.merge(p)); }
    public long countWorkersByPerson(Long personId) {
        return em.createQuery("SELECT COUNT(w) FROM Worker w WHERE w.person.id = :id", Long.class)
                .setParameter("id", personId).getSingleResult();
    }
}