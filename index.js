const fs = require('fs');

const LOG_NOTIFICATIONS = {
  DRAFT_READY: '[UnityCrossThreadLogger]<== Event.ReadyDraft',
  DRAFT_INIT: '[UnityCrossThreadLogger]<== Draft.Notification',
  DRAFT_PACK_UPDATE: '[UnityCrossThreadLogger]Draft.Notify',
  DRAFT_PICK_WAS_MADE: '[UnityCrossThreadLogger]==> Draft.MakeHumanDraftPick'
}

const METHODS = {
  DRAFT_READY: 'DraftReady', // Need to change this name or change log name
  DRAFT_START: 'DraftStart',
  CARDS_IN_PACK: 'CardsInPack',
  CARD_SELECTED: 'CardSelected'
}

const getEventType = (eventLog) => {
  const { DRAFT_READY, DRAFT_INIT, DRAFT_PACK_UPDATE, DRAFT_PICK_WAS_MADE } = LOG_NOTIFICATIONS;
  const { DRAFT_READY: READY, DRAFT_START, CARDS_IN_PACK, CARD_SELECTED } = METHODS;

  const isDraftReadyEvent = (eventLog.indexOf(DRAFT_READY) !== -1) && (eventLog.indexOf('InternalEventName') !== -1);
  const isDraftInitEvent = (eventLog.indexOf(DRAFT_INIT) !== -1) && (eventLog.indexOf('SelfSeat') !== -1);
  const isDraftPackUpdateEvent = (eventLog.indexOf(DRAFT_PACK_UPDATE) !== -1);
  const isDraftPickMadeEvent = (eventLog.indexOf(DRAFT_PICK_WAS_MADE) !== -1);

  if (isDraftReadyEvent) return READY;
  if (isDraftInitEvent) return DRAFT_START;
  if (isDraftPackUpdateEvent) return CARDS_IN_PACK;
  if (isDraftPickMadeEvent) return CARD_SELECTED;
  
  return null;
}

// Need to make this DRY later
const extractDraftReadyData = (data) => {
  try {
    const [, parsedData] = data.split(LOG_NOTIFICATIONS.DRAFT_READY);
    const { payload } = JSON.parse(parsedData);
    return payload
  } catch (e) {
    console.error('Error in extractDraftReadyData', e);
  }
}

const constructDraftReadyObj = (data) => {
  const { InternalEventName, ModuleInstanceData } = extractDraftReadyData(data);
  const [draftType, setName, setReleaseDate] = InternalEventName.split('_');
  const { DraftId, ScreenName } = ModuleInstanceData['HumanDraft._internalState'];
  // TODO maybe add slahes to date and use bo1 or bo3 for the draftType?
  return {
    method: METHODS.DRAFT_READY,
    draftId: DraftId,
    draftType,
    setName,
    setReleaseDate,
    playerName: ScreenName,
  }
}

const extractDraftInitData = (data) => {
  try {
    const [, parsedData] = data.split(LOG_NOTIFICATIONS.DRAFT_INIT);
    const { payload } = JSON.parse(parsedData);
    return JSON.parse(payload);
  } catch (e) {
    console.error('Error in extractDraftInitData', e);
  }
}

const constructDraftInitObj = (data) => {
  const draftInitData = extractDraftInitData(data);
  return {
    method: METHODS.CARDS_IN_PACK,
    draftId: draftInitData.DraftId,
    packNumber: 1,
    pickNumber: 1,
    cardsInPack: draftInitData.PickInfo.PackCards,
}
};

const constructDraftPackUpdateObj = (data) => {
  const [, cardsInPack] = data.split(LOG_NOTIFICATIONS.DRAFT_PACK_UPDATE);
  const parsedData = JSON.parse(cardsInPack);
  return {
    method: METHODS.CARDS_IN_PACK,
    draftId: parsedData.draftId,
    packNumber: parsedData.SelfPack,
    pickNumber: parsedData.SelfPick,
    cardsInPack: parsedData.PackCards.split(',').filter(Boolean),
  };
};

const extractPlayerDraftPickData = (draftPickData) => {
  try {
    const [, parsedData] = draftPickData.split(LOG_NOTIFICATIONS.DRAFT_PICK_WAS_MADE);
    const { request } = JSON.parse(parsedData);
    return JSON.parse(request);
  } catch (e) {
    console.error('Error in extractPlayerDraftPickData', e);
  }
}

