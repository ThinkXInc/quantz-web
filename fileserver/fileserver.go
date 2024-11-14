package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
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
	VideoPath      string `json:"videoPath,omitempty"`
	ScreenShotPath string `json:"screenShotPath,omitempty"`
}

type UserInfo struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type MetaData struct {
	Service          string    `json:"service"`
	Identifier       string    `json:"identifier"`
	HostID           string    `json:"hostId"`
	ClientId         string    `json:"clientId"`
	UserInfo         UserInfo  `json:"userInfo"`
	Events           []Event   `json:"events"`
	StartDatetime    string    `json:"startDatetime"`
	EndDatetime      string    `json:"endDatetime"`
	MetadataPath      string    `json:"metadataPath,omitempty"`
	VideoPathAll     string    `json:"videoPathAll,omitempty"`
	ScreenShotPathAll string    `json:"screenShotPathAll,omitempty"`
}

// New struct for webhook payload
type WebhookPayload struct {
	Event string   `json:"event"`
	Data  MetaData `json:"metadata"`
}

const WHOLE_VIDEO_NAME = "all.webm"
const COMPRESSED_WHOLE_VIDEO_NAME = "all_compressed.mp4"
const METADATA_FILE_NAME = "metadata.json"
const SCREENSHOT_WHOLE_VIDEO_NAME = "all_compressed.jpeg"

var ErrDiskFull = errors.New("disk space below threshold")

func main() {
    if len(os.Args) > 1 && os.Args[1] == "reprocess" {
        if len(os.Args) < 3 {
            fmt.Println("Usage: fileserver reprocess /path/to/folder")
            return
        }
        folderPath := os.Args[2]
        err := reprocessFolder(folderPath)
        if err != nil {
            log.Fatalf("Error reprocessing folder: %v", err)
        }
        return
    }

    // Existing server code
    addr := fmt.Sprintf("%s:%d", config.Cfg.Host, config.Cfg.Port)
    http.HandleFunc(config.Cfg.UploadURL, uploadHandler)

    fs := http.FileServer(http.Dir(config.Cfg.FilesRootPath))
    http.Handle(config.Cfg.AccessURL, http.StripPrefix(config.Cfg.AccessURL, fs))

    log.Printf("[main] Server started on %s", addr)
    log.Fatal(http.ListenAndServe(addr, nil))
}

func reprocessFolder(folderPath string) error {
    // Read metadata.json
    metadataPath := filepath.Join(folderPath, METADATA_FILE_NAME)
    metadataBytes, err := os.ReadFile(metadataPath)
    if err != nil {
        log.Printf("[reprocessFolder] Error reading metadata.json: %v", err)
        return err
    }
    var metaData MetaData
    err = json.Unmarshal(metadataBytes, &metaData)
    if err != nil {
        log.Printf("[reprocessFolder] Error unmarshaling metadata.json: %v", err)
        return err
    }
    // Determine video path
    wholeVideoPath := filepath.Join(folderPath, WHOLE_VIDEO_NAME)
    // Call processVideo
    err = processVideo(wholeVideoPath, folderPath, metaData)
    if err != nil {
        log.Printf("[reprocessFolder] Error processing video: %v", err)
        return err
    }
    return nil
}

