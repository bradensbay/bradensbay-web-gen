#!/bin/bash

# File containing the UID and email pairs
INPUT_FILE="user_list.txt"

# Check if the input file exists
if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Error: Input file '$INPUT_FILE' not found."
  exit 1
fi

# Iterate through each line in the file
while IFS=" " read -r USER_ID EMAIL; do
  if [[ -n "$USER_ID" && -n "$EMAIL" ]]; then
    echo "Scheduling process for UID: $USER_ID and EMAIL: $EMAIL"
    sudo /home/christian/app/bradensbay-start-vm-api/newUserSchedular.sh "$USER_ID" "$EMAIL" &
    disown
  else
    echo "Warning: Skipping invalid line with missing UID or EMAIL."
  fi
done < "$INPUT_FILE"

exit 0