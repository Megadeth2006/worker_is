package itmo.is.lab1.exception;

import itmo.is.lab1.dto.ErrorResponse;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;
import java.util.List;
import java.util.stream.Collectors;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {
    @Override
    public Response toResponse(ConstraintViolationException e) {
        List<String> details = e.getConstraintViolations().stream()
                .map(this::formatViolation)
                .collect(Collectors.toList());
        String msg = details.isEmpty() ? "Ошибка валидации входных данных" : String.join("; ", details);
        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse(msg, details))
                .build();
    }

    private String formatViolation(ConstraintViolation<?> v) {
        String path = v.getPropertyPath().toString();
        String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
        return field + ": " + v.getMessage();
    }
}