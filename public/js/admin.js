document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to use this feature.");
        return;
    }

    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const response = await fetch("/api/contract-info");
    const { contractAddress, contractABI } = await response.json();
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    
    const accounts = await web3.eth.getAccounts();
    const userAccount = accounts[0];

    // Handle adding new equipment
    document.getElementById("addEquipmentForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("equipmentName").value;
        const description = document.getElementById("equipmentDescription").value;
        const tokenURI = document.getElementById("tokenURI").value;

        try {
            await contract.methods.addEquipment(name, description, tokenURI)
                .send({ from: userAccount });

            alert("Equipment added successfully!");
            location.reload();
        } catch (error) {
            console.error("Error adding equipment:", error);
            alert("Failed to add equipment.");
        }
    });
});
