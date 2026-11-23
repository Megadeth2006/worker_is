package itmo.is.lab1.exception;

import itmo.is.lab1.dto.ErrorResponse;

import javax.validation.ConstraintViolationException;
import javax.ws.rs.ProcessingException;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;
import java.util.Collections;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {
    @Override
    public Response toResponse(Throwable ex) {
        Throwable root = unwrap(ex);

        if (root instanceof AppException) {
            AppException appEx = (AppException) root;
            return Response.status(appEx.getStatus())
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse(appEx.getMessage(), Collections.emptyList()))
                    .build();
        }

        if (root instanceof ConstraintViolationException) {
            return new ValidationExceptionMapper().toResponse((ConstraintViolationException) root);
        }

        if (ex instanceof ProcessingException) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse("Некорректный формат данных: " + root.getMessage(), Collections.emptyList()))
                    .build();
        }

        if (ex instanceof WebApplicationException) {
            WebApplicationException webEx = (WebApplicationException) ex;
            return Response.status(webEx.getResponse().getStatus())
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse(webEx.getMessage(), Collections.emptyList()))
                    .build();
        }

        String msg = root.getMessage() != null ? root.getMessage() : "Внутренняя ошибка сервера";
        if (msg.contains("violates foreign key constraint") || msg.contains("RESTRICT")) {
            return Response.status(Response.Status.CONFLICT)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse("Невозможно удалить объект: на него ссылаются другие объекты", Collections.emptyList()))
                    .build();
        }
        if (msg.contains("violates check constraint")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse("Нарушено ограничение БД: " + msg, Collections.emptyList()))
                    .build();
        }

        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse(msg, Collections.emptyList()))
                .build();
    }

    private Throwable unwrap(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) {
            if (cur instanceof AppException || cur instanceof ConstraintViolationException) {
                return cur;
            }
            cur = cur.getCause();
        }
        return cur;
    }
}