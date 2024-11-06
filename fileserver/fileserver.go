package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
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

const WHOLE_VIDEO_NAME = "all.webm"
const COMPRESSED_WHOLE_VIDEO_NAME = "all_compressed.mp4"
const METADATA_FILE_NAME = "metadata.json"

func main() {
	// Load configuration
	addr := fmt.Sprintf("%s:%d", config.Cfg.Host, config.Cfg.Port)
	http.HandleFunc(config.Cfg.UploadURL, uploadHandler)

	// File server to serve static files
	fs := http.FileServer(http.Dir(config.Cfg.FilesRootPath))
	http.Handle(config.Cfg.AccessURL, http.StripPrefix(config.Cfg.AccessURL, fs))

	log.Printf("Server started on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

// Function to generate file paths
func generateFilePath(root string, metaData MetaData) (string, error) {
	t, err := time.Parse(time.RFC3339, metaData.StartDatetime)
	if err != nil {
		return "", err
	}
	year := fmt.Sprintf("%04d", t.Year())
	month := fmt.Sprintf("%02d", t.Month())
	day := fmt.Sprintf("%02d", t.Day())
    // {root}/{service}/{year}/{month}/{day}/{identifier}/...
    // e.g. /disk1/quantz/interview/2024/6/12/d0j8adadDoS/
	saveFolderPath := filepath.Join(root, metaData.Service, year, month, day, metaData.Identifier)
	return saveFolderPath, nil
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the multipart form data
	err := r.ParseMultipartForm(int64(config.Cfg.LimitMB) << 20) // Limit in MB
	if err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Retrieve and parse the metadata
	var metaData MetaData
	metaDataFound := false
	for key, values := range r.Form {
		if len(values) > 0 {
			err = json.Unmarshal([]byte(values[0]), &metaData)
			if err == nil {
				metaDataFound = true
				break
			}
		}
	}
	if !metaDataFound {
		http.Error(w, "No valid metadata provided", http.StatusBadRequest)
		return
	}

	// Generate the save path
	root := config.Cfg.FilesRootPath
	saveFolderPath, err := generateFilePath(root, metaData)
	if err != nil {
		http.Error(w, "Error parsing startDatetime", http.StatusBadRequest)
		return
	}

	// Create the directory
	err = os.MkdirAll(saveFolderPath, os.ModePerm)
	if err != nil {
		http.Error(w, "Error creating directory", http.StatusInternalServerError)
		return
	}

	// Retrieve the file
	var file io.Reader
	fileFound := false
	for _, fileHeaders := range r.MultipartForm.File {
		if len(fileHeaders) > 0 {
			fileHeader := fileHeaders[0]
			file, err = fileHeader.Open()
			if err != nil {
				http.Error(w, "Error opening uploaded file", http.StatusBadRequest)
				return
			}
			defer file.(io.Closer).Close()
			fileFound = true
			break
		}
	}
	if !fileFound {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}

	// Save the full video
	wholeVideoPath := filepath.Join(saveFolderPath, WHOLE_VIDEO_NAME)
	outFile, err := os.Create(wholeVideoPath)
	if err != nil {
		http.Error(w, "Error saving video file", http.StatusInternalServerError)
		return
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, file)
	if err != nil {
		http.Error(w, "Error saving video file", http.StatusInternalServerError)
		return
	}

	// Save the conversation data
	conversationDataPath := filepath.Join(saveFolderPath, METADATA_FILE_NAME)
	metaDataJson, err := json.Marshal(metaData)
	if err != nil {
		http.Error(w, "Error marshaling metadata", http.StatusInternalServerError)
		return
	}
	err = os.WriteFile(conversationDataPath, metaDataJson, os.ModePerm)
	if err != nil {
		http.Error(w, "Error saving conversation data", http.StatusInternalServerError)
		return
	}

	// Start processing in the background
	go processVideo(wholeVideoPath, saveFolderPath, metaData)

	// Send immediate response to the client
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Upload received and processing started"))
}

func processVideo(videoPath, saveFolderPath string, metaData MetaData) {
	// Compress the video
	compressedVideoPath := filepath.Join(saveFolderPath, COMPRESSED_WHOLE_VIDEO_NAME)
	err := compressVideo(videoPath, compressedVideoPath)
	if err != nil {
		log.Println("Error compressing video:", err)
		return
	}

	// Generate base URL
	baseUrl, err := generateBaseUrl(metaData)
	if err != nil {
		log.Println("Error generating baseUrl:", err)
		return
	}

	// Process each event
	for idx, event := range metaData.Events {
		durationMs := event.EndMs - event.StartMs
		startSec := float64(event.StartMs) / 1000.0
		durationSec := float64(durationMs) / 1000.0

		speaker := event.Speaker
		fileName := fmt.Sprintf("%s_%d.mp4", speaker, idx)
		outputFilePath := filepath.Join(saveFolderPath, fileName)

		// Extract the video segment
		err := extractVideoSegment(compressedVideoPath, outputFilePath, startSec, durationSec)
		if err != nil {
			log.Println("Error extracting video segment:", err)
			continue
		}

		// Generate the screenshot
		screenShotFileName := fmt.Sprintf("%s_%d.jpeg", speaker, idx)
		screenShotFilePath := filepath.Join(saveFolderPath, screenShotFileName)
		err = generateScreenshot(outputFilePath, screenShotFilePath)
		if err != nil {
			log.Println("Error generating screenshot:", err)
			continue
		}

		// Update the event with videoUrl and screenShotUrl
		event.VideoUrl = baseUrl + fileName
		event.ScreenShotUrl = baseUrl + screenShotFileName

		// Update the event in the metadata.Events slice
		metaData.Events[idx] = event
	}

	// Update metadataUrl
	metaData.MetadataUrl = baseUrl + METADATA_FILE_NAME

	// Save the updated metadata.json
	metadataJsonPath := filepath.Join(saveFolderPath, METADATA_FILE_NAME)
	metadataJsonData, err := json.Marshal(metaData)
	if err != nil {
		log.Println("Error marshaling metadata to JSON:", err)
	} else {
		err = os.WriteFile(metadataJsonPath, metadataJsonData, os.ModePerm)
		if err != nil {
			log.Println("Error writing metadata.json:", err)
		}
	}

	// Send webhook notification with the full metadata
	err = sendWebhook(metaData)
	if err != nil {
		log.Println("Error sending webhook:", err)
	}
}

func generateBaseUrl(metaData MetaData) (string, error) {
	t, err := time.Parse(time.RFC3339, metaData.StartDatetime)
	if err != nil {
		return "", err
	}
	year := fmt.Sprintf("%04d", t.Year())
	month := fmt.Sprintf("%02d", t.Month())
	day := fmt.Sprintf("%02d", t.Day())
	baseUrl := fmt.Sprintf("%s/%s/%s/%s/%s/%s/", config.Cfg.AccessURL, metaData.Service, year, month, day, metaData.Identifier)
	return baseUrl, nil
}

func compressVideo(inputPath, outputPath string) error {
	// Use ffmpeg to compress the video
	cmd := exec.Command("ffmpeg", "-i", inputPath, "-vcodec", "libx264", "-crf", "28", outputPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func extractVideoSegment(inputPath, outputPath string, startSec, durationSec float64) error {
	startStr := fmt.Sprintf("%.3f", startSec)
	durationStr := fmt.Sprintf("%.3f", durationSec)
	cmd := exec.Command("ffmpeg", "-i", inputPath, "-ss", startStr, "-t", durationStr, "-c", "copy", outputPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func generateScreenshot(videoFilePath, screenshotFilePath string) error {
	// Use ffmpeg to extract a frame from the video at 0.5 seconds
	cmd := exec.Command("ffmpeg", "-ss", "0.5", "-i", videoFilePath, "-vframes", "1", "-q:v", "2", screenshotFilePath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func sendWebhook(metaData MetaData) error {
	// Prepare the webhook payload
	webhookURL := config.Cfg.WebhookURL
	payloadBytes, err := json.Marshal(metaData)
	if err != nil {
		return err
	}
	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(payloadBytes))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}
