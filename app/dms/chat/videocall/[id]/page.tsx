"use client";
import { useEffect, useRef, useState } from "react";
import * as SocketIOClient from "socket.io-client";
import Peer, * as SimplePeer from "simple-peer";
import Video from "@/customComponents/Video";

let videoConstraints: { height: number; width: number };
if (typeof window !== "undefined") {
  videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2,
  };
}
export default function Room({ params }: { params: { id: String } }) {
  const [peers, setPeers] = useState<SimplePeer.Instance[]>([]);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<{ peerID: string; peer: SimplePeer.Instance }[]>([]);
  const roomID = params.id;

  useEffect(() => {
    socketRef.current = SocketIOClient.io("http://localhost:8000");

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
        if (socketRef.current) {
          socketRef.current.emit("join room", roomID);
        }
        // const userPeer = createPeer("user", socketRef.current!.id, stream);
        // peersRef.current.push({
        //   peerID: "user",
        //   peer: userPeer,
        // });
        // setPeers([userPeer]);
        socketRef.current?.on("users list", (users: string[]) => {
          const newPeers: SimplePeer.Instance[] = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socketRef.current!.id, stream);
            peersRef.current.push({
              peerID: userID,
              peer,
            });
            newPeers.push(peer);
          });
          setPeers(newPeers);
        });

        socketRef.current?.on(
          "user joined",
          (payload: {
            userToSignal: string;
            signal: any;
            callerID: string;
          }) => {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current.push({
              peerID: payload.callerID,
              peer,
            });
            setPeers((currentPeers) => [...currentPeers, peer]);
          }
        );

        socketRef.current?.on("receive return signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
          //  else {
          //   if (userVideo.current?.srcObject) {
          //     userVideo.current.srcObject = stream;
          //     const newPeer = addPeer(payload.signal, payload.id, stream);

          //     // Add the new peer to your list of peers
          //     peersRef.current.push({
          //       peerID: payload.id,
          //       peer: newPeer,
          //     });

          //     // Update the state with the new peer
          //     setPeers((currentPeers) => [...currentPeers, newPeer]);
          //   }
          // }
        });
      });
  }, [roomID]);

  function createPeer(
    userToSignal: string,
    callerID: string,
    stream: MediaStream
  ) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal: SimplePeer.SignalData) => {
      socketRef.current?.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  function addPeer(
    incomingSignal: SimplePeer.SignalData,
    callerID: string,
    stream: MediaStream
  ) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal: SimplePeer.SignalData) => {
      socketRef.current?.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div>
      <video muted ref={userVideo} autoPlay playsInline />
      {peers.length}
      {peers.map((peer, index) => (
        <Video key={index} peer={peer} />
      ))}
    </div>
  );
}
