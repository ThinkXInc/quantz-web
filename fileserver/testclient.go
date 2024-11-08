// client.go

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"fileserver/config"
)

// Event represents an individual event within the metadata.
type Event struct {
	Speaker       string `json:"speaker"`
	StartMs       int    `json:"startMs"`
	EndMs         int    `json:"endMs"`
	Message       string `json:"message"`
	VideoPath     string `json:"videoPath,omitempty"` // Optional path to a video file
	Timestamp     string `json:"timestamp,omitempty"` // Optional ISO string timestamp
	ScreenShotPath string `json:"screenShotPath,omitempty"`
}

type UserInfo struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

// MetaData holds the entire metadata including the list of events.
type MetaData struct {
	Service       string    `json:"service"`
	Identifier    string    `json:"identifier"`
	HostID        string    `json:"hostId"`
	ClientID      string    `json:"clientId"`       // Include clientId in the metadata
	Events        []Event   `json:"events"`
	UserInfo      UserInfo `json:"userInfo"`
	StartDatetime string    `json:"startDatetime"`
	EndDatetime   string    `json:"endDatetime"`
}

func main() {
    // Prepare the URL using host and port from config
    url := fmt.Sprintf("http://%s:%d%s", config.Cfg.Host, config.Cfg.Port, config.Cfg.UploadURL)
    log.Printf("Sending request to %s", url)

    // Prepare metadata
    currentTime := time.Now()
    year, month, day := currentTime.Year(), currentTime.Month(), currentTime.Day()

    identifier := "3db3b4b18a036707e42c26d7"
    clientID := "cc678692d84e44a5a459bfd722ae2140"

    metaData := MetaData{
        Service:       "interview",
        Identifier:    identifier,
        HostID:        "66961e8cdb50d5d0004bd6e3",
        ClientID:      clientID,
        StartDatetime: currentTime.Format(time.RFC3339),
        EndDatetime:   currentTime.Add(10 * time.Minute).Format(time.RFC3339),
        UserInfo: UserInfo{
            Name:  "John Doe",
            Email: "johndoe@example.com",
        },
        Events: []Event{
            {
                Speaker:   "system",
                StartMs:   100,
                EndMs:     1000,
                Message:   "Hello, Kazuki. Are you ready?",
            },
            {
                Speaker:   "user",
                StartMs:   1300,
                EndMs:     2000,
                Message:   "Yes, I'm ready",
                VideoPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_0.mp4", year, month, day, identifier, clientID),
                ScreenShotPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_0.jpeg", year, month, day, identifier, clientID),
                Timestamp: "2024-10-12T11:32:45Z",
            },
            {
                Speaker:   "system",
                StartMs:   2300,
                EndMs:     4000,
                Message:   "Okay, could you introduce yourself briefly?",
                Timestamp: "2024-10-12T11:32:45Z",
            },
            {
                Speaker:   "user",
                StartMs:   4300,
                EndMs:     7000,
                Message:   "Yes, my name is Josheph Cristpher Mackerboy. I'm working hard everyday. But I've recently noticed I'm working too hard. So I need to change my job right away. I like hard working but it's not sustainable in this way.",
                VideoPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_1.mp4", year, month, day, identifier, clientID),
                ScreenShotPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_1.jpeg", year, month, day, identifier, clientID),
                Timestamp: "2024-10-12T11:32:45Z",
            },
            {
                Speaker:   "system",
                StartMs:   7300,
                EndMs:     9000,
                Message:   "Thank you. This is the end.",
                Timestamp: "2024-10-12T11:32:45Z",
            },
        },
    }

	// Serialize metadata to JSON
	metaDataJson, err := json.Marshal(metaData)
	if err != nil {
		log.Fatalf("Error marshaling metadata: %v", err)
	}

	// Create a buffer and a multipart writer
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Add the metadata field
	err = writer.WriteField("metadata", string(metaDataJson))
	if err != nil {
		log.Fatalf("Error writing metadata field: %v", err)
	}

	// Add the file field
	// Open the video file
	videoFilePath := "test_video.webm" // Ensure you have a test video file at this path
	videoFile, err := os.Open(videoFilePath)
	if err != nil {
		log.Fatalf("Error opening video file: %v", err)
	}
	defer videoFile.Close()

	// Create form file field
	fileWriter, err := writer.CreateFormFile("file", filepath.Base(videoFilePath))
	if err != nil {
		log.Fatalf("Error creating form file field: %v", err)
	}

	// Copy the file content
	_, err = io.Copy(fileWriter, videoFile)
	if err != nil {
		log.Fatalf("Error copying video file content: %v", err)
	}

	// Close the writer to finalize the multipart form
	err = writer.Close()
	if err != nil {
		log.Fatalf("Error closing writer: %v", err)
	}

	// Create the HTTP POST request
	req, err := http.NewRequest("POST", url, &requestBody)
	if err != nil {
		log.Fatalf("Error creating HTTP request: %v", err)
	}

	// Set the content-type header
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Read and print the response
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Error reading response body: %v", err)
	}
	log.Printf("Response status: %s", resp.Status)
	log.Printf("Response body: %s", string(bodyBytes))
}
