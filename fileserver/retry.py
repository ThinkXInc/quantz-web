#!/usr/bin/env python3
import os
import json
import datetime
import logging
import argparse
import subprocess

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

DAYS = 3
DISK_ROOT = '/disk1/quantz'
FILE_SERVER_DIR = '/src/quantz-web/fileserver/fileserver'
SERVICE = 'interview'

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Retry processing for failed uploads')
    parser.add_argument('--days', type=int, default=DAYS, help='Number of days to check (default: 3)')
    parser.add_argument('--root', default=DISK_ROOT, help='Root path (default: /disk1/quantz)')
    parser.add_argument('--fileserver_path', default=FILE_SERVER_DIR, help='Path to fileserver executable')
    args = parser.parse_args()

    days = args.days
    root_path = args.root
    fileserver_path = args.fileserver_path

    today = datetime.date.today()

    date_list = [today - datetime.timedelta(days=x) for x in range(days)]

    # List services under root_path
    services = [SERVICE] #[d for d in os.listdir(root_path) if os.path.isdir(os.path.join(root_path, d))]

    for service in services:
        service_path = os.path.join(root_path, service)
        for date in date_list:
            year = '{:04d}'.format(date.year)
            month = '{:02d}'.format(date.month)
            day = '{:02d}'.format(date.day)
            date_path = os.path.join(service_path, year, month, day)

            if not os.path.exists(date_path):
                continue

            # For each identifier
            identifiers = [d for d in os.listdir(date_path) if os.path.isdir(os.path.join(date_path, d))]
            for identifier in identifiers:
                identifier_path = os.path.join(date_path, identifier)
                # For each clientId
                clientIds = [d for d in os.listdir(identifier_path) if os.path.isdir(os.path.join(identifier_path, d))]
                for clientId in clientIds:
                    folder_path = os.path.join(identifier_path, clientId)
                    process_folder(folder_path, fileserver_path)

def process_folder(folder_path, fileserver_path):
    logging.info(f'Processing folder: {folder_path}')

    # Check if folder is empty
    if not os.listdir(folder_path):
        logging.info(f'Folder is empty: {folder_path}. Skipping.')
        return

    status_file = os.path.join(folder_path, 'status.json')
    all_webm = os.path.join(folder_path, 'all.webm')
    metadata_json = os.path.join(folder_path, 'metadata.json')

    if os.path.exists(status_file):
        # Read status.json
        with open(status_file, 'r') as f:
            status_data = json.load(f)
        if status_data.get('status') == 'success':
            logging.info(f'Status is success for folder {folder_path}. Skipping.')
            return
        else:
            logging.info(f'Status is failed for folder {folder_path}. Retrying.')
            retry_process(folder_path, fileserver_path)
    else:
        if os.path.exists(all_webm) or os.path.exists(metadata_json):
            logging.info(f'No status file, but all.webm or metadata.json exists in {folder_path}. Retrying.')
            retry_process(folder_path, fileserver_path)
        else:
            logging.info(f'Neither video or metadata in {folder_path}. Skipping.')
            return

def retry_process(folder_path, fileserver_path):
    # Command to run fileserver reprocess
    command = [fileserver_path, 'reprocess', folder_path]
    logging.info(f'Running command: {" ".join(command)}')
    try:
        subprocess.run(command, check=True)
        logging.info(f'Reprocess succeeded for folder {folder_path}')
    except subprocess.CalledProcessError as e:
        logging.error(f'Error reprocessing folder {folder_path}: {e}')

if __name__ == '__main__':
    main()
