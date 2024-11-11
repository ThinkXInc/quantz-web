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
	Speaker        string `json:"speaker"`
	StartMs        int    `json:"startMs"`
	EndMs          int    `json:"endMs"`
	Message        string `json:"message"`
	VideoPath      string `json:"videoPath,omitempty"` // Optional path to a video file
	Timestamp      string `json:"timestamp,omitempty"` // Optional ISO string timestamp
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
	ClientID      string    `json:"clientId"` // Include clientId in the metadata
	Events        []Event   `json:"events"`
	UserInfo      UserInfo  `json:"userInfo"`
	StartDatetime string    `json:"startDatetime"`
	EndDatetime   string    `json:"endDatetime"`
}

func main() {
	// Prepare the URL using host and port from config
	url := fmt.Sprintf("http://%s:%d%s", config.Cfg.Host, config.Cfg.Port, config.Cfg.UploadURL)
	log.Printf("Sending request to %s", url)

	// Prepare metadata
	currentTime := time.Now()
	year, month, day := currentTime.Year(), int(currentTime.Month()), currentTime.Day()

	identifier := "4be68a2f3fcef6a7b59daff3"
	clientID := "cc678692d84e44a5a459bfd722ae2140"

	metaData := MetaData{
		Service:       "interview",
		Identifier:    identifier,
		HostID:        "66961e8cdb50d5d0004bd6e3",
		ClientID:      clientID,
		StartDatetime: currentTime.Format(time.RFC3339),
		EndDatetime:   currentTime.Add(10 * time.Minute).Format(time.RFC3339),
		UserInfo: UserInfo{
			Name:  "Lara",
			Email: "lara42@mail.com",
		},
		Events: []Event{
			{
				Speaker: "system",
				StartMs: 0,
				EndMs:   3000,
				Message: "Hello, Lara I would like to conduct a simple interview with you now. Are you ready?",
			},
			{
				Speaker:        "user",
				StartMs:        3000,
				EndMs:          6000,
				Message:        "Yes, I'm ready.",
				VideoPath:      fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_0.mp4", year, month, day, identifier, clientID),
				ScreenShotPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_0.jpeg", year, month, day, identifier, clientID),
			},
			{
				Speaker: "system",
				StartMs: 6000,
				EndMs:   9000,
				Message: "Okay Could you briefly introduce yourself?",
			},
			{
				Speaker:        "user",
				StartMs:        9000,
				EndMs:          36000,
				Message:        "Okay, my name is Lara. I'm a second year master's student in the University of Tokyo studying new media design. And specifically, I'm developing devices that enhance human creativity using sensory feedback. For example, this project combines visual, auditory, and tactile inputs to support diverse creative tasks.",
				VideoPath:      fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_1.mp4", year, month, day, identifier, clientID),
				ScreenShotPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_1.jpeg", year, month, day, identifier, clientID),
			},
			{
				Speaker: "system",
				StartMs: 36000,
				EndMs:   42000,
				Message: "Okay This company provides next-generation communication services using LLM technology What skills do you think you can contribute?",
			},
			{
				Speaker:        "user",
				StartMs:        42000,
				EndMs:          66000,
				Message:        "Since I studied at the design school in Shanghai, I'm skilled with contemporary graphic and video editing tools. And with over four years of experience and following of 5,000 on social media, I can contribute to creative growth, especially in marketing and design.",
				VideoPath:      fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_2.mp4", year, month, day, identifier, clientID),
				ScreenShotPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_2.jpeg", year, month, day, identifier, clientID),
			},
			{
				Speaker: "system",
				StartMs: 66000,
				EndMs:   70000,
				Message: "Okay thank you Finally, could you tell us what aspects of our company interested you the most?",
			},
			{
				Speaker:        "user",
				StartMs:        70000,
				EndMs:          92000,
				Message:        "ThinkX is challenging new things and developing future possibilities, and I thought that these companies' attitude of following creative people suited me.",
				VideoPath:      fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_3.mp4", year, month, day, identifier, clientID),
				ScreenShotPath: fmt.Sprintf("/fs/files/interview/%d/%02d/%02d/%s/%s/user_3.jpeg", year, month, day, identifier, clientID),
			},
			{
				Speaker: "system",
				StartMs: 92000,
				EndMs:   95000,
				Message: "Operator: Thank you Lara This is the end Please feel free to write and follow-up information Goodbye",
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
