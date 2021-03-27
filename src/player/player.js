
import { setLogger } from '../ulity/debug';
import * as debug from '../ulity/debug';
import Event from '../ulity/event';
import adapter from 'webrtc-adapter';
import BaseEvents from '../event/base';
import PlayerEvents from '../event/player';
import axios from 'axios';

export default class RTCPlayer extends Event
{
    constructor(options)
    {
        super('RTCPlayer');
        this.TAG = '[RTCPlayer]';

        let defaults = {
            element: '',// html video element
            debug: false,// if output debug log
            zlmsdpUrl:''
        };
        
        this.options = Object.assign({}, defaults, options);

        if(this.options.debug)
        {
            setLogger();
        }
        debug.log(this.TAG,'version= 21212');
        debug.log(this.TAG,`adapter ${adapter}`);

        this.e = {
            onicecandidate:this._onIceCandidate.bind(this),
            ontrack:this._onTrack.bind(this),
            onicecandidateerror:this._onIceCandidateError.bind(this)
        };

        this.pc = new RTCPeerConnection(null);

        this.pc.onicecandidate = this.e.onicecandidate;
        this.pc.onicecandidateerror = this.e.onicecandidateerror;
        this.pc.ontrack = this.e.ontrack;

        this.pc.createOffer().then(
            offer=>{
                this.pc.setLocalDescription(offer).then(()=>{
                    axios({
                        method: 'post',
                        url:this.options.zlmsdpUrl,
                        data:offer.sdp,
                        responseType:'text'
                    }).then(response=>{
                        let desc = new RTCSessionDescription();
                        desc.sdp = response.data;
                        desc.type = 'answer';
                        this.pc.setRemoteDescription(desc);
                    }).catch(e=>{
                        debug.error('get anwser failed:',e);
                    });
                });
            }
        ).catch(e=>{
            debug.error('create offer error:',e);
        });

        

    }
    _onIceCandidate(event) {
        if (event.candidate) {    
            debug.log('Remote ICE candidate: \n ' + event.candidate.candidate);
            // Send the candidate to the remote peer
        }
        else {
            // All ICE candidates have been sent
        }
    }

    _onTrack(event){
        if(this.options.element)
        {
            this.options.element.srcObject = event.streams[0];
            this.dispatch(PlayerEvents.PLAYER_EVENT_WEBRTC_PLAY_SUCESSS,event);
        }
        else
        {
            debug.error('element pararm is failed');
        }
    }

    _onIceCandidateError(event){
        this.dispatch(BaseEvents.BASE_EVENT_WEBRTC_ICE_CANDIDATE_ERROR,event);
    }

    close()
    {
        if(this.pc)
        {
            this.pc.close();
            this.pc=null;
        }

        if(this.options)
        {
            this.options=null;
        }
    }

    
}
