require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');


const app = express();
connectDB();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



app.get('/', (req, res) => {
  res.send('🌟 Server is running! Welcome to the API.');
});


app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contact', require('./routes/contact'));


// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


module.exports = app;

