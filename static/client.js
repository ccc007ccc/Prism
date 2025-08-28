// static/client.js
async function log(msg) {
  const pre = document.getElementById("log");
  if (pre) {
    pre.textContent += msg + "\n";
  } else {
    console.log(msg);
  }
}

/* ---------- 摄像头端 ---------- */
if (document.getElementById("start-camera")) {
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const localVideo = document.getElementById("localVideo");
  let pc = null;
  let stream = null;

  function getConstraintsByRes(res) {
    if (res === "high") return { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    if (res === "low") return { video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: false };
    return { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
  }

  startBtn.addEventListener("click", async () => {
    const camId = document.getElementById("camera-id").value || ("cam" + Math.floor(Math.random()*1000));
    const res = document.getElementById("res").value || "medium";
    try {
      stream = await navigator.mediaDevices.getUserMedia(getConstraintsByRes(res));
      localVideo.srcObject = stream;
    } catch (e) {
      await log("无法获取摄像头: " + e);
      return;
    }

    pc = new RTCPeerConnection();
    // add tracks to pc
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    pc.oniceconnectionstatechange = () => log("camera pc state: " + pc.iceConnectionState);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // send offer to server
    const resp = await fetch("/offer_camera?camera_id=" + encodeURIComponent(camId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sdp: pc.localDescription.sdp, type: pc.localDescription.type }),
    });
    const data = await resp.json();
    await pc.setRemoteDescription({ sdp: data.sdp, type: data.type });
    log("camera connected as " + camId);
  });

  stopBtn.addEventListener("click", async () => {
    if (pc) {
      try { pc.close(); } catch (e) {}
      pc = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      localVideo.srcObject = null;
    }
    log("camera stopped");
  });
}

/* ---------- 查看端 ---------- */
if (document.getElementById("start-view")) {
  const startBtn = document.getElementById("start-view");
  const stopBtn = document.getElementById("stop-view");
  const remoteVideo = document.getElementById("remoteVideo");
  let pc = null;

  startBtn.addEventListener("click", async () => {
    const camId = document.getElementById("camera-id").value || "cam1";
    const quality = document.getElementById("quality").value || "medium";

    pc = new RTCPeerConnection();

    pc.ontrack = (evt) => {
      // attach first stream
      remoteVideo.srcObject = evt.streams[0];
      log("viewer got track, streams count: " + evt.streams.length);
    };

    pc.oniceconnectionstatechange = () => log("viewer pc state: " + pc.iceConnectionState);

    // create data channel optionally (for control msgs)
    const dc = pc.createDataChannel("control");
    dc.onopen = () => log("control channel open");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // send to server to obtain answer for this camera id & quality
    const resp = await fetch("/offer_viewer?camera_id=" + encodeURIComponent(camId) + "&quality=" + encodeURIComponent(quality), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sdp: pc.localDescription.sdp, type: pc.localDescription.type }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      log("offer_viewer failed: " + resp.status + " - " + txt);
      return;
    }

    const data = await resp.json();
    await pc.setRemoteDescription({ sdp: data.sdp, type: data.type });
    log("viewer connected to " + camId + " (quality=" + quality + ")");
  });

  stopBtn.addEventListener("click", async () => {
    if (pc) {
      try { pc.close(); } catch (e) {}
      pc = null;
      remoteVideo.srcObject = null;
    }
    log("viewer stopped");
  });
}