const constructDraftPickObj = (data) => {
  const { params: { draftId, cardId, packNumber, pickNumber } } = extractPlayerDraftPickData(data);
  return {
    method: METHODS.CARD_SELECTED,
    draftId,
    packNumber: parseInt(packNumber, 10),
    pickNumber: parseInt(pickNumber, 10),
    selectedCardId: parseInt(cardId, 10),
  }
};

const formatDraftLogs = (data) => {
  const { DRAFT_READY, DRAFT_START, CARDS_IN_PACK, CARD_SELECTED } = METHODS;
  const eventType = getEventType(data);

  if (eventType === DRAFT_READY) {
    return constructDraftReadyObj(data);
  }

  if (eventType === DRAFT_START) {
    return constructDraftInitObj(data);
  }

  if (eventType === CARDS_IN_PACK) {
    return constructDraftPackUpdateObj(data);
  }

  if(eventType === CARD_SELECTED) {
    return constructDraftPickObj(data);
  }

  return null;
}

const condenseDraftData = (acc, draftData) => {

  if (draftData.method === METHODS.DRAFT_READY) {
    acc.push({
      draftId: draftData.draftId,
      draftType: draftData.draftType,
      setName: draftData.setName,
      setReleaseDate: draftData.setReleaseDate,
      playerName: draftData.playerName,
    });
  }

  if (draftData.method === METHODS.CARDS_IN_PACK) {
    acc.push({
      draftId: draftData.draftId,
      packNumber: draftData.packNumber,
      pickNumber: draftData.pickNumber,
      cardsInPack: draftData.cardsInPack,
      selectedCardId: null,
    });
  }

  const lastElement = acc[acc.length - 1];
  if (
      (draftData.method === METHODS.CARD_SELECTED)
      && (lastElement.draftId === draftData.draftId)
      && (lastElement.packNumber === draftData.packNumber)
      && (lastElement.pickNumber === draftData.pickNumber)
      ) {
    lastElement.selectedCardId = draftData.selectedCardId;
  }

  return acc;
}

const groupByDraftId = (acc, draftData) => {

  if (!acc[draftData.draftId]) {
    acc[draftData.draftId] = {
        ...draftData,
        draftOrder: [],
    }
    return acc
  }

  acc[draftData.draftId].draftOrder.push(draftData);

  return acc;
}

const convertRawLogDataToJson = (data) => {
  return data
    .split(/\r?\n/)
    .filter(getEventType)
    .map(formatDraftLogs)
    .filter(Boolean) // Removes holes in the array
    .reduce(condenseDraftData, [])
    .reduce(groupByDraftId, {});
}

try {
  const rawDraftLogDataDir = './draftDataRaw'
  const fileNames = fs.readdirSync(rawDraftLogDataDir);

  if (fileNames.length < 1) {
    throw new Error('No raw draft data to parse!');
  }
  
  const draftDataOutputDir = './draftDataJSON';

  fileNames
    .filter((fileName) => fileName.indexOf('done' === -1))
    .map((fileName) => {
      const rawLogDataPath = `${rawDraftLogDataDir}/${fileName}`;
      const rawLogData = fs.readFileSync(rawLogDataPath).toString();
      const draftObj = convertRawLogDataToJson(rawLogData);
      return {
        draftObj,
        fileName,
        rawLogDataPath,
      }
    })
    .forEach(({ draftObj, fileName, rawLogDataPath }) => {
        Object.keys(draftObj).forEach((draftUUID) => {
          if (!draftObj[draftUUID]) {
            throw new Error(`UUID ${draftUUID} does not exist!`);
          }
    
          const outputPath = `${draftDataOutputDir}/${draftUUID}.json`;
          if (!fs.existsSync(outputPath)) {
            fs.writeFileSync(outputPath, JSON.stringify(draftObj[draftUUID]));
          }
        });
        // Rename the raw data txt file so we know we parsed it.
        const [UUID] = Object.keys(draftObj)
        fs.renameSync(rawLogDataPath, `${rawDraftLogDataDir}/done-${fileName}-${UUID}`);
      });
} catch(e) {
    console.error('Error caught in top level', e);
}




