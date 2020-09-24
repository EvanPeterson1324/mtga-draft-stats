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

## Example output

### Top level Object
- `UUID`: this UUID is a uinuqe identifier for a particular draft.
- `set`: The name or code of the draft set (TODO)
- `date`: The date and time in which the draft took place (TODO)
- `draftOrder`: An array of objects dipicting a "history" of the draft picks

### `draftOrder` Objects
- `draftId`: A unique identifier for the draft
- `packNumber`: The current pack the player is looking at
- `pickNumber`: The current pick the player is on
- `cardsInPack`: Card ids of the cards that are in the pack in the current state
- `selectedCard`: The card that was selected out of this pack by the player

```json
{
    "aaafd414-40a3-4715-bbf9-7bb7e79929a0": {
        "draftType": "PremierDraft",
        "setName": "ZNR",
        "setReleaseDate": "20200917",
        "playerName": "ezmagicNsteeze",
        "draftOrder": [
            {
                "draftId": "aaafd414-40a3-4715-bbf9-7bb7e79929a0",
                "packNumber": 1,
                "pickNumber": 1,
                "cardsInPack": [
                    73288,
                    73222,
                    73317,
                    73192,
                    73314,
                    73388,
                    73367,
                    73246,
                    73282,
                    73307,
                    73308,
                    73447,
                    73356,
                    73199
                ],
                "selectedCardId": "73199"
            },
            // ...
        ]
    }
}
```
