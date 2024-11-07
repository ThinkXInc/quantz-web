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
	"time"
	"path"

	"fileserver/config"
)

// Define the data structures
type Event struct {
	Speaker       string `json:"speaker"`
	StartMs       int    `json:"startMs"`
	EndMs         int    `json:"endMs"`
	Message       string `json:"message"`
	Timestamp     string `json:"timestamp,omitempty"`
	VideoUrl      string `json:"videoUrl,omitempty"`
	ScreenShotUrl string `json:"screenShotUrl,omitempty"`
}

type UserInfo struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

type MetaData struct {
	Service       string  `json:"service"`
	Identifier    string  `json:"identifier"`
	HostID        string  `json:"hostId"`
	ClientId      string  `json:"clientId"`
	UserInfo      UserInfo `json:"userInfo"`
	Events        []Event `json:"events"`
	StartDatetime string  `json:"startDatetime"`
	EndDatetime   string  `json:"endDatetime"`
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

	log.Printf("[main] Server started on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

// logFileServer wraps a http.FileServer with logging
func logFileServer(rootPath string) http.Handler {
	fileServer := http.FileServer(http.Dir(rootPath))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[FileServer] Received request for %s", r.URL.Path)
		fileServer.ServeHTTP(w, r)
	})
}

// Function to generate file paths
func generateFilePath(root string, metaData MetaData) (string, error) {
	t, err := time.Parse(time.RFC3339, metaData.StartDatetime)
	if err != nil {
		log.Printf("[generateFilePath] Error parsing StartDatetime: %v", err)
		return "", err
	}
	year := fmt.Sprintf("%04d", t.Year())
	month := fmt.Sprintf("%02d", t.Month())
	day := fmt.Sprintf("%02d", t.Day())
	// {root}/{service}/{year}/{month}/{day}/{identifier}/...
	// e.g. /disk1/quantz/interview/2024/6/12/d0j8adadDoS/
	saveFolderPath := filepath.Join(root, metaData.Service, year, month, day, metaData.Identifier)
	log.Printf("[generateFilePath] Generated saveFolderPath: %s", saveFolderPath)
	return saveFolderPath, nil
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("[uploadHandler] Received upload request from %s", r.RemoteAddr)

	// Parse the multipart form data
	err := r.ParseMultipartForm(int64(config.Cfg.LimitMB) << 20) // Limit in MB
	if err != nil {
		log.Printf("[uploadHandler] Error parsing form data: %v", err)
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}
	log.Printf("[uploadHandler] Parsed multipart form data")

	// Retrieve and parse the metadata
	var metaData MetaData
	metaDataFound := false
	for _, values := range r.Form {
		if len(values) > 0 {
			err = json.Unmarshal([]byte(values[0]), &metaData)
			if err == nil {
				metaDataFound = true
				break
			}
		}
	}
	if !metaDataFound {
		log.Printf("[uploadHandler] No valid metadata provided")
		http.Error(w, "No valid metadata provided", http.StatusBadRequest)
		return
	}
	log.Printf("[uploadHandler] Parsed metadata: %+v", metaData)

	// Generate the save path
	root := config.Cfg.FilesRootPath
	saveFolderPath, err := generateFilePath(root, metaData)
	if err != nil {
		log.Printf("[uploadHandler] Error generating save path: %v", err)
		http.Error(w, "Error parsing startDatetime", http.StatusBadRequest)
		return
	}
	log.Printf("[uploadHandler] Save folder path: %s", saveFolderPath)

	// Create the directory
	err = os.MkdirAll(saveFolderPath, os.ModePerm)
	if err != nil {
		log.Printf("[uploadHandler] Error creating directory: %v", err)
		http.Error(w, "Error creating directory", http.StatusInternalServerError)
		return
	}
	log.Printf("[uploadHandler] Created directory: %s", saveFolderPath)

	// Retrieve the file
	var file io.Reader
	fileFound := false
	for _, fileHeaders := range r.MultipartForm.File {
		if len(fileHeaders) > 0 {
			fileHeader := fileHeaders[0]
			file, err = fileHeader.Open()
			if err != nil {
				log.Printf("[uploadHandler] Error opening uploaded file: %v", err)
				http.Error(w, "Error opening uploaded file", http.StatusBadRequest)
				return
			}
			defer file.(io.Closer).Close()
			fileFound = true
			break
		}
	}
	if !fileFound {
		log.Printf("[uploadHandler] No file uploaded")
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	log.Printf("[uploadHandler] Opened uploaded file")

	// Save the full video
	wholeVideoPath := filepath.Join(saveFolderPath, WHOLE_VIDEO_NAME)
	log.Printf("[uploadHandler] Saving full video to %s", wholeVideoPath)
	outFile, err := os.Create(wholeVideoPath)
	if err != nil {
		log.Printf("[uploadHandler] Error creating video file: %v", err)
		http.Error(w, "Error saving video file", http.StatusInternalServerError)
		return
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, file)
	if err != nil {
		log.Printf("[uploadHandler] Error saving video file: %v", err)
		http.Error(w, "Error saving video file", http.StatusInternalServerError)
		return
	}
	log.Printf("[uploadHandler] Saved full video")

	// Save the conversation data
	conversationDataPath := filepath.Join(saveFolderPath, METADATA_FILE_NAME)
	log.Printf("[uploadHandler] Saving conversation data to %s", conversationDataPath)
	metaDataJson, err := json.Marshal(metaData)
	if err != nil {
		log.Printf("[uploadHandler] Error marshaling metadata: %v", err)
		http.Error(w, "Error marshaling metadata", http.StatusInternalServerError)
		return
	}
	err = os.WriteFile(conversationDataPath, metaDataJson, os.ModePerm)
	if err != nil {
		log.Printf("[uploadHandler] Error saving conversation data: %v", err)
		http.Error(w, "Error saving conversation data", http.StatusInternalServerError)
		return
	}
	log.Printf("[uploadHandler] Saved conversation data")

	// Start processing in the background
	log.Printf("[uploadHandler] Starting background video processing")
	go processVideo(wholeVideoPath, saveFolderPath, metaData)

	// Send immediate response to the client
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Upload received and processing started"))
	log.Printf("[uploadHandler] Responded to client")
}

func processVideo(videoPath, saveFolderPath string, metaData MetaData) {
	log.Printf("[processVideo] Started processing video at %s", videoPath)

	// Compress the video
	compressedVideoPath := filepath.Join(saveFolderPath, COMPRESSED_WHOLE_VIDEO_NAME)
	err := compressVideo(videoPath, compressedVideoPath)
	if err != nil {
		log.Printf("[processVideo] Error compressing video: %v", err)
		return
	}
	log.Printf("[processVideo] Compressed video saved to %s", compressedVideoPath)

	// Generate base URL
	baseUrl, err := generateBaseUrl(metaData)
	if err != nil {
		log.Printf("[processVideo] Error generating baseUrl: %v", err)
		return
	}
	log.Printf("[processVideo] Generated baseUrl: %s", baseUrl)

	// Process each event
	for idx, event := range metaData.Events {
		log.Printf("[processVideo] Processing event %d: %+v", idx, event)
		durationMs := event.EndMs - event.StartMs
		startSec := float64(event.StartMs) / 1000.0
		durationSec := float64(durationMs) / 1000.0

		speaker := event.Speaker
		fileName := fmt.Sprintf("%s_%d.mp4", speaker, idx)
		outputFilePath := filepath.Join(saveFolderPath, fileName)

		// Extract the video segment
		err := extractVideoSegment(compressedVideoPath, outputFilePath, startSec, durationSec)
		if err != nil {
			log.Printf("[processVideo] Error extracting video segment for event %d: %v", idx, err)
			continue
		}
		log.Printf("[processVideo] Extracted video segment saved to %s", outputFilePath)

		// Generate the screenshot
		screenShotFileName := fmt.Sprintf("%s_%d.jpeg", speaker, idx)
		screenShotFilePath := filepath.Join(saveFolderPath, screenShotFileName)
		err = generateScreenshot(outputFilePath, screenShotFilePath)
		if err != nil {
			log.Printf("[processVideo] Error generating screenshot for event %d: %v", idx, err)
			continue
		}
		log.Printf("[processVideo] Generated screenshot saved to %s", screenShotFilePath)

        // Update the event with videoUrl and screenShotUrl
        event.VideoUrl = path.Join(baseUrl, fileName)
        event.ScreenShotUrl = path.Join(baseUrl, screenShotFileName)

		// Update the event in the metadata.Events slice
		metaData.Events[idx] = event
	}

    // Update metadataUrl
    metaData.MetadataUrl = path.Join(baseUrl, METADATA_FILE_NAME)

	// Save the updated metadata.json
	metadataJsonPath := filepath.Join(saveFolderPath, METADATA_FILE_NAME)
	metadataJsonData, err := json.Marshal(metaData)
	if err != nil {
		log.Printf("[processVideo] Error marshaling metadata to JSON: %v", err)
	} else {
		err = os.WriteFile(metadataJsonPath, metadataJsonData, os.ModePerm)
		if err != nil {
			log.Printf("[processVideo] Error writing metadata.json: %v", err)
		} else {
			log.Printf("[processVideo] Updated metadata.json saved to %s", metadataJsonPath)
		}
	}

	// Send webhook notification with the full metadata
	err = sendWebhook(metaData)
	if err != nil {
		log.Printf("[processVideo] Error sending webhook: %v", err)
	} else {
		log.Printf("[processVideo] Successfully sent webhook notification")
	}
}

func generateBaseUrl(metaData MetaData) (string, error) {
    t, err := time.Parse(time.RFC3339, metaData.StartDatetime)
    if err != nil {
        log.Printf("[generateBaseUrl] Error parsing StartDatetime: %v", err)
        return "", err
    }
    year := fmt.Sprintf("%04d", t.Year())
    month := fmt.Sprintf("%02d", t.Month())
    day := fmt.Sprintf("%02d", t.Day())
    baseUrl := path.Join(config.Cfg.AccessURL, metaData.Service, year, month, day, metaData.Identifier)
    log.Printf("[generateBaseUrl] Generated baseUrl: %s", baseUrl)
    return baseUrl, nil
}

func compressVideo(inputPath, outputPath string) error {
	log.Printf("[compressVideo] Compressing video from %s to %s", inputPath, outputPath)
	// Use ffmpeg to compress the video
	cmd := exec.Command("ffmpeg", "-i", inputPath, "-vcodec", "libx264", "-crf", "28", outputPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		log.Printf("[compressVideo] Error compressing video: %v", err)
	}
	return err
}

func extractVideoSegment(inputPath, outputPath string, startSec, durationSec float64) error {
	log.Printf("[extractVideoSegment] Extracting video segment from %s to %s, start: %.3f, duration: %.3f", inputPath, outputPath, startSec, durationSec)
	startStr := fmt.Sprintf("%.3f", startSec)
	durationStr := fmt.Sprintf("%.3f", durationSec)
	cmd := exec.Command("ffmpeg", "-ss", startStr, "-t", durationStr, "-i", inputPath, "-vcodec", "libx264", "-acodec", "aac", outputPath)
	log.Printf("[extractVideoSegment] Running command: %v", cmd.Args)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		log.Printf("[extractVideoSegment] Error extracting video segment: %v", err)
	}
	return err
}

