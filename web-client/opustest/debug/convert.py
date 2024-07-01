import os
import shutil
from datetime import datetime

# Define the source and destination directories
source_directory = os.path.expanduser("~/Downloads/opus")
destination_directory = os.path.expanduser("~/Downloads/opus_converted")

# Create the destination directory if it doesn't exist
if not os.path.exists(destination_directory):
    os.makedirs(destination_directory)

# Function to extract timestamp and index from a filename
def extract_info(filename):
    parts = filename.split('_')
    timestamp_str = '_'.join(parts[1:-1])  # Extract the timestamp portion
    index = int(parts[-1].split('.')[0])  # Extract the index portion
    return timestamp_str, index

# List all files in the source directory
files = os.listdir(source_directory)

# Sort the files based on timestamp and index
sorted_files = sorted(files, key=lambda x: extract_info(x))

# Rename and move the files to the destination directory
for i, filename in enumerate(sorted_files):
    timestamp_str, index = extract_info(filename)
    new_filename = f"chunk_{timestamp_str}_{i}.opus"
    new_filepath = os.path.join(destination_directory, f"chunk_{i}.opus")
    old_filepath = os.path.join(source_directory, filename)
    
    # Rename and move the file
    shutil.move(old_filepath, new_filepath)
    print(f"Renamed and moved: {old_filepath} to {new_filepath}")
