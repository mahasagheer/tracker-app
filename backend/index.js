const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/screenshots', express.static(path.join(__dirname, '../test_screenshots')));

// Use modular routes
app.use('/api', require('./routes'));

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 