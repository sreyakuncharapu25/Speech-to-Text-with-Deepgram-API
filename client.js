const socket = io();

let mediaRecorder;
let audioStream;

document.getElementById('start').addEventListener('click', async () => {
    socket.emit('start');

    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.connected) {
            socket.emit('audio', e.data);
        }
    };

    mediaRecorder.start(250); // send every 250ms
});

document.getElementById('stop').addEventListener('click', () => {
    socket.emit('stop');
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
});

socket.on('transcript', (data) => {
    document.getElementById('output').value += data + '\n';
});
