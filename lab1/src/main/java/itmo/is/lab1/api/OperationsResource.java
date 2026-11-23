package itmo.is.lab1.api;

import itmo.is.lab1.dto.RatingGroupDto;
import itmo.is.lab1.service.WorkerService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Path("/operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OperationsResource {

    @Inject
    private WorkerService workerService;

    @GET
    @Path("/rating-groups")
    public List<RatingGroupDto> getRatingGroups() {
        return workerService.groupByRating();
    }

    @GET
    @Path("/count-by-rating")
    public Map<String, Long> countByRating(@QueryParam("rating") Integer rating) {
        if (rating == null || rating <= 0) {
            throw new BadRequestException("Параметр rating должен быть целым числом > 0");
        }
        return Collections.singletonMap("count", workerService.countByRating(rating));
    }

    @GET
    @Path("/unique-ratings")
    public List<Integer> getUniqueRatings() {
        return workerService.getUniqueRatings();
    }

    @POST
    @Path("/move")
    public Map<String, String> moveWorker(
            @QueryParam("workerId") Long workerId,
            @QueryParam("newOrgId") Long newOrgId) {
        if (workerId == null || newOrgId == null) {
            throw new BadRequestException("Укажите workerId и newOrgId");
        }
        workerService.moveWorker(workerId, newOrgId);
        UpdatesWebSocket.broadcast("workers");
        return Collections.singletonMap("message", "Сотрудник успешно перемещён в новую организацию");
    }

    @POST
    @Path("/index-salary")
    public Map<String, Object> indexSalary(
            @QueryParam("workerId") Long workerId,
            @QueryParam("coeff") Double coeff) {
        if (workerId == null || coeff == null) {
            throw new BadRequestException("Укажите workerId и coeff");
        }
        double newSalary = workerService.indexSalary(workerId, coeff);
        UpdatesWebSocket.broadcast("workers");
        return Map.of("newSalary", newSalary, "message", "Зарплата проиндексирована");
    }
}