// Reuse verified source identities without rebuilding any underlying datasets.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {buildGlobalIndex} from '../app/global-catalog.mjs';
const source=new URL('../app/data/guess-players.json',import.meta.url);
const destination=new URL('../app/data/global-player-index.json',import.meta.url);
const index=buildGlobalIndex(JSON.parse(await readFile(source,'utf8')));
await writeFile(destination,JSON.stringify(index));
console.log(JSON.stringify({path:fileURLToPath(destination),players:index.players.length,leagues:index.meta.scope}));
