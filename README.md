![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=Plastic&logo=eslint&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=Plastic&logo=docker&logoColor=white)

# wDOSg

A Simple web server to manage and run DOS based games on your browser.

## Overview

**wDOSg** (web DOS games) is a centralized DOS game library that allows you to fetch metadata from [_IGDB_](https://www.igdb.com/) 
and run your games on the browser through [_js-dos_](https://github.com/caiiiycuk/js-dos), using a minimalistic configuration.

<!--toc:start-->

- [wDOSg](#wDOSg)
  - [Overview](#overview)
  - [Features](#features)
  - [Screenshots](#screenshots)
  - [Roadmap](#roadmap)
- [Installation](#installation)
  - [Game Bundles](#game-bundles)
  - [How it works](#how-it-works)
  - [Metadata](#metadata)
  - [Configuration](#configuration)
    - [Docker compose example](#docker-compose-example)

<!--toc:end-->

## Features

- Centralized repository to host your DOS games
- Automatically fetches game metadata and artworks from _IGDB_ (requires authentication information)
- Ability to edit information for games
- Include manuals / attachments for each game
- Web access: access your library from anywhere
- Supports games saving capabilities through _js-dos_ (single browser / device)
- Dark and light themes

## Screenshots

**Home Screen - Dark Theme**

![Image](https://github.com/user-attachments/assets/0909ed57-f10f-4bdf-b2ce-0946047b379d)

**Home Screen - Light Theme**

![Image](https://github.com/user-attachments/assets/45a11325-344d-4ab7-ae47-d406650cb7c6)

**Game Creation: Metadata fetched from IGDB**

![Image](https://github.com/user-attachments/assets/0b5db5ad-0de1-424f-b23c-9af7079c692b)

**Game Details**

![Image](https://github.com/user-attachments/assets/b01fa54c-d8ee-4348-9659-0257408bbd49)

## Roadmap

- Features
  - [x] Add / remove games
  - [x] Edit games information
  - [x] Download IGDB metadata
  - [x] Local save games / states
  - [x] Dark / Light themes
  - [x] User authentication (local)
  - [x] User administration
  - [x] Device local saving
  - [x] _js-dos_ per-game configuration `v1.2.0`
  - [x] Add Manuals / Attachments to each game `v1.2.0`
  - [x] Send registering invites via email `v1.3.0`
  - [x] Server saving for multiple devices support - (js-dos v7) `v1.3.1`
  - [x] Password recovery `v1.3.1`
  - [x] Support for Docker Secrets `v1.3.1`
  - [x] Game library as list or grid `NEW! v1.3.5`
  - [x] Support for _js-dos_ v8 `NEW! v1.3.5`
- Down the line
  - [ ] Create entry from game folder - as opposed to a _jsdos bundle_ file
  - [ ] Ability to scan library folder (bulk import)

> [!CAUTION]
> wDOSg has been imagined as a _convenient_ way to run DOS games. Although it requires user authentication, it has not been 
> designed to be exposed to the open internet.
> **Make sure** your instance is **NOT** exposed.

# Installation

> [!TIP]
> Familiarize with [js-dos](https://github.com/caiiiycuk/js-dos) project to fully understand emulator capabilities.

### Game Bundles

**wDOSg** currently supports games as [js-dos bundle files](https://js-dos.com/jsdos-bundle.html): a **.zip** archive that 
contains the game itself and a _js-dos_ configuration file and a _dosbox.conf_ file.

Before uploading a game into **wDOSg**, you should pack it. **wDOSg** has a convenient bundle creation feature to do so.
If you prefer, you can always go through the _Game Studio_ feature from [DOS.Zone](https://dos.zone/studio-v8/) as well.

### How it works

Each game gets deployed into a separated directory, is packed as a js-dos bundle along with a webpage, which is
ultimately served so the underlying _js-dos_ engine executes the game on screen.

### Metadata

**wDOSg** uses _IGDB_ as a metadata provider to fetch metadata for your games. To use the _IGDB_ metadata provider, please 
follow these [instructions](https://api-docs.igdb.com/#account-creation).

> [!CAUTION]
> Starting from _wDOSg v1.3.5_, use of Twitch client *token* is removed in favor of client *secret*, avoiding the need for manual token refreshes.

### Configuration

- Docker (Highly recommended)
- Environment variables:

| Variable | Description | Default value |
| --- | --- | --- |
|`TWITCH_CLIENT_ID`|Your personal Twitch Client ID|Empty|
|`TWITCH_CLIENT_SECRET`|Your Twitch Client Secret|Empty|
|`LOG_LEVEL`|info, debug, trace|`info`|
|`TOKEN_SECRET`|The encryption key for your sessions. Keep this very secure.|`'secret'`|
|`GAMES_LIBRARY` (*) |Path to your games library (If using docker this variable references its internal location, so make sure the appropriate path gets reflected as a mapped volume)|`'/app/wdosglibrary'`|
|`DB_PATH` (*)|Path to the sqlite database|`'/app/database/'`|
|`EMAIL_SERVICE`|Email service wDOSg will use to send invitation emails from|Empty|
|`EMAIL_USER`|Email account user from which wDOSg will send invitation emails from|Empty|
|`EMAIL_PASS`|Email account password from which wDOSg will send invitation emails from|Empty|
|`SERVER_FRIENDLY_URL`|wDOSg hosting site (where users will be redirected for authentication)|Empty|

(*): _If using docker, it's recommended to leave them as-is, and instead map the corresponding folder to the default value_

#### Docker secrets support:
Some environment variables are supported to be included as docker secrets instead of plain environment variables, as follows

| Variable | Description | Default value |
| --- | --- | --- |
|`TWITCH_CLIENT_ID_FILE`|Your personal Twitch Client ID|Empty|
|`TWITCH_CLIENT_SECRET_FILE`|Your Twitch Client Secret|Empty|
|`TOKEN_SECRET_FILE`|The encryption key for your sessions. Keep this very secure.|`'secret'`|
|`EMAIL_PASS_FILE`|Email account password from which wDOSg will send invitation emails from|Empty|

#### Docker compose example

The currently recommended way to run the server is via Docker.

This is a simple `docker-compose.yml` example file to start running:

```yaml
services:
  wdosg:
    image: soulraven1980/wdosg:latest
    container_name: wdosg
    restart: unless-stopped
    ports:
      - 3001:3001 # to access the web client
    environment:
      - TWITCH_CLIENT_ID=xxxx # Your IGDB (Twitch) client ID
      - TWITCH_CLIENT_SECRET=xxxx # Your IGDB (Twitch) client secret
      - LOG_LEVEL=info # Level of logging to be reflected on console
      - TOKEN_SECRET=secret # Your key to encrypt the session tokens
      # - GAMES_LIBRARY=/app/wdosglibrary # If for some reason you need to modify this variable, 
                                               # make sure mapped volumes are consistent with this value
      # - DB_PATH=/app/database # If for some reason you need to modify this variable, 
                                          # make sure mapped volumes are consistent with this value
      - EMAIL_SERVICE=mymail # Your email service
      - EMAIL_USER=wdosg@mymail.com # Email user that wDOSg will use
      - EMAIL_PASS=wodsgpassword # Email user that wDOSg will use
      - SERVER_FRIENDLY_URL=https://wdosg.com # Your site where wDOSg is hosted
    volumes:
      - your_library_location:/app/wdosglibrary # directory containing your library
      - your_db_location:/app/database # directory containing your database
```

#### Docker compose example with docker secrets and reverse proxy
```yaml
services:
  wdosg:
    image: soulraven1980/wdosg:latest
    container_name: wdosg
    restart: unless-stopped
    ports:
      - 3001:3001 # to access the web client
    environment:
      - TWITCH_CLIENT_ID_FILE=/run/secrets/TWITCH_CLIENT_ID # Secret file with your IGDB (Twitch) client ID
      - TWITCH_CLIENT_SECRET_FILE=/run/secrets/TWITCH_CLIENT_SECRET # Secret file with your IGDB (Twitch) secret
      - LOG_LEVEL=info # Level of logging to be reflected on console
      - TOKEN_SECRET_FILE=/run/secrets/TOKEN_SECRET # Secret file with your key to encrypt the session tokens
      # - GAMES_LIBRARY=/your/games/library/path/ # If for some reason you need to modify this variable, 
                                               # make sure mapped volumes are consistent with this value
      # - DB_PATH=/your/wDOSg/database/path/ # If for some reason you need to modify this variable, 
                                          # make sure mapped volumes are consistent with this value
      - EMAIL_SERVICE=mymail # Your email service
      - EMAIL_USER=wdosg@mymail.com # Email user that wDOSg will use
      - EMAIL_PASS_FILE=/run/secrets/EMAIL_PASS # Secret file with the password for the email that wDOSg will use
      - SERVER_FRIENDLY_URL=https://wdosg.com # Your site where wDOSg is hosted
    volumes:
      - your_library_location:/app/wdosglibrary # directory containing your library
      - your_db_location:/app/database # directory containing your database
    networks:
      - proxy # assuming "proxy" is the network for the reverse proxy (i.e. Traefik)
    secrets:
      - TWITCH_CLIENT_ID
      - TWITCH_CLIENT_SECRET
      - TOKEN_SECRET
      - EMAIL_PASS

networks:
  proxy:
    external: true

secrets:
   TWITCH_CLIENT_ID:
     file: secrets/TWITCH_CLIENT_ID
   TWITCH_CLIENT_SECRET:
     file: secrets/TWITCH_CLIENT_SECRET
   TOKEN_SECRET:
     file: secrets/TOKEN_SECRET
   EMAIL_PASS:
     file: secrets/EMAIL_PASS
```

Run `docker-compose up -d` in the directory containing your `docker-compose.yml` file to start the service.

Open http://localhost:3001 (or the port configured on your docker compose file) and enjoy!

----
Default admin user: 
```
wdosg@wdosg.com / wdosg
```