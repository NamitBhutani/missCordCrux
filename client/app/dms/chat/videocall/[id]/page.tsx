"use client";
import { useEffect, useRef, useState } from "react";
import * as SocketIOClient from "socket.io-client";
import Peer, * as SimplePeer from "simple-peer";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
function Video({ peer: peer }: { peer: SimplePeer.Instance }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // console.log(peer);
    peer.on("stream", (stream) => {
      console.log(peer);
      console.log(stream);
      if (ref.current) ref.current.srcObject = stream;
    });
  });

  return (
    <video ref={ref} autoPlay playsInline className="h-2/5 w-2/5 border" />
  );
}

let videoSize: { height: number; width: number };
if (typeof window !== "undefined") {
  videoSize = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2,
  };
}
export default function Room({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient<Database>();
  const [peers, setPeers] = useState<
    { peerID: string; peer: SimplePeer.Instance }[]
  >([]);
  const peersRef = useRef<{ peerID: string; peer: SimplePeer.Instance }[]>([]);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const isUserInDataRef = useRef<boolean>();
  const roomID = params.id;

  useEffect(() => {
    socketRef.current = SocketIOClient.io(
      process.env.NEXT_PUBLIC_IO_URL as string
      // "http://localhost:6969"
    );
    const fetchMembersAndSetupConnection = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("dm_members")
        .select("member")
        .eq("id", roomID);

      const isUserInData = data?.some(
        (member) => member.member === user?.email
      );
      isUserInDataRef.current = isUserInData;
      if (isUserInDataRef.current) {
        navigator.mediaDevices
          .getUserMedia({ video: videoSize, audio: true })
          .then((stream) => {
            if (userVideoRef.current) {
              userVideoRef.current.srcObject = stream;
            }
            if (socketRef.current) {
              socketRef.current.emit("join room", {
                roomID: roomID,
                isUserInRoom: isUserInDataRef.current,
              });
            }
            socketRef.current?.on("peers list", (users: string[]) => {
              const newPeers: { peerID: string; peer: SimplePeer.Instance }[] =
                [];
              users.forEach((userID) => {
                const peer = makePeer(userID, socketRef.current!.id, stream);
                peersRef.current.push({
                  peerID: userID,
                  peer,
                });
                newPeers.push({ peerID: userID, peer });
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
                const peer = connectPeer(
                  payload.signal,
                  payload.callerID,
                  stream
                );
                peersRef.current.push({
                  peerID: payload.callerID,
                  peer,
                });
                const peerWithID = {
                  peer,
                  peerID: payload.callerID,
                };
                setPeers((currentPeers) => [...currentPeers, peerWithID]);
              }
            );

            socketRef.current?.on("receive return answer", (payload) => {
              const item = peersRef.current.find(
                (p) => p.peerID === payload.id
              );
              if (item) {
                item.peer.signal(payload.signal);
              }
            });
            socketRef.current?.on("user disconnect", (id: string) => {
              const peerWithID = peersRef.current.find((p) => p.peerID === id);
              if (peerWithID) {
                peerWithID.peer.destroy();
              }
              const peers = peersRef.current.filter((p) => p.peerID !== id);
              peersRef.current = peers;
              setPeers(peers);
            });
          });
      } else if (!isUserInDataRef.current) {
        console.log("not in data" + isUserInDataRef.current);
      }
    };
    fetchMembersAndSetupConnection();
  });

  function makePeer(
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
      socketRef.current?.emit("send offer", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  function connectPeer(
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
      socketRef.current?.emit("return answer", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div className="flex flex-wrap m-auto p-6 h-screen">
      <video
        ref={userVideoRef}
        playsInline
        autoPlay
        muted
        className="h-2/5 w-2/5 "
      />
      {peers.map((peer) => (
        <Video key={peer.peerID} peer={peer.peer} />
      ))}
    </div>
  );
}
