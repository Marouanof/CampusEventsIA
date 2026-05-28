require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CampusEventsIA Backend' });
});

app.listen(PORT, () => {
  console.log(`CampusEventsIA backend running on http://localhost:${PORT}`);
});
