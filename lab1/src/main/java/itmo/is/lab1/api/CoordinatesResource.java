package itmo.is.lab1.api;

import itmo.is.lab1.dto.CoordinatesRequest;
import itmo.is.lab1.model.Coordinates;
import itmo.is.lab1.service.AuxiliaryService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.validation.Valid;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("/coordinates")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CoordinatesResource {
    @Inject private AuxiliaryService service;

    @GET public List<Coordinates> list() { return service.getAllCoordinates(); }
    @GET @Path("/{id}") public Coordinates get(@PathParam("id") Long id) { return service.getCoordinates(id); }

    @POST public Response create(@Valid CoordinatesRequest req) {
        Coordinates created = service.createCoordinates(req);
        UpdatesWebSocket.broadcast("aux");
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
    @PUT @Path("/{id}") public Coordinates update(@PathParam("id") Long id, @Valid CoordinatesRequest req) {
        Coordinates updated = service.updateCoordinates(id, req);
        UpdatesWebSocket.broadcast("aux");
        return updated;
    }
    @DELETE @Path("/{id}") public Response delete(@PathParam("id") Long id) {
        service.deleteCoordinates(id);
        UpdatesWebSocket.broadcast("aux");
        return Response.noContent().build();
    }
}