# Contributing

Thank you for investing your time in contributing to our project! Any contribution you make will be reflected live on [dokurno.dev/ClashCalendar/](https://dokurno.dev/ClashCalendar/) ❤️

## How to report bugs and propose new features

If you spot a problem in the project or want to propose a improvement to the project. [Search
if an issue already exists](https://github.com/MrBartusek/ClashCalendar/issues). If a related issue doesn't exist,
you can [open a new issue](https://github.com/MrBartusek/ClashCalendar/issues/new/choose).

## Project structure - Frontend and Updater

Clash Calendar is not your typical web application. The regular backend and frontend terminology doesn't really apply here. Project is separated into two parts. **Frontend** is the website in `docs` folder, running on the Github Pages - [dokurno.dev/ClashCalendar/](https://dokurno.dev/ClashCalendar/). It is made to simplify process of importing the Google Calendars. Second part is **Updater** which is a Typescript Node.js script running on my [Raspberry Pi 4B](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) with [pm2](https://pm2.keymetrics.io). It handles all of the calendars and updates events. These updates are stored on set of Google Calendars. The only way these two communicate is [`docs/structure.json`](https://github.com/MrBartusek/ClashCalendar/blob/master/docs/structure.json) file. This is generated once by updater and is used by website indefinitely.

## How to contribute

1. Fork the project and clone it to your local machine. Follow the [setup guide](#setup-local-environment).
1. Before making any changes pull from the remote repository to update your main branch
   ```sh
   git pull upstream master
   ```
1. Create a branch on which you will be working.
   ```sh
   git checkout -b update-button-color
   ```
1. Commit your changes and push it to your fork of the repository.
1. Make sure your changes are working locally. Run `npm run build` to check code style.
1. Create a Pull Request (PR). Make sure to describe the changes that you made and use the `Fixes: #number` keyword if
you were working on a issue.

## Setup local environment

If you don't have Clash Calendar running locally please follow this setup guide:

1. Fork this repository using [Fork](https://github.com/MrBartusek/ClashCalendar/fork) button. This will create a new
repository on your account named `<your username>/ClashCalendar`
1. Clone this repo to wherever you want:
   ```sh
   git clone https://github.com/<your username>/ClashCalendar.git
   ```
1. [Navigate to Google Cloud Console](https://console.cloud.google.come). Create a new project under any name.
1. Enable the `Google Calendar API`. This is free API that doesn't require billing account.
1. If you want to make contributions to the frontend or updater, follow applicable guide(s).

#### Frontend Setup

1. Navigate to the `docs` directory.
1. Run this directory under any HTTP server. You can use [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), [XAMPP](https://www.apachefriends.org) or any other server. **This website won't work by just opening the** `index.html` **in browser!**
1. [Navigate to Google Cloud Console](https://console.cloud.google.come). Go to the project that you have created in [first setup guide](#setup-local-environment).
1. Create a new API Credential of type `API key`.
1. It is highly recommended to restrict this key. If you want to run this project locally select `IP addresses` and add your IP address. If you want to self-host this project on your domain use `HTTP referrers`
1. Open website in your browser.
1. Create a cookie named `GOOGLE_API_KEY` with your API key. You can do it by using any cookie editor extension for you browser.
    - Optionally you can edit `const DEFAULT_API_KEY` key in `main.js`
1. You should now be able to see calendar events from the calendars hosted by Clash Calendar.

### Updater setup

1. Install newest LTS release of [Node.js](https://nodejs.org/en/), it has NPM package manager bundled with it.
1. Navigate to [Riot Developer Portal](https://developer.riotgames.com).
1. Copy your Development API key. Remember that you need to regenerate this key every 24 hours.
1. Paste this key into environment variables as `RIOT_API_KEY`.
1. [Navigate to Google Cloud Console](https://console.cloud.google.come). Go to the project that you have created in [first setup guide](#setup-local-environment).
1. Create a new API Credential of type `Service account`. You can select any name. You don't need to grant any special access for this account. This file is confidential and must not be shared with anyone.
1. Click on the new service account and select `Keys` tab
1. Create a new key of `JSON` type.
1. Save this key to `keys` directory under `service-account.json` name.
1. Go into the repo folder:
   ```sh
   cd ClashCalendar
   ```
1. Install dependencies:
   ```sh
   npm install
   ```
1. Build the project
   ```sh
   npm run build
   ```
1. Start the updater
   ```sh
   npm start
   ```

You now have a running instance of Clash Calendar Updater. There are now couple of things that you need to have in mind.
- This app creates 55 calendars, Google puts in a limit of creating 25 calendars in span of couple of hours. That means building calendars structure can take up to a day. If structure is not complete, `structure.json` won't be generated.
- Riot Development API key expires every 24 hours and needs to be regenerated.
- If you want to use calendars generated by your updater on website, replace `docs/structure.json` file with `./structure.json`.
