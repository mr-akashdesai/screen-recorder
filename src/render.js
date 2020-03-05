const { desktopCapturer, remote } = require("electron");
const { dialog, Menu } = remote;
const { writeFile } = require("fs");

let mediaRecorder;
const recordedChunks = [];

const videoElement = document.querySelector("video");
const startBtn = document.getElementById("startBtn");

startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add("uk-button-danger");
  stopBtn.removeAttribute("disabled");
  startBtn.innerText = "Recording";
};
const stopBtn = document.getElementById("stopBtn");

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove("uk-button-danger");
  stopBtn.setAttribute("disabled", "true");
  startBtn.innerText = "Start";
};
const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getvideoSources;

async function getvideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"]
  });
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webml codecs=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  if (filePath) {
    writeFile(filePath, buffer, () => console.log("video saved bitch"));
  }
}
