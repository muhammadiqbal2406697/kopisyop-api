const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
// Menggunakan process.env.PORT agar sesuai dengan port layanan hosting online
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serving folder gambar secara publik
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Helper fungsi untuk membaca CSV
const readCSV = () => {
  return new Promise((resolve, reject) => {
    const results = [];
    const csvPath = path.join(__dirname, 'coffee_list_data.csv');

    if (!fs.existsSync(csvPath)) {
      return reject(new Error('File CSV tidak ditemukan'));
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Endpoint GET All Coffee Data
app.get('/api/coffees', async (req, res) => {
  try {
    const data = await readCSV();
    res.status(200).json({
      status: 'success',
      total: data.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Backend API Coffee Shop Berhasil Berjalan!');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});