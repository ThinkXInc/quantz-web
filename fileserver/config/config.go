// config/config.go

package config

import (
	"io/ioutil"
	"log"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"

	"github.com/joho/godotenv"
)

type Config struct {
	Host                   string `yaml:"host"`
	Port                   int    `yaml:"port"`
	UploadURL              string `yaml:"upload_url"`
	AccessURL              string `yaml:"access_url"`
	FilesRootPath          string `yaml:"files_root_path"`
	LimitMB                int    `yaml:"limit_mb"`
	WebhookURL             string `yaml:"webhook_url"`
}

var Cfg Config

func init() {
	// Load .env file from the given path
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("No .env file found")
	}

	// Read config.yml
	yamlFile, err := ioutil.ReadFile("config.yml")
	if err != nil {
		log.Fatalf("Error reading config.yml file: %v", err)
	}
	err = yaml.Unmarshal(yamlFile, &Cfg)
	if err != nil {
		log.Fatalf("Error parsing config.yml file: %v", err)
	}

	// Override config values with environment variables if set
	if host := os.Getenv("HOST"); host != "" {
		Cfg.Host = host
	}
	if portStr := os.Getenv("PORT"); portStr != "" {
		port, err := strconv.Atoi(portStr)
		if err == nil {
			Cfg.Port = port
		}
	}
	// Similarly for other config values...
}
