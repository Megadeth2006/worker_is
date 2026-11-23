package itmo.is.lab1.repository;

import itmo.is.lab1.dto.PageResponse;
import itmo.is.lab1.dto.RatingGroupDto;
import itmo.is.lab1.model.*;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Stateless
public class WorkerRepository {

    @PersistenceContext(unitName = "WorkerPU")
    private EntityManager em;

    public Worker findById(Long id) {
        return em.find(Worker.class, id);
    }

    public Worker save(Worker worker) {
        em.persist(worker);
        return worker;
    }

    public Worker update(Worker worker) {
        return em.merge(worker);
    }

    public void delete(Worker worker) {
        em.remove(em.contains(worker) ? worker : em.merge(worker));
    }

    public PageResponse<Worker> findAll(int page, int size, String sortBy, String sortDir, Map<String, String> filters) {
        CriteriaBuilder cb = em.getCriteriaBuilder();

        CriteriaQuery<Worker> dataQuery = cb.createQuery(Worker.class);
        Root<Worker> root = dataQuery.from(Worker.class);
        Join<Worker, Organization> org = root.join("organization", JoinType.INNER);
        Join<Organization, Address> addr = org.join("officialAddress", JoinType.INNER);
        Join<Address, Location> orgTown = addr.join("town", JoinType.INNER);
        Join<Worker, Person> person = root.join("person", JoinType.INNER);
        Join<Person, Location> pLoc = person.join("location", JoinType.INNER);

        List<Predicate> predicates = buildPredicates(cb, root, org, addr, orgTown, person, pLoc, filters);
        if (!predicates.isEmpty()) {
            dataQuery.where(predicates.toArray(new Predicate[0]));
        }

        Expression<?> sortExpr = resolveSortExpression(root, org, addr, orgTown, person, pLoc, sortBy);
        dataQuery.orderBy("desc".equalsIgnoreCase(sortDir) ? cb.desc(sortExpr) : cb.asc(sortExpr));

        List<Worker> content = em.createQuery(dataQuery)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();


        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Worker> cRoot = countQuery.from(Worker.class);
        Join<Worker, Organization> cOrg = cRoot.join("organization", JoinType.INNER);
        Join<Organization, Address> cAddr = cOrg.join("officialAddress", JoinType.INNER);
        Join<Address, Location> cOrgTown = cAddr.join("town", JoinType.INNER);
        Join<Worker, Person> cPerson = cRoot.join("person", JoinType.INNER);
        Join<Person, Location> cPLoc = cPerson.join("location", JoinType.INNER);

        List<Predicate> countPredicates = buildPredicates(cb, cRoot, cOrg, cAddr, cOrgTown, cPerson, cPLoc, filters);
        countQuery.select(cb.count(cRoot));
        if (!countPredicates.isEmpty()) {
            countQuery.where(countPredicates.toArray(new Predicate[0]));
        }
        long total = em.createQuery(countQuery).getSingleResult();

        return new PageResponse<>(content, page, size, total);
    }

    private List<Predicate> buildPredicates(
            CriteriaBuilder cb,
            Root<Worker> root,
            Join<Worker, Organization> org,
            Join<Organization, Address> addr,
            Join<Address, Location> orgTown,
            Join<Worker, Person> person,
            Join<Person, Location> pLoc,
            Map<String, String> filters) {

        List<Predicate> list = new ArrayList<>();
        if (filters == null) return list;

        addLike(cb, list, root.get("name"), filters.get("name"));
        addLike(cb, list, root.get("position").as(String.class), filters.get("position"));
        addLike(cb, list, root.get("status").as(String.class), filters.get("status"));
        addLike(cb, list, org.get("fullName"), filters.get("orgName"));
        addLike(cb, list, org.get("type").as(String.class), filters.get("orgType"));
        addLike(cb, list, addr.get("zipCode"), filters.get("zipCode"));
        addLike(cb, list, orgTown.get("name"), filters.get("townName"));
        addLike(cb, list, person.get("eyeColor").as(String.class), filters.get("eyeColor"));
        addLike(cb, list, person.get("hairColor").as(String.class), filters.get("hairColor"));
        addLike(cb, list, person.get("nationality").as(String.class), filters.get("nationality"));
        addLike(cb, list, pLoc.get("name"), filters.get("personLocation"));

        return list;
    }

    private void addLike(CriteriaBuilder cb, List<Predicate> list, Expression<String> path, String value) {
        if (value != null && !value.trim().isEmpty()) {
            String pattern = "%" + value.trim().toLowerCase() + "%";
            list.add(cb.like(cb.lower(path), pattern));
        }
    }

    private Expression<?> resolveSortExpression(
            Root<Worker> root,
            Join<Worker, Organization> org,
            Join<Organization, Address> addr,
            Join<Address, Location> orgTown,
            Join<Worker, Person> person,
            Join<Person, Location> pLoc,
            String sortBy) {

        if (sortBy == null) return root.get("id");
        switch (sortBy) {
            case "name": return root.get("name");
            case "creationDate": return root.get("creationDate");
            case "salary": return root.get("salary");
            case "rating": return root.get("rating");
            case "position": return root.get("position");
            case "status": return root.get("status");
            case "orgName": return org.get("fullName");
            case "orgType": return org.get("type");
            case "zipCode": return addr.get("zipCode");
            case "townName": return orgTown.get("name");
            case "eyeColor": return person.get("eyeColor");
            case "hairColor": return person.get("hairColor");
            case "nationality": return person.get("nationality");
            case "personLocation": return pLoc.get("name");
            default: return root.get("id");
        }
    }

    // вызовы 5 pgsql функций бд

    @SuppressWarnings("unchecked")
    public List<RatingGroupDto> groupByRating() {
        List<Object[]> rows = em.createNativeQuery("SELECT rating, cnt FROM group_workers_by_rating()")
                .getResultList();
        List<RatingGroupDto> res = new ArrayList<>();
        for (Object[] r : rows) {
            res.add(new RatingGroupDto(((Number) r[0]).intValue(), ((Number) r[1]).longValue()));
        }
        return res;
    }

    public long countByRating(int rating) {
        Object res = em.createNativeQuery("SELECT count_workers_by_rating(:rating)")
                .setParameter("rating", rating)
                .getSingleResult();
        return ((Number) res).longValue();
    }

    @SuppressWarnings("unchecked")
    public List<Integer> getUniqueRatings() {
        List<Object> rows = em.createNativeQuery("SELECT unnest(get_unique_ratings())").getResultList();
        List<Integer> res = new ArrayList<>();
        for (Object r : rows) {
            res.add(((Number) r).intValue());
        }
        return res;
    }

    public void moveWorkerToOrganization(long workerId, long newOrgId) {
        em.createNativeQuery("SELECT move_worker_to_organization(:wId, :oId)")
                .setParameter("wId", workerId)
                .setParameter("oId", newOrgId)
                .getSingleResult();
        clearCache();
    }

    public double indexWorkerSalary(long workerId, double coeff) {
        Object res = em.createNativeQuery("SELECT index_worker_salary(:wId, :coeff)")
                .setParameter("wId", workerId)
                .setParameter("coeff", coeff)
                .getSingleResult();
        clearCache();
        return ((Number) res).doubleValue();
    }

    private void clearCache() {
        em.flush();
        em.clear();
        em.getEntityManagerFactory().getCache().evictAll();
    }
}