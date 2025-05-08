#!/bin/bash

# Get the UID and email from the arguments
USER_ID=$1
EMAIL=$2

long_running_process() {
    echo "Starting vm creation process for UID: $USER_ID and EMAIL: $EMAIL"
    sudo /home/christian/app/bradensbay-web-gen/backend/start-vm-service/newUser.sh $USER_ID $EMAIL
}


long_running_process &

disown

exit 0