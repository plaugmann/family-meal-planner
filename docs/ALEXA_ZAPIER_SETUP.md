# Alexa Shopping List Integration via Zapier

This guide will help you set up automatic syncing of your shopping list to Amazon Alexa using Zapier.

## Prerequisites

- Zapier account (free tier works fine)
- Amazon Alexa account  
- Your Family Meal Planner app deployed

## Quick Setup Steps

### 1. Create a Zap (https://zapier.com)

1. Click **Create Zap**
2. **Trigger**: Webhooks by Zapier ? **Catch Hook**
3. Copy the webhook URL Zapier gives you

### 2. Configure Your App

The webhook endpoint is: **https://family-meal-planner-phi.vercel.app/api/integrations/alexa/webhook**

### 3. Set Up Looping (to add multiple items)

1. Add action: **Looping by Zapier** ? **Create Loop From Line Items**
2. Select the 'items' array from webhook data

### 4. Add to Alexa

1. Add action: **Amazon Alexa** ? **Add Item to Shopping List**  
2. Connect your Amazon account
3. Map the loop item to the shopping list item field

### 5. Test & Publish

1. Click **Send to Alexa** in your app
2. Check Zapier received the data
3. Publish your Zap!

## Usage

1. Go to /shopping in your app
2. Click **Send to Alexa** button
3. Items automatically added to Alexa Shopping List!

Say: **"Alexa, what's on my shopping list?"**

## Troubleshooting

- **Not working?** Check Zap is turned ON
- **Duplicates?** The button sends ALL unbought items each time
- **Free tier**: Zapier free = 100 tasks/month (plenty for weekly planning)
