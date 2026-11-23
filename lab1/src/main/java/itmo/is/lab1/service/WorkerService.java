package itmo.is.lab1.service;

import itmo.is.lab1.dto.PageResponse;
import itmo.is.lab1.dto.RatingGroupDto;
import itmo.is.lab1.dto.WorkerRequest;
import itmo.is.lab1.exception.AppException;
import itmo.is.lab1.model.Worker;
import itmo.is.lab1.repository.WorkerRepository;

import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.core.Response.Status;
import java.util.List;
import java.util.Map;

@Stateless
public class WorkerService {

    @Inject
    private WorkerRepository workerRepo;

    @Inject
    private AuxiliaryService auxService;

    public PageResponse<Worker> getWorkers(int page, int size, String sortBy, String sortDir, Map<String, String> filters) {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 10;
        return workerRepo.findAll(page, size, sortBy, sortDir, filters);
    }

    public Worker getWorkerById(Long id) {
        Worker w = workerRepo.findById(id);
        if (w == null) {
            throw new AppException(Status.NOT_FOUND, "Сотрудник с ID " + id + " не найден");
        }
        return w;
    }

    public Worker createWorker(WorkerRequest req) {
        Worker w = new Worker();
        applyRequest(w, req);
        return workerRepo.save(w);
    }

    public Worker updateWorker(Long id, WorkerRequest req) {
        Worker w = getWorkerById(id);
        applyRequest(w, req);
        return workerRepo.update(w);
    }

    public void deleteWorker(Long id) {
        Worker w = getWorkerById(id);
        workerRepo.delete(w);
    }

    private void applyRequest(Worker w, WorkerRequest req) {
        w.setName(req.getName().trim());
        w.setCoordinates(auxService.getCoordinates(req.getCoordinatesId()));
        w.setOrganization(auxService.getOrganization(req.getOrganizationId()));
        w.setSalary(req.getSalary());
        w.setRating(req.getRating());
        w.setPosition(req.getPosition());
        w.setStatus(req.getStatus());
        w.setPerson(auxService.getPerson(req.getPersonId()));
    }

    //  5 специальных операций через функции БД
    public List<RatingGroupDto> groupByRating() {
        return workerRepo.groupByRating();
    }

    public long countByRating(int rating) {
        return workerRepo.countByRating(rating);
    }

    public List<Integer> getUniqueRatings() {
        return workerRepo.getUniqueRatings();
    }

    public void moveWorker(long workerId, long newOrgId) {
        getWorkerById(workerId);
        auxService.getOrganization(newOrgId);
        workerRepo.moveWorkerToOrganization(workerId, newOrgId);
    }

    public double indexSalary(long workerId, double coeff) {
        if (coeff <= 0) {
            throw new AppException(Status.BAD_REQUEST, "Коэффициент индексации должен быть больше 0");
        }
        getWorkerById(workerId);
        return workerRepo.indexWorkerSalary(workerId, coeff);
    }
}