const fs = require('fs');
//'C:/Users/Evanp/AppData/LocalLow/Wizards Of The Coast/MTGA/Player.log'
const options = {
  logFile: './test.txt',
  endOfLineChar: require('os').EOL
};

const checkIfDraftEndEvent = (line) => {
  const DRAFT_END_EVENT = '[UnityCrossThreadLogger]==> Log.BI';
  const isDraftEndEvent = !((line.indexOf(DRAFT_END_EVENT) === -1)
  || (line.indexOf('\\\"fromSceneName\\\": \\\"Draft\\\"') === -1)
  || (line.indexOf('\\\"toSceneName\\\": \\\"DeckBuilder\\\"') === -1));
  
  return isDraftEndEvent;
}

// const [,lineRawData] = line.split(DRAFT_END_EVENT);
//   const parsedData = JSON.parse(lineRawData)
  
const stop = () => fs.unwatchFile(options.logFile);
  
const parseBuffer = (buffer) => {
  // Iterate over each line in the buffer.
  buffer.toString().split(options.endOfLineChar).forEach((line) => {

    // if we found the indicator for "draft end"...
    if (checkIfDraftEndEvent(line)) {
      console.log('Found end of draft!', line);
      // copy the Player.log to ./draftDataRaw
      // parse file in ./draftDataRaw
      // write formatted data to ./draftDataJSON
    }
  });
};

// Obtain the initial size of the log file before we begin watching it.
let fileSize = fs.statSync(options.logFile).size;
fs.watchFile(options.logFile, (current, previous) => {
  // Check if file modified time is less than last time.
  // If so, nothing changed so don't bother parsing.
  if (current.mtime <= previous.mtime) return; 

  // We're only going to read the portion of the file that
  // we have not read so far. Obtain new file size.
  const newFileSize = fs.statSync(options.logFile).size;

  // Calculate size difference.
  let sizeDiff = newFileSize - fileSize;

  // If less than zero then Hearthstone truncated its log file since we last read it in order to save space.
  // Set fileSize to zero and set the size difference to the current size of the file.
  if (sizeDiff < 0) {
    fileSize = 0;
    sizeDiff = newFileSize;
  }

  // Create a buffer to hold only the data we intend to read.
  const buffer = new Buffer.alloc(sizeDiff);

  // Obtain reference to the file's descriptor.
  const fileDescriptor = fs.openSync(options.logFile, 'r');

  // Synchronously read from the file starting from where we read to last time and store data in our buffer.
  fs.readSync(fileDescriptor, buffer, 0, sizeDiff, fileSize);
  fs.closeSync(fileDescriptor); // close the file

  // Set old file size to the new size for next read.
  fileSize = newFileSize;

  // Parse the line(s) in the buffer.
  parseBuffer(buffer);
});

