// server.js

const express = require('express');
const path = require('path');
const Web3 = require('web3');
const app = express();
const port = process.env.PORT || 3000;

// Contract ABI and address (update the address after deployment)
const contractABI = require('./contractABI.json');
const contractAddress = '0x8f2B61928d4523aa72c2f17BF0a95267C4460c9A'; // Replace with actual address after deployment

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

app.get('/admin', async (req, res) => {
    try {
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const equipmentCount = await contract.methods.equipmentCount().call();
        let equipmentList = [];

        for (let i = 1; i <= equipmentCount; i++) {
            const equipment = await contract.methods.equipments(i).call();
            equipmentList.push({
                id: i,
                name: equipment.name,
                description: equipment.description,
                isAvailable: equipment.isAvailable
            });
        }

        res.render('admin', { equipmentList });
    } catch (error) {
        console.error("Error fetching equipment:", error);
        res.render('admin', { equipmentList: [] });
    }
});

app.get('/user', async (req, res) => {
    try {
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const equipmentList = [];
        const borrowedEquipment = [];

        const equipmentCount = await contract.methods.equipmentCount().call();
        for (let i = 1; i <= equipmentCount; i++) {
            const equip = await contract.methods.getEquipment(i).call();
            const equipmentData = {
                id: i,
                name: equip[0],
                description: equip[1],
                isAvailable: equip[2],
                currentBorrower: equip[3],
                borrowTime: equip[4],
                returnDeadline: equip[5]
            };

            if (equipmentData.isAvailable) {
                equipmentList.push(equipmentData); // Available equipment
            } else {
                borrowedEquipment.push(equipmentData); // Borrowed equipment
            }
        }

        res.render('user', { equipmentList, borrowedEquipment });
    } catch (error) {
        console.error("Error fetching equipment:", error);
        res.render('user', { equipmentList: [], borrowedEquipment: [] });
    }
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