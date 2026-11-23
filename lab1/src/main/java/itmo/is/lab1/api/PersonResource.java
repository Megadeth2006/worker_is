package itmo.is.lab1.api;

import itmo.is.lab1.dto.PersonRequest;
import itmo.is.lab1.model.Person;
import itmo.is.lab1.service.AuxiliaryService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.validation.Valid;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("/persons")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PersonResource {
    @Inject private AuxiliaryService service;

    @GET public List<Person> list() { return service.getAllPersons(); }
    @GET @Path("/{id}") public Person get(@PathParam("id") Long id) { return service.getPerson(id); }

    @POST public Response create(@Valid PersonRequest req) {
        Person created = service.createPerson(req);
        UpdatesWebSocket.broadcast("aux");
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
    @PUT @Path("/{id}") public Person update(@PathParam("id") Long id, @Valid PersonRequest req) {
        Person updated = service.updatePerson(id, req);
        UpdatesWebSocket.broadcast("aux");
        return updated;
    }
    @DELETE @Path("/{id}") public Response delete(@PathParam("id") Long id) {
        service.deletePerson(id);
        UpdatesWebSocket.broadcast("aux");
        return Response.noContent().build();
    }
}