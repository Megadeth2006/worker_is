package itmo.is.lab1.exception;

import javax.ejb.ApplicationException;
import javax.ws.rs.core.Response;

@ApplicationException(rollback = true)
public class AppException extends RuntimeException {
    private final Response.Status status;

    public AppException(Response.Status status, String message) {
        super(message);
        this.status = status;
    }

    public Response.Status getStatus() {
        return status;
    }
}