func generateFilePath(root string, metaData MetaData) (string, error) {
    t, err := time.Parse(time.RFC3339, metaData.StartDatetime)
    if err != nil {
        log.Printf("[generateFilePath] Error parsing StartDatetime: %v", err)
        return "", err
    }
    year := fmt.Sprintf("%04d", t.Year())
    month := fmt.Sprintf("%02d", t.Month())
    day := fmt.Sprintf("%02d", t.Day())
    // Updated path to include ClientId
    saveFolderPath := filepath.Join(root, metaData.Service, year, month, day, metaData.Identifier, metaData.ClientId)
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
    metaDataJson := r.FormValue("metadata")
    if metaDataJson == "" {
        log.Printf("[uploadHandler] No valid metadata provided")
        http.Error(w, "No valid metadata provided", http.StatusBadRequest)
        return
    }

    var metaData MetaData
    err = json.Unmarshal([]byte(metaDataJson), &metaData)
    if err != nil {
        log.Printf("[uploadHandler] Error unmarshaling metadata: %v", err)
        http.Error(w, "Error parsing metadata", http.StatusBadRequest)
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
    file, _, err := r.FormFile("file")
    if err != nil {
        log.Printf("[uploadHandler] Error retrieving file: %v", err)
        http.Error(w, "Error retrieving file", http.StatusBadRequest)
        return
    }
    defer file.Close()
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
    err = os.WriteFile(conversationDataPath, []byte(metaDataJson), os.ModePerm)
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

func processVideo(videoPath, saveFolderPath string, metaData MetaData) (err error) {
    defer func() {
        var payload WebhookPayload
        payload.Data = metaData
        status := ""
        if err != nil {
            if errors.Is(err, ErrDiskFull) {
                payload.Event = "save.fail.diskfull"
            } else {
                payload.Event = "save.fail.unknownerror"
            }
            status = "failed"
        } else {
            payload.Event = "save.success"
            status = "success"
        }
        sendWebhook(payload)

        // Write status file
        statusFilePath := filepath.Join(saveFolderPath, "status.json")
        statusData := map[string]interface{}{
            "status":    status,
            "timestamp": time.Now().Format(time.RFC3339),
        }
        if err != nil {
            statusData["error"] = err.Error()
        }
        statusBytes, _ := json.Marshal(statusData)
        err2 := os.WriteFile(statusFilePath, statusBytes, os.ModePerm)
        if err2 != nil {
            log.Printf("[processVideo] Error writing status file: %v", err2)
        } else {
            log.Printf("[processVideo] Status file written to %s", statusFilePath)
        }
    }()

	log.Printf("[processVideo] Started processing video at %s", videoPath)

	// Check disk space
	availableSpace, err := getAvailableDiskSpace(saveFolderPath)
	if err != nil {
		log.Printf("[processVideo] Error getting available disk space: %v", err)
		return err
	}
	thresholdBytes := uint64(config.Cfg.DiskSpaceThresholdMB) * 1024 * 1024
	if availableSpace < thresholdBytes {
		log.Printf("[processVideo] Available disk space (%d bytes) is below threshold (%d bytes)", availableSpace, thresholdBytes)
		err = ErrDiskFull
		return err
	}

	// Compress the video
	compressedVideoPath := filepath.Join(saveFolderPath, COMPRESSED_WHOLE_VIDEO_NAME)
	err = compressVideo(videoPath, compressedVideoPath)
	if err != nil {
		log.Printf("[processVideo] Error compressing video: %v", err)
		return err
	}
	log.Printf("[processVideo] Compressed video saved to %s", compressedVideoPath)

	// Generate base URL
	baseUrl, err := generateBaseUrl(metaData)
	if err != nil {
		log.Printf("[processVideo] Error generating baseUrl: %v", err)
		return err
	}
	log.Printf("[processVideo] Generated baseUrl: %s", baseUrl)

	// Generate screenshot for the compressed whole video
	wholeScreenshotPath := filepath.Join(saveFolderPath, SCREENSHOT_WHOLE_VIDEO_NAME)
	err = generateScreenshot(compressedVideoPath, wholeScreenshotPath)
	if err != nil {
		log.Printf("[processVideo] Error generating screenshot for whole video: %v", err)
	} else {
		log.Printf("[processVideo] Generated screenshot for whole video saved to %s", wholeScreenshotPath)
	}

	// Update metaData with VideoPathAll and ScreenShotPathAll
	metaData.VideoPathAll = path.Join(baseUrl, COMPRESSED_WHOLE_VIDEO_NAME)
	metaData.ScreenShotPathAll = path.Join(baseUrl, SCREENSHOT_WHOLE_VIDEO_NAME)

	// Initialize a map to track index for each speaker
	speakerIndexes := make(map[string]int)

	// Process each event
	for idx, event := range metaData.Events {
	    log.Printf("[processVideo] Processing event %d: %+v", idx, event)
	    durationMs := event.EndMs - event.StartMs
	    startSec := float64(event.StartMs) / 1000.0
	    durationSec := float64(durationMs) / 1000.0

	    speaker := event.Speaker

	    // Get the current index for the speaker and increment it afterwards
	    speakerIdx := speakerIndexes[speaker]
	    speakerIndexes[speaker]++

		// Only extract video segment if the original event contains a VideoPath
		if event.VideoPath != "" {
			// Create filenames using the speaker-specific index
			fileName := fmt.Sprintf("%s_%d.mp4", speaker, speakerIdx)
			outputFilePath := filepath.Join(saveFolderPath, fileName)

			// Extract the video segment
			err := extractVideoSegment(compressedVideoPath, outputFilePath, startSec, durationSec)
			if err != nil {
				log.Printf("[processVideo] Error extracting video segment for event %d: %v", idx, err)
				continue
			}
			log.Printf("[processVideo] Extracted video segment saved to %s", outputFilePath)

			// Update the event's VideoPath if it was originally present
			event.VideoPath = path.Join(baseUrl, fileName)

			// Only generate screenshot if the original event contains a ScreenShotPath
			if event.ScreenShotPath != "" {
				// Generate the screenshot
				screenShotFileName := fmt.Sprintf("%s_%d.jpeg", speaker, speakerIdx)
				screenShotFilePath := filepath.Join(saveFolderPath, screenShotFileName)

				err = generateScreenshot(outputFilePath, screenShotFilePath)
				if err != nil {
					log.Printf("[processVideo] Error generating screenshot for event %d: %v", idx, err)
					continue
				}
				log.Printf("[processVideo] Generated screenshot saved to %s", screenShotFilePath)

				// Update the event's ScreenShotPath if it was originally present
				event.ScreenShotPath = path.Join(baseUrl, screenShotFileName)
			}
		}

	    // Update the event in the metadata.Events slice
	    metaData.Events[idx] = event
	}

	// Update metadataPath
	metaData.MetadataPath = path.Join(baseUrl, METADATA_FILE_NAME)

	// Save the updated metadata.json
	metadataJsonPath := filepath.Join(saveFolderPath, METADATA_FILE_NAME)
	metadataJsonData, err := json.Marshal(metaData)
	if err != nil {
		log.Printf("[processVideo] Error marshaling metadata to JSON: %v", err)
		return err
	}
	err = os.WriteFile(metadataJsonPath, metadataJsonData, os.ModePerm)
	if err != nil {
		log.Printf("[processVideo] Error writing metadata.json: %v", err)
		return err
	}
	log.Printf("[processVideo] Updated metadata.json saved to %s", metadataJsonPath)

	return nil
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
    // Updated URL to include ClientId
    baseUrl := path.Join(config.Cfg.AccessURL, metaData.Service, year, month, day, metaData.Identifier, metaData.ClientId)
    log.Printf("[generateBaseUrl] Generated baseUrl: %s", baseUrl)
    return baseUrl, nil
}

func compressVideo(inputPath, outputPath string) error {
	log.Printf("[compressVideo] Compressing video from %s to %s", inputPath, outputPath)

	// Step to check file integrity
	checkCmd := exec.Command("ffmpeg", "-v", "error", "-i", inputPath, "-f", "null", "-")
	if err := checkCmd.Run(); err != nil {
		log.Printf("[compressVideo] Error: Video file may be corrupted: %v", err)
		return fmt.Errorf("file integrity check failed: %w", err)
	}

	// Use ffmpeg to compress the video
	cmd := exec.Command("ffmpeg", "-y", "-i", inputPath, "-vcodec", "libx264", "-crf", "28", outputPath)
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
    // Use ffmpeg to extract a frame from the video at 0.5 seconds, and overlay a transparent play symbol
    drawtext := `drawtext=text='▶':fontcolor=white@0.7:fontsize=50:x=(w-text_w)/2:y=(h-text_h)/2`
    cmd := exec.Command(
        "ffmpeg",
        "-ss", "0.5",
        "-i", videoFilePath,
        "-vframes", "1",
        "-q:v", "2",
        "-vf", drawtext,
        screenshotFilePath,
    )
    log.Printf("[generateScreenshot] Running command: %v", cmd.Args)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    err := cmd.Run()
    if err != nil {
        log.Printf("[generateScreenshot] Error generating screenshot: %v", err)
    }
    return err
}
//func generateScreenshot(videoFilePath, screenshotFilePath string) error {
//	log.Printf("[generateScreenshot] Generating screenshot from %s to %s", videoFilePath, screenshotFilePath)
//	// Use ffmpeg to extract a frame from the video at 0.5 seconds
//	cmd := exec.Command("ffmpeg", "-ss", "0.5", "-i", videoFilePath, "-vframes", "1", "-q:v", "2", screenshotFilePath)
//	cmd.Stdout = os.Stdout
//	cmd.Stderr = os.Stderr
//	err := cmd.Run()
//	if err != nil {
//		log.Printf("[generateScreenshot] Error generating screenshot: %v", err)
//	}
//	return err
//}

func sendWebhook(payload WebhookPayload) error {
	log.Printf("[sendWebhook] Sending webhook to %s", config.Cfg.WebhookURL)
	// Prepare the webhook payload
	webhookURL := config.Cfg.WebhookURL
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[sendWebhook] Error marshaling payload: %v", err)
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

func getAvailableDiskSpace(path string) (uint64, error) {
	var stat syscall.Statfs_t
	err := syscall.Statfs(path, &stat)
	if err != nil {
		return 0, err
	}
	// Available blocks * size per block = available space in bytes
	return stat.Bavail * uint64(stat.Bsize), nil
}
