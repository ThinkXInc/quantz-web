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

// Define the data structures
type Event struct {
	Speaker       string `json:"speaker"`
	StartMs       int    `json:"startMs"`
	EndMs         int    `json:"endMs"`
	Message       string `json:"message"`
	VideoUrl      string `json:"videoUrl,omitempty"`
	ScreenShotUrl string `json:"screenShotUrl,omitempty"`
}

type MetaData struct {
	Service       string  `json:"service"`
	Identifier    string  `json:"identifier"`
	HostID        string  `json:"hostId"`
	Events        []Event `json:"events"`
	StartDatetime string  `json:"startDatetime"`
	MetadataUrl   string  `json:"metadataUrl,omitempty"`
}

func main() {
	// Prepare the URL using host and port from config
	url := fmt.Sprintf("http://%s:%d%s", config.Cfg.Host, config.Cfg.Port, config.Cfg.UploadURL)
	log.Printf("Sending request to %s", url)

	// Prepare metadata
	metaData := MetaData{
		Service:    "test_service",
		Identifier: "test_identifier",
		HostID:     "test_host",
		Events: []Event{
			{
				Speaker: "Speaker1",
				StartMs: 0,
				EndMs:   5000,
				Message: "Hello world",
			},
		},
		StartDatetime: time.Now().Format(time.RFC3339),
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
