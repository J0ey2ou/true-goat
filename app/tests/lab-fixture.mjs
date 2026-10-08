import {mergeGlobalCatalog} from '../global-catalog.mjs';
import {normalizeCatalog,mergeSelectedPlayers} from '../player-library.mjs';
import {applyOpponentContext} from '../opponent-context.mjs';
export async function loadLabFixture(base) {
  const [payload,catalog,global,opponents]=await Promise.all(['players','player-catalog','global-player-index','opponent-context'].map(async file=>(await fetch(base+'/data/'+file+'.json')).json()));
  const profiles=normalizeCatalog(mergeGlobalCatalog(catalog,global)).players;
  const rawPlayers=mergeSelectedPlayers(payload.players,profiles.map(p=>p.model),'player_id');
  return {payload,directory:new Map(profiles.map(p=>[p.id,p])),rawPlayers,players:state=>applyOpponentContext(rawPlayers,opponents,{enabled:state?.opponentEnabled!==false})};
}
