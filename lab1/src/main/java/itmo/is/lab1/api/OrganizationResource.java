package itmo.is.lab1.api;

import itmo.is.lab1.dto.OrganizationRequest;
import itmo.is.lab1.model.Organization;
import itmo.is.lab1.service.AuxiliaryService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.validation.Valid;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("/organizations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrganizationResource {
    @Inject private AuxiliaryService service;

    @GET public List<Organization> list() { return service.getAllOrganizations(); }
    @GET @Path("/{id}") public Organization get(@PathParam("id") Long id) { return service.getOrganization(id); }

    @POST public Response create(@Valid OrganizationRequest req) {
        Organization created = service.createOrganization(req);
        UpdatesWebSocket.broadcast("aux");
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
    @PUT @Path("/{id}") public Organization update(@PathParam("id") Long id, @Valid OrganizationRequest req) {
        Organization updated = service.updateOrganization(id, req);
        UpdatesWebSocket.broadcast("aux");
        return updated;
    }
    @DELETE @Path("/{id}") public Response delete(@PathParam("id") Long id) {
        service.deleteOrganization(id);
        UpdatesWebSocket.broadcast("aux");
        return Response.noContent().build();
    }
}