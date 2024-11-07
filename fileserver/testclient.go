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
	Speaker    string  `json:"speaker"`
	StartMs    int     `json:"startMs"`
	EndMs      int     `json:"endMs"`
	Message    string  `json:"message"`
	VideoPath  string  `json:"videoPath,omitempty"` // Optional path to a video file
	Timestamp  string  `json:"timestamp,omitempty"` // Optional ISO string timestamp
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
    metaData := MetaData{
        Service:       "interview",
        Identifier:    "3db3b4b18a036707e42c26d7",
        HostID:        "66961e8cdb50d5d0004bd6e3",
        ClientID:      "test_client",
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
                VideoPath: "/test_service/test_identifier/user_0.mp4",
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
