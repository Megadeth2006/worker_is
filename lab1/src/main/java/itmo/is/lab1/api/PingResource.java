package itmo.is.lab1.api;

import javax.ejb.Stateless; // <-- ДОБАВИТЬ ЭТОТ ИМПОРТ
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

@Stateless
@Path("/ping")
public class PingResource {

    @PersistenceContext(unitName = "WorkerPU")
    private EntityManager em;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response ping() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("variant", 4089);
        result.put("message", "WildFly 21 + Hibernate + PostgreSQL is working!");
        try {
            Object dbTime = em.createNativeQuery("SELECT NOW()").getSingleResult();
            result.put("dbConnected", true);
            result.put("dbTime", dbTime.toString());
        } catch (Exception e) {
            result.put("dbConnected", false);
            result.put("dbError", e.getMessage());
        }
        return Response.ok(result).build();
    }
}