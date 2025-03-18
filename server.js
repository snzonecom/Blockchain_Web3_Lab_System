const express = require('express');
const path = require('path');
const Web3 = require('web3');
const app = express();
const port = process.env.PORT || 3000;

// Contract ABI and address (update the address after deployment)
const contractABI = require('./contractABI.json');
const contractAddress = '0x7924e78ef1a854116ee00c12b5d0bb860f355158';

// Configure web3 with Sepolia
const web3 = new Web3('https://rpc.ankr.com/eth_sepolia');

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes

// Render the homepage (index.ejs) when the root URL is accessed
app.get('/', (req, res) => {
    res.render('index');
});

// Fetch and display the list of equipment from the smart contract
app.get('/new-equipment', async (req, res) => {
    try {
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const equipmentCount = await contract.methods.equipmentCount().call();
        const conditionMapping = {
            '1': 'Undamaged',
            '2': 'Damaged'
        };
        
        let equipmentList = [];

        for (let i = 1; i <= equipmentCount; i++) {
            const equipment = await contract.methods.getEquipment(i).call();
            const conditionIndex = equipment[6].toString();
            const conditionText = conditionMapping[conditionIndex] || 'Unknown';

            equipmentList.push({
                id: i,
                name: equipment[0],
                description: equipment[1],
                isAvailable: equipment[2],
                condition: conditionText,
                isUndamaged: conditionIndex === '1'
            });
        }

        res.render('new-equipment', { equipmentList });
    } catch (error) {
        console.error("🔥 Error in /new-equipment route:", error);
        res.render('new-equipment', { equipmentList: [] });
    }
});

// Fetch and display only damaged equipment from the smart contract
app.get('/damaged-equipment', async (req, res) => {
    try {
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const equipmentCount = await contract.methods.equipmentCount().call();

        if (equipmentCount === 0) {
            return res.render('damaged-equipment', { damagedEquipmentList: [] });
        }

        let damagedEquipmentList = [];

        for (let i = 1; i <= equipmentCount; i++) {
            const equipment = await contract.methods.equipments(i).call();
            const condition = await contract.methods.getConditionString(equipment.currentCondition).call();

            if (condition.toLowerCase() === "damaged") {
                damagedEquipmentList.push({
                    id: i,
                    name: equipment.name,
                    description: equipment.description,
                    isAvailable: equipment.isAvailable,
                    damagedTime: equipment.returnTime > 0 ? new Date(equipment.returnTime * 1000).toLocaleString() : "Not returned yet"
                });
            }
        }

        res.render('damaged-equipment', { damagedEquipmentList });
    } catch (error) {
        console.error("Error fetching damaged equipment:", error);
        res.render('damaged-equipment', { damagedEquipmentList: [] });
    }
});

// Render the record page
app.get('/record', (req, res) => {
    res.render('record', { history: null, equipmentId: null });
});

// Fetch transaction history for an equipment ID
app.get('/api/record/:id', async (req, res) => {
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    const equipmentId = req.params.id;

    try {
        const history = await contract.methods.getEquipmentHistory(equipmentId).call();

        // Format data for frontend
        const formattedHistory = history.map(tx => ({
            borrower: tx.borrower,
            borrowTime: new Date(tx.borrowTime * 1000).toLocaleString(),
            returnTime: tx.returnTime == 0 ? "Not Returned" : new Date(tx.returnTime * 1000).toLocaleString(),
            returnCondition: tx.returnCondition == 1 ? "Undamaged" : tx.returnCondition == 2 ? "Damaged" : "Unknown"
        }));

        res.json({ success: true, history: formattedHistory });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error fetching equipment history." });
    }
});

// Render the admin dashboard page
app.get('/admin', async (req, res) => {
    res.render('admin');
});


// For Viewing Metadata
app.get('/metadata/:id', async (req, res) => {
    try {
        const equipmentId = req.params.id;
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const equipment = await contract.methods.equipments(equipmentId).call();
        const condition = await contract.methods.getConditionString(equipment.currentCondition).call();

        const metadata = {
            name: equipment.name,
            description: equipment.description,
            image: `http://localhost:3000/images/${equipmentId}.jpg`,  // Placeholder, update as needed
            attributes: [
                { "trait_type": "Condition", "value": condition },
                { "trait_type": "Availability", "value": equipment.isAvailable ? "Available" : "Borrowed" }
            ]
        };

        res.json(metadata);
    } catch (error) {
        console.error("Error fetching metadata:", error);
        res.status(500).json({ error: "Error fetching metadata" });
    }
});

// Render the user dashboard AND displaying available and borrowed equipment
app.get('/user', async (req, res) => {
    try {

        const userAccount = req.query.account; // Read from query parameters
        if (!userAccount) {
            return res.status(400).send("User account is required.");
        }

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
                returnTime: equip[5],
                currentCondition: equip[6]
            };

            if (equipmentData.isAvailable && equipmentData.currentCondition !== '2') {
                equipmentList.push(equipmentData);
            } else if (equipmentData.currentBorrower.toLowerCase() === userAccount.toLowerCase()) {
                borrowedEquipment.push(equipmentData);
            }
        }

        res.render('user', { equipmentList, borrowedEquipment });
    } catch (error) {
        console.error("🔥 Error fetching equipment:", error);
        res.render('user', { equipmentList: [], borrowedEquipment: [] });
    }
});

// API endpoint to provide contract information (address and ABI)
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