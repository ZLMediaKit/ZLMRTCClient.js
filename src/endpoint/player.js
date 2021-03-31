
import { setLogger } from '../ulity/debug';
import * as debug from '../ulity/debug';
import Event from '../ulity/event';
import adapter from 'webrtc-adapter';
import Events from '../base/event';
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

        this.e = {
            onicecandidate:this._onIceCandidate.bind(this),
            ontrack:this._onTrack.bind(this),
            onicecandidateerror:this._onIceCandidateError.bind(this)
        };

        this.pc = new RTCPeerConnection(null);

        this.pc.onicecandidate = this.e.onicecandidate;
        this.pc.onicecandidateerror = this.e.onicecandidateerror;
        this.pc.ontrack = this.e.ontrack;
        /*
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
        axios({
            method: 'post',
            url:this.options.zlmsdpUrl,
            responseType:'text'
        }).then(response=>{
            debug.log('offer:',response.data);
            let desc = new RTCSessionDescription();
            desc.sdp = response.data;
            desc.type = 'offer';
            this.pc.setRemoteDescription(desc).then(()=>{
                this.pc.createAnswer().then(answer=>{
                    debug.log('answer:',answer.sdp);
                    this.pc.setLocalDescription(answer).then(()=>{

                    }).catch(e=>
                    {
                        debug.error('setLocalDescription failed:',e);
                    });
                }).catch(e=>{
                    debug.error('creater answer failed:',e);
                });
            }).catch(e=>{
                debug.error('set remote failed:',e);
            });
        }).catch(e=>{
            debug.error('get anwser failed:',e);
        });
        */

        this.start();
    }

    start()
    {
        const offerOptions = {};
        if (typeof this.pc.addTransceiver === 'function') {
            // |direction| seems not working on Safari.
            this.pc.addTransceiver('audio', { direction: 'recvonly' });
            this.pc.addTransceiver('video', { direction: 'recvonly' });
        } else {
            offerOptions.offerToReceiveAudio = true;
            offerOptions.offerToReceiveVideo = true;
        }

        this.pc.createOffer(offerOptions).then((desc)=>{
            debug.log(this.TAG,'offer:',desc.sdp);
            this.pc.setLocalDescription(desc).then(() => {
                axios({
                    method: 'post',
                    url:this.options.zlmsdpUrl,
                    responseType:'json'
                }).then(response=>{
                    let ret =  JSON.parse(response.data);
                    if(ret.code != 0)
                    {// mean failed for offer/anwser exchange 
                        this.dispatch(Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED,ret);
                        return;
                    }

                    anwser.sdp = ret.sdp;
                    anwser.type = 'anwser';
                    debug.log(this.TAG,'anwser:',ret.sdp);

                    this.pc.setRemoteDescription(anwser).then(()=>{
                        debug.log(this.TAG,'set remote sucess');
                    }).catch(e=>{
                        debug.error(e);
                    });

                });
            });
        }).catch(e=>{
            debug.error(this.TAG,e);
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
        if(this.options.element && event.streams && event.streams.length>0)
        {
            this.options.element.srcObject = event.streams[0];
            this.dispatch(Events.WEBRTC_ON_REMOTE_STREAMS,event);
        }
        else
        {
            debug.error('element pararm is failed');
        }
    }

    _onIceCandidateError(event){
        this.dispatch(Events.WEBRTC_ICE_CANDIDATE_ERROR,event);
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
