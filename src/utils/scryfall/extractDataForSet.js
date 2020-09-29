const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./cardData.json').toString())
 .filter((cardObj) => (cardObj.set === 'znr') && (cardObj.arena_id));

 fs.writeFileSync('./setData/znd.json', JSON.stringify(data));