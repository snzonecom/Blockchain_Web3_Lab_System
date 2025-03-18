document.addEventListener('DOMContentLoaded', async () => {
    // Check if MetaMask is installed and connected
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to use this application.');
        return;
    }

    // Get contract info from API
    const response = await fetch('/api/contract-info');
    const contractInfo = await response.json();
    const contractAddress = contractInfo.contractAddress;
    const contractABI = contractInfo.contractABI;

    // Initialize Web3
    const web3 = new Web3(ethereum);

    try {
        // Get connected account
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        document.getElementById('accountAddress').textContent = account;

        // Initialize contract
        const labContract = new web3.eth.Contract(contractABI, contractAddress);

        // Check if user is admin
        const admin = await labContract.methods.admin().call();
        const isAdmin = admin.toLowerCase() === account.toLowerCase();
        document.getElementById('userRole').textContent = isAdmin ? 'Administrator' : 'User';

        if (isAdmin) {
            document.getElementById('admin-panel').classList.remove('hidden');

            // Handle adding equipment
            document.getElementById('addEquipmentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('equipmentName').value;
                const description = document.getElementById('equipmentDescription').value;

                try {
                    await labContract.methods.addEquipment(name, description).send({ from: account });
                    alert('Equipment added successfully!');
                    document.getElementById('equipmentName').value = '';
                    document.getElementById('equipmentDescription').value = '';

                    // Reload equipment list
                    loadEquipment();
                } catch (error) {
                    console.error('Error adding equipment:', error);
                    alert('Error adding equipment. See console for details.');
                }
            });
        }

        // Load equipment list
        loadEquipment();

        // Function to load equipment data
        async function loadEquipment() {
            try {
                const availableContainer = document.getElementById('available-equipment');
                const borrowedContainer = document.getElementById('borrowed-equipment');

                // Clear containers
                availableContainer.innerHTML = '';
                borrowedContainer.innerHTML = '';

                // Get all equipment IDs
                const equipmentIds = await labContract.methods.getAllEquipmentIds().call();

                if (equipmentIds.length === 0) {
                    availableContainer.innerHTML = '<div class="loading">No equipment available</div>';
                    borrowedContainer.innerHTML = '<div class="loading">No borrowed equipment</div>';
                    return;
                }

                // Loop through equipment IDs
                for (const id of equipmentIds) {
                    const equipment = await labContract.methods.getEquipment(id).call();
                    const isAvailable = equipment.isAvailable;
                    const isBorrower = equipment.currentBorrower.toLowerCase() === account.toLowerCase();

                    // Create equipment card
                    const card = document.createElement('div');
                    card.className = 'equipment-card';
                    card.innerHTML = `
                        <h3>${equipment.name}</h3>
                        <p>${equipment.description}</p>
                        <p class="status ${isAvailable ? 'available' : 'borrowed'}">
                            Status: ${isAvailable ? 'Available' : 'Borrowed'}
                        </p>
                    `;

                    // Add borrow/return button
                    const actionBtn = document.createElement('button');
                    actionBtn.className = 'btn';

                    if (isAvailable) {
                        actionBtn.textContent = 'Borrow';
                        actionBtn.addEventListener('click', async () => {
                            try {
                                // Default borrowing duration: 7 days (in seconds)
                                const duration = 7 * 24 * 60 * 60;
                                await labContract.methods.borrowEquipment(id, duration).send({ from: account });
                                alert('Equipment borrowed successfully!');
                                loadEquipment();
                            } catch (error) {
                                console.error('Error borrowing equipment:', error);
                                alert('Error borrowing equipment. See console for details.');
                            }
                        });
                        availableContainer.appendChild(card);
                    } else {
                        // Add borrower info
                        const borrowerInfo = document.createElement('p');
                        borrowerInfo.innerHTML = `Borrower: ${equipment.currentBorrower.substring(0, 8)}...`;
                        card.appendChild(borrowerInfo);

                        // Add return deadline
                        const deadline = new Date(equipment.returnDeadline * 1000);
                        const deadlineInfo = document.createElement('p');
                        deadlineInfo.innerHTML = `Return by: ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}`;
                        card.appendChild(deadlineInfo);

                        // Show return button only to the borrower
                        if (isBorrower) {
                            actionBtn.textContent = 'Return';
                            actionBtn.addEventListener('click', async () => {
                                try {
                                    await labContract.methods.returnEquipment(id).send({ from: account });
                                    alert('Equipment returned successfully!');
                                    loadEquipment();
                                } catch (error) {
                                    console.error('Error returning equipment:', error);
                                    alert('Error returning equipment. See console for details.');
                                }
                            });
                        } else {
                            actionBtn.textContent = 'Not Available';
                            actionBtn.disabled = true;
                        }
                        borrowedContainer.appendChild(card);
                    }

                    card.appendChild(actionBtn);
                }
            } catch (error) {
                console.error('Error loading equipment:', error);
            }
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});