package itmo.is.lab1.dto;

public class RatingGroupDto {
    private int rating;
    private long count;

    public RatingGroupDto() {}
    public RatingGroupDto(int rating, long count) {
        this.rating = rating;
        this.count = count;
    }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }
}