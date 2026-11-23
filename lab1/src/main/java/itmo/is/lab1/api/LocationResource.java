package itmo.is.lab1.api;

import itmo.is.lab1.dto.LocationRequest;
import itmo.is.lab1.model.Location;
import itmo.is.lab1.service.AuxiliaryService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.validation.Valid;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("/locations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LocationResource {
    @Inject private AuxiliaryService service;

    @GET public List<Location> list() { return service.getAllLocations(); }
    @GET @Path("/{id}") public Location get(@PathParam("id") Long id) { return service.getLocation(id); }

    @POST public Response create(@Valid LocationRequest req) {
        Location created = service.createLocation(req);
        UpdatesWebSocket.broadcast("aux");
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
    @PUT @Path("/{id}") public Location update(@PathParam("id") Long id, @Valid LocationRequest req) {
        Location updated = service.updateLocation(id, req);
        UpdatesWebSocket.broadcast("aux");
        return updated;
    }
    @DELETE @Path("/{id}") public Response delete(@PathParam("id") Long id) {
        service.deleteLocation(id);
        UpdatesWebSocket.broadcast("aux");
        return Response.noContent().build();
    }
}