func generateScreenshot(videoFilePath, screenshotFilePath string) error {
	log.Printf("[generateScreenshot] Generating screenshot from %s to %s", videoFilePath, screenshotFilePath)
	// Use ffmpeg to extract a frame from the video at 0.5 seconds
	cmd := exec.Command("ffmpeg", "-ss", "0.5", "-i", videoFilePath, "-vframes", "1", "-q:v", "2", screenshotFilePath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		log.Printf("[generateScreenshot] Error generating screenshot: %v", err)
	}
	return err
}

func sendWebhook(metaData MetaData) error {
	log.Printf("[sendWebhook] Sending webhook to %s", config.Cfg.WebhookURL)
	// Prepare the webhook payload
	webhookURL := config.Cfg.WebhookURL
	payloadBytes, err := json.Marshal(metaData)
	if err != nil {
		log.Printf("[sendWebhook] Error marshaling metadata: %v", err)
		return err
	}
	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(payloadBytes))
	if err != nil {
		log.Printf("[sendWebhook] Error sending POST request: %v", err)
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[sendWebhook] Webhook response status: %s, body: %s", resp.Status, string(bodyBytes))
		return fmt.Errorf("received non-OK response from webhook: %s", resp.Status)
	}
	log.Printf("[sendWebhook] Webhook sent successfully")
	return nil
}
