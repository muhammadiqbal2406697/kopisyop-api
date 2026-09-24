const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Serving folder gambar publik
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Helper function membaca & memetakan CSV ke format JSON Array
const getCoffeeData = (req) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const csvPath = path.join(__dirname, 'coffee_list_data.csv');
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    if (!fs.existsSync(csvPath)) {
      return reject(new Error('File CSV tidak ditemukan'));
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row, index) => {
        // Menyesuaikan struktur key JSON seperti milik temanmu
        results.push({
          coffee_id: parseInt(row.id || index + 1),
          coffee_title: row.name || row.title || row.nama || 'Coffee Item',
          coffee_detail: row.description || row.deskripsi || '',
          coffee_thumbnails: `${baseUrl}/images/${row.thumbnail || 'caffe_latte_thumbnail.png'}`,
          coffee_poster: `${baseUrl}/images/${row.poster || 'caffe_latte_poster.jpg'}`
        });
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Route Utama (/) & Route (/api/coffees) mengembalikan Array JSON
app.get(['/', '/api/coffees'], async (req, res) => {
  try {
    const data = await getCoffeeData(req);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});