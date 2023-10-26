"use client";
import { useEffect, useRef } from "react";
import * as SimplePeer from "simple-peer";

export default function Video({ peer: peer }: { peer: SimplePeer.Instance }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log("from inside cusotm video componenet");
    peer.on("stream", (stream) => {
      console.log("stream event");
      if (ref.current) {
        console.log("ref is not null");
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return <video playsInline autoPlay ref={ref} />;
}
