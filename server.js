const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Load credentials for Google Sheets API
const creds = require('https://tmts.storage.c2.liara.space/superb-avatar-414713-d988b52d769b.json'); // Path to the downloaded credentials file

const doc = new GoogleSpreadsheet('1kZNHPF-h5ZzDETRFFq4TlDlNIC3yIytvK29G2JgVFac'); // Replace with your Google Sheets ID

// Initialize Google Sheets
async function initGoogleSheets() {
    await doc.useServiceAccountAuth({
        client_email: creds.client_email,
        private_key: creds.private_key.replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
}

// Search for product descriptions
app.get('/search', async (req, res) => {
    const query = req.query.query;
    await initGoogleSheets();
    const sheet = doc.sheetsByIndex[0]; // Assuming the data is in the first sheet
    const rows = await sheet.getRows();

    // Ensure correct column name referencing
    const uniqueDescriptions = [...new Set(rows
        .filter(row => !row['فی فروش']) // Filter out rows where 'خریدار' is not empty
        .map(row => row['عنوان کالا'])
        .filter(desc => desc && desc.includes(query)))];
    
    res.json(uniqueDescriptions);
});

// Get IMEI for a selected product
app.get('/get-imei', async (req, res) => {
    const product = req.query.product;
    await initGoogleSheets();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const selectedRow = rows.find(row => row['عنوان کالا'] === product);
    if (!selectedRow) {
        return res.status(404).send('Product not found');
    }

    res.json({ imei: selectedRow['IMEI 1'] });
});

// Submit new invoice
app.post('/submit', async (req, res) => {
    const { productSearch, buyer, purchasePrice, invoiceNumber } = req.body;
    await initGoogleSheets();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Find the row with the older product number
    const selectedRow = rows.find(row => row['عنوان کالا'] === productSearch);
    if (!selectedRow) {
        return res.status(400).send('Product not found');
    }

    // Update the selected row with new data
    selectedRow['خریدار'] = buyer;
    selectedRow['فی فروش'] = purchasePrice;
    selectedRow['شماره فاکتور فروش سپیدار'] = invoiceNumber;
    await selectedRow.save();

    res.status(200).send('Invoice registered successfully');
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
