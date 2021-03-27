import BaseEvents from './event/base';
import PlayerEvents from './event/player';
import RTCPlayer from './player/player';


export const Events = Object.assign({}, BaseEvents, PlayerEvents);
export const Player = RTCPlayer;