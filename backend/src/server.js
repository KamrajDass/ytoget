const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());





app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
