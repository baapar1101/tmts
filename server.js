const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

const pk =   "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9+3UngYmgCdFA\nDGAEQd0KhJhUfV6wHCsz8AaSmX0evbge3PeG2wgTtgZtDkiBmkuwqTcp1AshyXoX\nmfduFrkYCCoSWtTPZif1mU3L/eNSfkjPV1Eywxn5XHJntUaoGju0rLPXYo0CKDDk\nvlSczRXHu6ihRmDYRqMd5CCsBRAXzObHML75sUwFr5DjyvwcneMxcrKwbHbFQ1fy\nn7ErGZVhYb9a1G4XspwY3Vzjg/Akv/141QPxDP93jc5HRgk6jMAHfDMJQw7T4GLS\nZhit63R6ygV3Z64wBzkV4XpL3eBiszog97JXxORmoGJfXLViFu1BFiByd3MwU5so\nVNXanBflAgMBAAECggEAE35MMJAJk4q+VkCOz5EEgbJGQREWGKLjSfJ8cilenbtg\nu4X3vfYWd5NLSIBZLzcqQgey2c9gjwhxxx8stLaPKmiYDIcWY+t6+SfQRDiaTRoZ\nFXFDqx46uYvjT0HZ7KC4dJrt3xFFH64JCkd/PhGLBRH7xQSIJljlHsmMEqp4UsCt\nmt2RVTKaj5KleRSnuFzGVCieRGxoz/V1TWGV3QNHne6lfU38WcLOWs6lQVWm5m9O\nsocoqX3dnyTnxTbsulR997EX72OZDjpsjbWrgAoWoMPzgY0rnaLRGR34XX2xO6rv\ncXXTEYDqNYAS7ZoIF91igcJO498X1xxG4wtilyFjpwKBgQDvStvJVVe5ZRvNeX7X\nZengFyyZE7OK46Y+UkkIPe0icghkAUXgOjjnBi9WU5Jbbb6rJngzcVVywgQofvZE\niaDtCPgHBtlSi6TdjW+8Jn1hkk0W8xsEHEn2kKPwAzIAGER74PFNUDf17qi+Icwv\nvghOsrgAeXzpQknwjgmZL/i/gwKBgQDLPzkuG70xAnwVDBHnfzKbFGACY1gyPTy8\nUtBSS4YnxvdPqg5nzhba1XawWqZJ/+t7yTPmudRTeIyGbW6DB7Y6zaulOWJtnh5e\nEk1S47BKMOTGj//LkRsER2mbSJLzcfYsDBZwoNbHWu2rhi8h2E8E65HHpNhc9jMC\noHNqGioGdwKBgQCxKpFzjRY4E130UYHR5Ii1+zJv26BQsp/BAJdF3OOXXypLMI4V\np8W9dlzR42o2+xfyC7dvDvge0PrXKLkYoXVeSgeo3C9G6FEWH8OcYDrwZKti1Hcq\nIe+49/oIl7ULUOxTc4X0ofHsydhxfQB6UI5CBhwpbclHwmaQDfmZS2U2FQKBgFIz\nreKyIWCTCrBQg2VHkqYaJYKRv3gCQHBCZjMCjK3F0PyNYOom9iNntms5HoxLT2hv\nReiJPBDObrdnxwyDr/Y0fLmEbgS7sLiHWnKt1/0JrV2JnAEvHOgsIdBGF/kSHGhQ\nMzs2MefLJNj8mk9r9vmcdQdz6nYetR7Y2hUNo/WdAoGBAJnkiYPGIAFbIWHzjhmy\nq018Z2xvQ7pnkqkpkpYIXDg8uhDzqgizD1ZjS90SUq8Lav/EBGR5IuXvKqtjA9vA\nSRbmFtbIe8bZhiNMrlDgL508FbmJmoZDiFzzsEvnsjVb8+nxIBeBw1CA/YVlX2Jh\nPvbsFEFk4+gxr2wtvO3X9wzb\n-----END PRIVATE KEY-----\n"

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Load credentials for Google Sheets API
const doc = new GoogleSpreadsheet('1kZNHPF-h5ZzDETRFFq4TlDlNIC3yIytvK29G2JgVFac'); // Replace with your Google Sheets ID

