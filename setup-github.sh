#!/bin/bash

echo "====================================="
echo "GitHub Repository Setup for SMS App"
echo "====================================="
echo ""
echo "You'll need a GitHub Personal Access Token (PAT) with 'repo' scope."
echo "Get one at: https://github.com/settings/tokens/new"
echo ""
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -s -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

# Test the token
echo "Testing GitHub credentials..."
RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
if [[ $RESPONSE == *"Bad credentials"* ]]; then
    echo "Error: Invalid GitHub token. Please check your credentials."
    exit 1
fi

echo "✓ Credentials valid!"

# Create the repository
echo "Creating repository on GitHub..."
curl -H "Authorization: token $GITHUB_TOKEN" \
     -d '{"name":"stech-sms-app","description":"SMS messaging app with Twilio integration","public":true}' \
     https://api.github.com/user/repos

# Add remote and push
echo "Configuring git remote..."
git remote remove origin 2>/dev/null
git remote add origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/stech-sms-app.git

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "====================================="
echo "✓ Repository created and pushed!"
echo "View at: https://github.com/$GITHUB_USERNAME/stech-sms-app"
echo "====================================="