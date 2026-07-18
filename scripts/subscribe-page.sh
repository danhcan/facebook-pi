#!/bin/bash

# Script to subscribe Facebook Page to webhook
# Usage: ./subscribe-page.sh <PAGE_ID> <PAGE_ACCESS_TOKEN>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <PAGE_ID> <PAGE_ACCESS_TOKEN>"
    echo ""
    echo "To get Page ID and Access Token:"
    echo "1. Go to Facebook App → Messenger → Settings → Access Tokens"
    echo "2. Find your Page and click 'Generate Token'"
    echo "3. Copy Page ID and Access Token"
    exit 1
fi

PAGE_ID=$1
PAGE_ACCESS_TOKEN=$2

echo "Subscribing Page $PAGE_ID to webhook..."

# Subscribe page to webhook events
response=$(curl -s -X POST \
  "https://graph.facebook.com/v19.0/$PAGE_ID/subscribed_apps" \
  -d "access_token=$PAGE_ACCESS_TOKEN" \
  -d "subscribed_fields=messages,messaging_postbacks,message_deliveries,message_reads")

echo "Response: $response"

if echo "$response" | grep -q '"success":true'; then
    echo ""
    echo "✅ Page subscribed successfully!"
    echo ""
    echo "Now test by sending a message to your Page."
else
    echo ""
    echo "❌ Subscription failed. Check the error above."
    echo ""
    echo "Common issues:"
    echo "- Invalid Page Access Token"
    echo "- Page not connected to app"
    echo "- Insufficient permissions"
fi
