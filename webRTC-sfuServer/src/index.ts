import nodeDataChannel, { DescriptionType } from 'node-datachannel';
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

let senderStream;
const consumerPeers = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/consumer", async ({ body }, res) => {
    const peer = new nodeDataChannel.PeerConnection('consumerPeer', {
        iceServers: [
            "stun:stun.stunprotocol.org"

        ]
    });
    await peer.setRemoteDescription(body.sdp, DescriptionType.Offer);
    senderStream.getTracks().forEach(track => peer.addTrack(track));
    const answer = peer.localDescription();
    await peer.onLocalDescription((sdp, type) => { handleLocalDescription(peer, sdp, type) });
    const payload = {
        sdp: answer.sdp
    }

    res.json(payload);
});

app.post('/broadcast', async ({ body }, res) => {
    const peer = new nodeDataChannel.PeerConnection('broadcasterPeer', {
        iceServers: [
            "stun:stun.stunprotocol.org"
        ]
    });
    peer.onTrack = (e) => handleTrackEvent(e, peer);
    await peer.setRemoteDescription(body.sdp, DescriptionType.Answer);
    const answer = await peer.localDescription();
    await peer.onLocalDescription((sdp, type) => { handleLocalDescription(peer, sdp, type) });
    const payload = {
        sdp: answer.sdp
    }

    res.json(payload);
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
};

function handleLocalDescription(peer, sdp, type) {
    peer.setLocalDescription(sdp, type);
}

app.listen(5000, () => console.log('server started'));