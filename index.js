
// "[UnityCrossThreadLogger]==> Event.ReadyDraft" indicated the draft is ready

const fs = require('fs');

// USE LOG NOTIFICATION INSTEAD
const DRAFT_NOTIFICATION = "[UnityCrossThreadLogger]Draft.Notify";
const MAKE_HUMAN_DRAFT_PICK = "[UnityCrossThreadLogger]==> Draft.MakeHumanDraftPick";

const LOG_NOTIFICATIONS = {
  DRAFT_INIT: '[UnityCrossThreadLogger]<== Draft.Notification',
  DRAFT_PACK_UPDATE: '[UnityCrossThreadLogger]Draft.Notify',
  DRAFT_PICK_WAS_MADE: '[UnityCrossThreadLogger]==> Draft.MakeHumanDraftPick'
}

const METHODS = {
  DRAFT_START: 'DraftStart',
  CARDS_IN_PACK: 'CardsInPack',
  CARD_SELECTED: 'CardSelected'
}

const getEventType = (eventLog) => {
  const { DRAFT_INIT, DRAFT_PACK_UPDATE, DRAFT_PICK_WAS_MADE } = LOG_NOTIFICATIONS;
  const { DRAFT_START, CARDS_IN_PACK, CARD_SELECTED } = METHODS;
  const isDraftInitEvent = (eventLog.indexOf(DRAFT_INIT) !== -1) && (eventLog.indexOf('SelfSeat') !== -1);
  const isDraftPackUpdateEvent = (eventLog.indexOf(DRAFT_PACK_UPDATE) !== -1);
  const isDraftPickMadeEvent = (eventLog.indexOf(DRAFT_PICK_WAS_MADE) !== -1);
  //console.log("isDraftInitEvent", isDraftInitEvent);
  //console.log("isDraftPackUpdateEvent", isDraftPackUpdateEvent)
  //console.log("isDraftPickMadeEvent", isDraftPickMadeEvent);

  if (isDraftInitEvent) return DRAFT_START;
  if (isDraftPackUpdateEvent) return CARDS_IN_PACK;
  if (isDraftPickMadeEvent) return CARD_SELECTED;
  return null;
}

const extractDraftInitData = (data) => {
  try {
      //console.log(data)
    const [, parsedData] = data.split(LOG_NOTIFICATIONS.DRAFT_INIT);
    const { payload } = JSON.parse(parsedData);
    return JSON.parse(payload);
  } catch (e) {
    console.error('Error in extractDraftInitData', e);
  }
}

// TableInfo.PickInfo.PackCards
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

const extractPlayerDraftPickData = (draftPickData) => {
  try {

    const [, parsedData] = draftPickData.split(MAKE_HUMAN_DRAFT_PICK);
    const { request } = JSON.parse(parsedData);
    return JSON.parse(request);
  }catch (e) {
    console.error('Error in extractPlayerDraftPickData', e);
}
}

const constructDraftPackUpdateObj = (data) => {
  const [, cardsInPack] = data.split(DRAFT_NOTIFICATION);
  const parsedData = JSON.parse(cardsInPack);
  return {
    method: METHODS.CARDS_IN_PACK,
    draftId: parsedData.draftId,
    packNumber: parsedData.SelfPack,
    pickNumber: parsedData.SelfPick,
    cardsInPack: parsedData.PackCards.split(',').filter(Boolean),
  };
};

const constructDraftPickObj = (data) => {
  const { params: { draftId, cardId, packNumber, pickNumber } } = extractPlayerDraftPickData(data);
  return {
    method: METHODS.CARD_SELECTED,
    draftId,
    packNumber: parseInt(packNumber, 10),
    pickNumber: parseInt(pickNumber, 10),
    selectedCardId: cardId,
  }
};

const formatDraftLogs = (data) => {
  const { DRAFT_START, CARDS_IN_PACK, CARD_SELECTED } = METHODS;
  const eventType = getEventType(data);

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

  if (draftData.method === METHODS.CARDS_IN_PACK) {
    //console.log("CARDS IN PACK")
    acc.push({
      draftId: draftData.draftId,
      packNumber: draftData.packNumber,
      pickNumber: draftData.pickNumber,
      cardsInPack: draftData.cardsInPack,
      selectedCardId: null,
    });
  }

  if (
      (draftData.method === METHODS.CARD_SELECTED)
      && (acc[acc.length - 1].draftId === draftData.draftId)
      && (acc[acc.length - 1].packNumber === draftData.packNumber)
      && (acc[acc.length - 1].pickNumber === draftData.pickNumber)
      ) {
    acc[acc.length - 1].selectedCardId = draftData.selectedCardId;
  }

  return acc;
}

const groupByDraftId = (acc, draftData) => {

  if (!acc[draftData.draftId]) {
    acc[draftData.draftId] = {
        set: null,
        date: null,
        draftOrder: []
    }
  }

  acc[draftData.draftId].draftOrder.push(draftData);

  return acc;
}

try {
  const data = fs.readFileSync('Player.log');

  // split contents by newline
  const allDraftData = data
      .toString()
      .split(/\r?\n/)
      .filter(getEventType)
      .map(formatDraftLogs)
      .filter(Boolean) // Removes holes in the array
      .reduce(condenseDraftData, [])
      .reduce(groupByDraftId, {});

  console.log(allDraftData);

} catch(e) {
    console.error('Error caught in top level', error);
}


