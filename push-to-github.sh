#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"
REPO_NAME="sms-app"

echo "Setting up GitHub repository..."
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "Repository pushed successfully!"
echo "View at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"