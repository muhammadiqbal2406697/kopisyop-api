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

    // Membaca CSV dengan separator titik koma (;)
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row, index) => {
        // Pembersihan karakter bermasalah (\uFFFD / karakter tidak dikenal)
        let title = row.coffee_title || `Coffee ${index + 1}`;
        let detail = row.coffee_detail || '';

        // Membersihkan simbol replacement character akibat encoding CSV
        title = title.replace(/\uFFFD/g, 'è').replace(/\?/g, 'è');
        detail = detail.replace(/\uFFFD/g, "'").replace(/\?/g, "'");

        const thumbnailFile = row.coffee_thumbnails ? row.coffee_thumbnails.trim() : 'caffe_latte_thumbnail.png';
        const posterFile = row.coffee_poster ? row.coffee_poster.trim() : 'caffe_latte_poster.jpg';

        results.push({
          coffee_id: parseInt(row.coffee_id || index + 1),
          coffee_title: title.trim(),
          coffee_detail: detail.trim(),
          coffee_thumbnails: `${baseUrl}/images/${thumbnailFile}`,
          coffee_poster: `${baseUrl}/images/${posterFile}`
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