// Initialize Google Sheets
async function accessSpreadsheet() {
    await doc.useServiceAccountAuth({
        client_email: "tmts-690@superb-avatar-414713.iam.gserviceaccount.com",
        private_key: pk.replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
}

// Search for product descriptions
app.get('/search', async (req, res) => {
    const query = req.query.query;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const results = rows
        .filter(row => (row['عنوان کالا'].includes(query) || row['IMEI 1'].includes(query)) && !row['خریدار'])
        .map(row => {
            console.log(`Found product: ${row['عنوان کالا']} with IMEI: ${row['IMEI 1']}`);
            return {
                productName: row['عنوان کالا'],
                imei: row['IMEI 1']
            };
        });

    console.log('Search results:', results);
    res.json(results);
});

app.get('/get-imei', async (req, res) => {
    const imei = req.query.imei;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const product = rows.find(row => row['IMEI 1'] === imei);

    if (product) {
        console.log(`Product details for IMEI ${imei}:`, {
            productName: product['عنوان کالا'],
            imei: product['IMEI 1']
        });
        res.json({
            productName: product['عنوان کالا'],
            imei: product['IMEI 1']
        });
    } else {
        console.error('Product not found for IMEI:', imei);
        res.status(404).send('Product not found');
    }
});
// Get products
app.get('/get-products', async (req, res) => {
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[1]; // Sheet 2 = Products
    const rows = await sheet.getRows();
    const products = rows.map(row => ({
        title: row['عنوان کالا']
    }));
    res.json(products);
});

// Get sellers
app.get('/get-vendors', async (req, res) => {
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[2]; // Sheet 3 = Sellers
    const rows = await sheet.getRows();
    const sellers = rows.map(row => ({
        name: row['نام فروشنده']
    }));
    res.json(sellers);
});

// Get buyers
app.get('/get-buyers', async (req, res) => {
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[3]; // Sheet 4 = Buyers
    const rows = await sheet.getRows();
    const buyers = rows.map(row => ({
        name: row['نام خریدار']
    }));
    res.json(buyers);
});

// Get purchase invoices
app.get('/get-purchase-invoices', async (req, res) => {
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0]; // Sheet 1 = Invoices
    const rows = await sheet.getRows();
    const purchaseInvoices = rows.filter(row => row['فی خرید']).map(row => ({
        product: row['نام محصول'],
        seller: row['فروشنده'],
        date: row['تاریخ'],
        price: row['فی خرید']
    }));
    res.json(purchaseInvoices);
});

// Get sales invoices
app.get('/get-sales-invoices', async (req, res) => {
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0]; // Sheet 1 = Invoices
    const rows = await sheet.getRows();
    const salesInvoices = rows.filter(row => row['فی فروش']).map(row => ({
        product: row['نام محصول'],
        buyer: row['خریدار'],
        date: row['تاریخ'],
        price: row['فی فروش']
    }));
    res.json(salesInvoices);
});

//  invoices
app.get('/get-invoices', async (req, res) => {
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0]; // Sheet 1 = Invoices
    const rows = await sheet.getRows();
    const salesInvoices = rows.filter(row => row['فی فروش']).map(row => ({
        product: row['نام محصول'],
        buyer: row['خریدار'],
        date: row['تاریخ'],
        seller: row['فروشنده'],
        date: row['تاریخ'],
        price: row['فی خرید'],
        purchasePrice: row['فی فروش']
    }));
    res.json(salesInvoices);
});

// Submit a product
app.post('/submit-product', async (req, res) => {
    const { title, imei1, imei2 } = req.body;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[1]; // Sheet 2 = Products
    await sheet.addRow({
        'عنوان کالا': title,
        'IMEI 1': imei1,
        'IMEI 2': imei2
    });
    res.send('Product added');
});

// Submit a seller
app.post('/submit-seller', async (req, res) => {
    const { name } = req.body;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[2]; // Sheet 3 = Sellers
    await sheet.addRow({
        'نام فروشنده': name
    });
    res.send('Seller added');
});

// Submit a buyer
app.post('/submit-buyer', async (req, res) => {
    const { name } = req.body;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[3]; // Sheet 4 = Buyers
    await sheet.addRow({
        'نام خریدار': name
    });
    res.send('Buyer added');
});

// Submit a purchase invoice
app.post('/submit-purchase-invoice', async (req, res) => {
    const { product, seller, date, price } = req.body;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0]; // Sheet 1 = Invoices
    await sheet.addRow({
        'عنوان کالا': product,
        'فروشنده': seller,
        'تاریخ فاکتور': date,
        'فی خرید': price
    });
    res.send('Purchase invoice added');
});

// Submit a sales invoice
app.post('/submit-sales-invoice', async (req, res) => {
    const { productSearch, buyer, purchasePrice, invoiceNumber } = req.body;
    await accessSpreadsheet();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();


    // Find the row with the older product number
    const selectedRow = rows.find(row =>  row['IMEI 1'] === productSearch);
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});