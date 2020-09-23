# MTGA draft scripts

## Overview
Magic the Gathering Arena, MTGA for short, is a platform in which the trading card game called "Magic the Gathering" can be played digitally. This project aims to provide an easy way for players of MTGA to track statistics about what is called "drafting". Drafting is a way to play Magic that includes building a deck out of packs of cards with a group of players.

## The Log file
MTGA writes to a log file called `PLayer.log` when actions are performed in-game. This log file can be usually be found at the following locations for Mac/Windows:
- Mac: ???
- Windows: `C:\Users\<YOUR_PC_USERNAME>\AppData\LocalLow\Wizards Of The Coast\MTGA`

> As of writing, it looks like MTGA removes data from `Player.log` everytime the application is started/closed. This data is written to `Player-prev.log` and `Player.log` gets cleared out. For this reason, I'll need to work out a way to listen for when a new draft occurs and save that information somewhere else.

## TODOS
- Parse which card set the draft was and what date the draft took place
- How to store draft data? (mongo? local?)
- Make script an executable with log file path as input?

## Usage

1. Make sure you have `npm` installed.
2. Clone this repo and `cd` into `mtga-draft-stats`
3. `npm install`
4. `node index.js`
5. Output should be logged to the console

The script currently uses the `examplePlayerLog2.txt` as default for presentation purposes. If you'd like to try this with your own log file, copy the `Player.log` mentioned earlier into this repo and change the following line: 

`const data = fs.readFileSync('./exampleTxt/<YOUR_FILE_NAME>')`
