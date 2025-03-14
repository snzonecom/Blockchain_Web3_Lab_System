// server.js

const express = require('express');
const path = require('path');
const Web3 = require('web3');
const app = express();
const port = process.env.PORT || 3000;

// Contract ABI and address (update the address after deployment)
const contractABI = require('./contractABI.json');
const contractAddress = '0xBe97add1cF7DC0c5a06b89091Ab9b2DB7dFC61B5'; // Replace with actual address after deployment

// Configure web3 with Holesky testnet
const web3 = new Web3('https://ethereum-holesky.publicnode.com');

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/api/contract-info', (req, res) => {
    res.json({
        contractAddress: contractAddress,
        contractABI: contractABI
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});