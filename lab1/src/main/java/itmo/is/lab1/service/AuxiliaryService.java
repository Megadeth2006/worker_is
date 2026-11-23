package itmo.is.lab1.service;

import itmo.is.lab1.dto.*;
import itmo.is.lab1.exception.AppException;
import itmo.is.lab1.model.*;
import itmo.is.lab1.repository.AuxiliaryRepository;

import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.core.Response.Status;
import java.util.List;

@Stateless
public class AuxiliaryService {

    @Inject
    private AuxiliaryRepository repo;


    public List<Location> getAllLocations() { return repo.findAllLocations(); }
    public Location getLocation(Long id) {
        Location l = repo.findLocation(id);
        if (l == null) throw new AppException(Status.NOT_FOUND, "Локация с ID " + id + " не найдена");
        return l;
    }
    public Location createLocation(LocationRequest req) {
        Location l = new Location();
        applyLocation(l, req);
        return repo.saveLocation(l);
    }
    public Location updateLocation(Long id, LocationRequest req) {
        Location l = getLocation(id);
        applyLocation(l, req);
        return repo.updateLocation(l);
    }
    public void deleteLocation(Long id) {
        Location l = getLocation(id);
        long addrCnt = repo.countAddressesByLocation(id);
        long persCnt = repo.countPersonsByLocation(id);
        if (addrCnt > 0 || persCnt > 0) {
            throw new AppException(Status.CONFLICT,
                    "Невозможно удалить локацию: она используется в адресах (" + addrCnt + ") и/или персонах (" + persCnt + ")");
        }
        repo.deleteLocation(l);
    }
    private void applyLocation(Location l, LocationRequest req) {
        l.setX(req.getX());
        l.setY(req.getY());
        l.setZ(req.getZ());
        l.setName(req.getName().trim());
    }


    public List<Address> getAllAddresses() { return repo.findAllAddresses(); }
    public Address getAddress(Long id) {
        Address a = repo.findAddress(id);
        if (a == null) throw new AppException(Status.NOT_FOUND, "Адрес с ID " + id + " не найден");
        return a;
    }
    public Address createAddress(AddressRequest req) {
        Address a = new Address();
        applyAddress(a, req);
        return repo.saveAddress(a);
    }
    public Address updateAddress(Long id, AddressRequest req) {
        Address a = getAddress(id);
        applyAddress(a, req);
        return repo.updateAddress(a);
    }
    public void deleteAddress(Long id) {
        Address a = getAddress(id);
        long orgCnt = repo.countOrganizationsByAddress(id);
        if (orgCnt > 0) {
            throw new AppException(Status.CONFLICT,
                    "Невозможно удалить адрес: на него ссылаются организации (" + orgCnt + ")");
        }
        repo.deleteAddress(a);
    }
    private void applyAddress(Address a, AddressRequest req) {
        a.setZipCode(req.getZipCode());
        a.setTown(getLocation(req.getTownId()));
    }


    public List<Coordinates> getAllCoordinates() { return repo.findAllCoordinates(); }
    public Coordinates getCoordinates(Long id) {
        Coordinates c = repo.findCoordinates(id);
        if (c == null) throw new AppException(Status.NOT_FOUND, "Координаты с ID " + id + " не найдены");
        return c;
    }
    public Coordinates createCoordinates(CoordinatesRequest req) {
        Coordinates c = new Coordinates();
        c.setX(req.getX());
        c.setY(req.getY());
        return repo.saveCoordinates(c);
    }
    public Coordinates updateCoordinates(Long id, CoordinatesRequest req) {
        Coordinates c = getCoordinates(id);
        c.setX(req.getX());
        c.setY(req.getY());
        return repo.updateCoordinates(c);
    }
    public void deleteCoordinates(Long id) {
        Coordinates c = getCoordinates(id);
        long workerCnt = repo.countWorkersByCoordinates(id);
        if (workerCnt > 0) {
            throw new AppException(Status.CONFLICT,
                    "Невозможно удалить координаты: к ним привязаны сотрудники (" + workerCnt + ")");
        }
        repo.deleteCoordinates(c);
    }


    public List<Organization> getAllOrganizations() { return repo.findAllOrganizations(); }
    public Organization getOrganization(Long id) {
        Organization o = repo.findOrganization(id);
        if (o == null) throw new AppException(Status.NOT_FOUND, "Организация с ID " + id + " не найдена");
        return o;
    }
    public Organization createOrganization(OrganizationRequest req) {
        Organization o = new Organization();
        applyOrganization(o, req);
        return repo.saveOrganization(o);
    }
    public Organization updateOrganization(Long id, OrganizationRequest req) {
        Organization o = getOrganization(id);
        applyOrganization(o, req);
        return repo.updateOrganization(o);
    }
    public void deleteOrganization(Long id) {
        Organization o = getOrganization(id);
        long workerCnt = repo.countWorkersByOrganization(id);
        if (workerCnt > 0) {
            throw new AppException(Status.CONFLICT,
                    "Невозможно удалить организацию: в ней числятся сотрудники (" + workerCnt + ")");
        }
        repo.deleteOrganization(o);
    }
    private void applyOrganization(Organization o, OrganizationRequest req) {
        o.setOfficialAddress(getAddress(req.getOfficialAddressId()));
        o.setAnnualTurnover(req.getAnnualTurnover());
        o.setEmployeesCount(req.getEmployeesCount());
        o.setFullName(req.getFullName() != null && !req.getFullName().isBlank() ? req.getFullName().trim() : null);
        o.setType(req.getType());
        o.setPostalAddress(req.getPostalAddressId() != null ? getAddress(req.getPostalAddressId()) : null);
    }


    public List<Person> getAllPersons() { return repo.findAllPersons(); }
    public Person getPerson(Long id) {
        Person p = repo.findPerson(id);
        if (p == null) throw new AppException(Status.NOT_FOUND, "Персона с ID " + id + " не найдена");
        return p;
    }
    public Person createPerson(PersonRequest req) {
        Person p = new Person();
        applyPerson(p, req);
        return repo.savePerson(p);
    }
    public Person updatePerson(Long id, PersonRequest req) {
        Person p = getPerson(id);
        applyPerson(p, req);
        return repo.updatePerson(p);
    }
    public void deletePerson(Long id) {
        Person p = getPerson(id);
        long workerCnt = repo.countWorkersByPerson(id);
        if (workerCnt > 0) {
            throw new AppException(Status.CONFLICT,
                    "Невозможно удалить персону: с ней связаны сотрудники (" + workerCnt + ")");
        }
        repo.deletePerson(p);
    }
    private void applyPerson(Person p, PersonRequest req) {
        p.setEyeColor(req.getEyeColor());
        p.setHairColor(req.getHairColor());
        p.setLocation(getLocation(req.getLocationId()));
        p.setWeight(req.getWeight());
        p.setNationality(req.getNationality());
    }
}