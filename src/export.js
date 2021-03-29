import BaseEvents from './event/base';
import PlayerEvents from './event/player';
import RTCPlayer from './player/player';
import * as compile from './ulity/version';



console.log('build date:',compile.BUILD_DATE);
console.log('version:',compile.VERSION);

export const Events = Object.assign({}, BaseEvents, PlayerEvents);
export const Player = RTCPlayer;
