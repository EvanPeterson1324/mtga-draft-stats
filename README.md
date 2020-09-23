# MTGA draft scripts

## TODOS
- Fix tabs/spaces and clean up code
- Parse which card set the draft was and what date the draft took place
- How to store draft data? (mongo? local?)
- Make script an executable with log file path as input?

### Reminders
- MTGA deletes the Player.log every time you close the client. I'll have to listen for writes on the log file and
  make sure I save my drafts
