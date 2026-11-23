package itmo.is.lab1.api;

import itmo.is.lab1.dto.PageResponse;
import itmo.is.lab1.dto.WorkerRequest;
import itmo.is.lab1.model.Worker;
import itmo.is.lab1.service.WorkerService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.validation.Valid;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

@Path("/workers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkerResource {

    @Inject
    private WorkerService workerService;

    @GET
    public PageResponse<Worker> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("sortBy") @DefaultValue("id") String sortBy,
            @QueryParam("sortDir") @DefaultValue("asc") String sortDir,
            @QueryParam("name") String name,
            @QueryParam("position") String position,
            @QueryParam("status") String status,
            @QueryParam("orgName") String orgName,
            @QueryParam("orgType") String orgType,
            @QueryParam("zipCode") String zipCode,
            @QueryParam("townName") String townName,
            @QueryParam("eyeColor") String eyeColor,
            @QueryParam("hairColor") String hairColor,
            @QueryParam("nationality") String nationality,
            @QueryParam("personLocation") String personLocation) {

        Map<String, String> filters = new HashMap<>();
        filters.put("name", name);
        filters.put("position", position);
        filters.put("status", status);
        filters.put("orgName", orgName);
        filters.put("orgType", orgType);
        filters.put("zipCode", zipCode);
        filters.put("townName", townName);
        filters.put("eyeColor", eyeColor);
        filters.put("hairColor", hairColor);
        filters.put("nationality", nationality);
        filters.put("personLocation", personLocation);

        return workerService.getWorkers(page, size, sortBy, sortDir, filters);
    }

    @GET
    @Path("/{id}")
    public Worker getById(@PathParam("id") Long id) {
        return workerService.getWorkerById(id);
    }

    @POST
    public Response create(@Valid WorkerRequest req) {
        Worker created = workerService.createWorker(req);
        UpdatesWebSocket.broadcast("workers");
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public Worker update(@PathParam("id") Long id, @Valid WorkerRequest req) {
        Worker updated = workerService.updateWorker(id, req);
        UpdatesWebSocket.broadcast("workers");
        return updated;
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        workerService.deleteWorker(id);
        UpdatesWebSocket.broadcast("workers");
        return Response.noContent().build();
    }
}