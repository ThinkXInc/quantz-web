package main

import (
	"log"
	"net/http"
)

func main() {
	// Serve static files from the current directory.
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)

	http.HandleFunc("/demo", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "demo.html")
	})

	http.HandleFunc("/demo2", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "demo2.html")
	})

	http.HandleFunc("/btn", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "btn.html")
	})

	http.HandleFunc("/btn2", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "btn_v2.html")
	})

	http.HandleFunc("/btn2s", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "btn_v2_simple.html")
	})

	http.HandleFunc("/buttonloader", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "buttonloader.html")
	})

	http.HandleFunc("/buttonloader2", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "buttonloader2.html")
	})

	http.HandleFunc("/buttonloader3", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "buttonloader3.html")
	})

	http.HandleFunc("/buttonloader4", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "buttonloader4.html")
	})

	http.HandleFunc("/btndev", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "btndev.html")
	})

	http.HandleFunc("/apptask", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "apptask.html")
	})

	// Serve JavaScript file - adjust the path according to your file structure
	http.HandleFunc("/quantz-button.min.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "dist/quantz-button.min.js")
	})

	// Define the address and port to listen on.
	addr := "localhost:8080" // Change the port if needed.

	log.Printf("Starting HTTP server on %s", addr)
	err := http.ListenAndServe(addr, nil)
	if err != nil {
		log.Fatal("HTTP Server Error: ", err)
	}
}
