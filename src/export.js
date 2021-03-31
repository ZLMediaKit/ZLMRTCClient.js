import * as events from './base/event';
import * as compile from './ulity/version';
import * as media from './base/export';
import * as endpoint from './endpoint/endpoint';



console.log('build date:',compile.BUILD_DATE);
console.log('version:',compile.VERSION);

export const Events = events.default;
export const Media = media;
export const Endpoint = endpoint.default;