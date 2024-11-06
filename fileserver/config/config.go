// config/config.go

package config

import (
	"log"
	"io/ioutil"
	"gopkg.in/yaml.v3"
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
	// Read config.yml
	yamlFile, err := ioutil.ReadFile("./config/config.yml")
	if err != nil {
		log.Fatalf("Error reading config.yml file: %v", err)
	}
	err = yaml.Unmarshal(yamlFile, &Cfg)
	if err != nil {
		log.Fatalf("Error parsing config.yml file: %v", err)
	}
}
