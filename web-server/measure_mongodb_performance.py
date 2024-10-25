import time
from init_mongodb import connect
from models.data.interview import Interview

if __name__ == "__main__":

    def measure_fetch_time(interview_id: str):
        start_time = time.time()
        try:
            interview = Interview.get_one(interview_id)
            print(f"Interview fetched: {interview.title}")
        except InterviewNotFoundError:
            print("Interview not found.")
        end_time = time.time()
        print(f"Time taken to fetch the interview: {(end_time - start_time) * 1000} ms")

    interview_id = "67189e846536950be87e6ff4"
    measure_fetch_time(interview_id)
