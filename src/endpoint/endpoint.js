
import { setLogger } from '../ulity/debug';
import * as debug from '../ulity/debug';
import Event from '../ulity/event';
import Events from '../base/event';
import axios from 'axios';
import * as Base from '../base/export';

export default class RTCEndpoint extends Event
{
    constructor(options)
    {
        super('RTCPusherPlayer');
        this.TAG = '[RTCPusherPlayer]';

        let defaults = {
            element: '',// html video element
            debug: false,// if output debug log
            zlmsdpUrl:'',
            simulecast:false
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

        this._remoteStream = null;
        this._localStream = null;

        this.pc = new RTCPeerConnection(null);

        this.pc.onicecandidate = this.e.onicecandidate;
        this.pc.onicecandidateerror = this.e.onicecandidateerror;
        this.pc.ontrack = this.e.ontrack;

        this.start();
    }

    start()
    {
        let audioConstraints = new Base.AudioTrackConstraints(Base.AudioSourceInfo.MIC);
        let videoConstraints = new Base.VideoTrackConstraints(Base.VideoSourceInfo.CAMERA);

        Base.MediaStreamFactory.createMediaStream(new Base.StreamConstraints(
            audioConstraints, videoConstraints)).then(stream => {

                this._localStream = stream;

                this.dispatch(Events.WEBRTC_ON_LOCAL_STREAM,stream);
                const  AudioTransceiverInit = {
                    direction: 'sendrecv',
                    sendEncodings:[]
                  };
                const VideoTransceiverInit= {
                    direction: 'sendrecv',
                    sendEncodings:[],
                  };

                if(this.options.simulecast)
                {
                    VideoTransceiverInit.sendEncodings = [
                        {rid: 'q', active: true, scaleResolutionDownBy: 4.0},
                        {rid: 'h', active: true, scaleResolutionDownBy: 2.0},
                        {rid: 'f', active: true}
                    ];
                }

                let audioTransceiver = this.pc.addTransceiver(stream.getAudioTracks()[0],
                    AudioTransceiverInit);
                let videoTransceiver = this.pc.addTransceiver(stream.getVideoTracks()[0],
                VideoTransceiverInit);

                /*
                stream.getTracks().forEach((track,idx)=>{
                    debug.log(this.TAG,track);
                    this.pc.addTrack(track);
                });
                */
                this.pc.createOffer().then((desc)=>{
                    debug.log(this.TAG,'offer:',desc.sdp);
                    this.pc.setLocalDescription(desc).then(() => {
                        axios({
                            method: 'post',
                            url:this.options.zlmsdpUrl,
                            responseType:'json',
                            data:desc.sdp,
                            headers:{
                                'Content-Type':'text/plain;charset=utf-8'
                            }
                        }).then(response=>{
                            let ret =  JSON.parse(response.data);
                            if(ret.code != 0)
                            {// mean failed for offer/anwser exchange 
                                this.dispatch(Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED,ret);
                                return;
                            }
                            let anwser = {};
                            anwser.sdp = ret.sdp;
                            anwser.type = 'anwser';
                            debug.log(this.TAG,'anwser:',ret.sdp);
        
                            this.pc.setRemoteDescription(anwser).then(()=>{
                                debug.log(this.TAG,'set remote sucess');
                            }).catch(e=>{
                                debug.error(this.TAG,e);
                            });
                        });
                    });
                }).catch(e=>{
                    debug.error(this.TAG,e);
                });

            }).catch(e=>{
                debug.error(this.TAG,e);
            });
        
        //const offerOptions = {};
        /*
        if (typeof this.pc.addTransceiver === 'function') {
            // |direction| seems not working on Safari.
            this.pc.addTransceiver('audio', { direction: 'recvonly' });
            this.pc.addTransceiver('video', { direction: 'recvonly' });
        } else {
            offerOptions.offerToReceiveAudio = true;
            offerOptions.offerToReceiveVideo = true;
        }
        */



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
            this._remoteStream = event.streams[0];

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

        if(this._localStream)
        {
            this._localStream.getTracks().forEach((track,idx)=>{
                track.stop();
            });
        }

        if(this._remoteStream)
        {
            this._remoteStream.getTracks().forEach((track,idx)=>{
                track.stop();
            });
        }
    }

    get remoteStream()
    {
        return this._remoteStream;
    }
    
    get localStream()
    {
        return this._localStream;
    }
}
