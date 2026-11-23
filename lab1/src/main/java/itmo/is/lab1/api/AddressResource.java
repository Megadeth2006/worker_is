package itmo.is.lab1.api;

import itmo.is.lab1.dto.AddressRequest;
import itmo.is.lab1.model.Address;
import itmo.is.lab1.service.AuxiliaryService;
import itmo.is.lab1.websocket.UpdatesWebSocket;

import javax.inject.Inject;
import javax.validation.Valid;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("/addresses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AddressResource {
    @Inject private AuxiliaryService service;

    @GET public List<Address> list() { return service.getAllAddresses(); }
    @GET @Path("/{id}") public Address get(@PathParam("id") Long id) { return service.getAddress(id); }

    @POST public Response create(@Valid AddressRequest req) {
        Address created = service.createAddress(req);
        UpdatesWebSocket.broadcast("aux");
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
    @PUT @Path("/{id}") public Address update(@PathParam("id") Long id, @Valid AddressRequest req) {
        Address updated = service.updateAddress(id, req);
        UpdatesWebSocket.broadcast("aux");
        return updated;
    }
    @DELETE @Path("/{id}") public Response delete(@PathParam("id") Long id) {
        service.deleteAddress(id);
        UpdatesWebSocket.broadcast("aux");
        return Response.noContent().build();
    }
}