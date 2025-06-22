import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { createClient } from '@deepgram/sdk';

config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

if (!deepgramApiKey) {
  console.error('Deepgram API key missing in .env');
  process.exit(1);
}

// Use createClient for Deepgram v3
const deepgram = createClient(deepgramApiKey);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected');

  let buffer = [];

  socket.on('audio', async (data) => {
    buffer.push(data);

    // Optional: implement buffer flush logic here
  });

  socket.on('stop', async () => {
    const audioBuffer = Buffer.concat(buffer);

    try {
      const { result } = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          mimetype: 'audio/webm',
          model: 'general',
          language: 'en-US'
        }
      );

      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      socket.emit('transcript', transcript || 'No transcript found');
    } catch (err) {
      console.error('Deepgram Error:', err);
      socket.emit('transcript', 'Error processing audio');
    }

    buffer = [];
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
