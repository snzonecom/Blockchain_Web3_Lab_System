document.addEventListener("DOMContentLoaded", async function () {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install it to use this dashboard.");
        return;
    }

    const web3 = new Web3(window.ethereum);
    const contractAddress = "YOUR_CONTRACT_ADDRESS";
    const contractABI = [
        // Paste your smart contract ABI here
    ];

    const contract = new web3.eth.Contract(contractABI, contractAddress);
    let accounts;

    async function connectWallet() {
        try {
            accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const account = accounts[0];
            document.getElementById("accountAddress").textContent = account;
            getRole(account);
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    }

    async function getRole(account) {
        try {
            const role = await contract.methods.getUserRole(account).call();
            document.getElementById("userRole").textContent = role;
            
            if (role === "Admin") {
                document.getElementById("admin-panel").classList.remove("hidden");
            }
        } catch (error) {
            console.error("Error fetching role:", error);
        }
    }

    async function loadEquipment() {
        try {
            const availableEquipment = await contract.methods.getAvailableEquipment().call();
            const borrowedEquipment = await contract.methods.getBorrowedEquipment().call();
            
            displayEquipment("available-equipment", availableEquipment);
            displayEquipment("borrowed-equipment", borrowedEquipment);
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    }

    function displayEquipment(elementId, equipmentList) {
        const container = document.getElementById(elementId);
        container.innerHTML = ""; // Clear previous data
        
        if (equipmentList.length === 0) {
            container.innerHTML = "<p>No equipment available.</p>";
            return;
        }
        
        equipmentList.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("equipment-card");
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p><strong>Owner:</strong> ${item.owner}</p>
            `;
            container.appendChild(card);
        });
    }

    document.getElementById("addEquipmentForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("equipmentName").value;
        const description = document.getElementById("equipmentDescription").value;

        try {
            await contract.methods.addEquipment(name, description).send({ from: accounts[0] });
            alert("Equipment added successfully!");
            loadEquipment();
        } catch (error) {
            console.error("Error adding equipment:", error);
        }
    });

    await connectWallet();
    await loadEquipment();
});
