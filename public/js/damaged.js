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

    // Marking damaged equipment as available again
    document.querySelectorAll(".repair-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const equipmentId = button.getAttribute("data-id");

            try {
                const accounts = await web3.eth.getAccounts(); // Get admin's wallet address
                await contract.methods.updateEquipmentCondition(equipmentId, false)
                    .send({ from: accounts[0] });

                alert("Equipment marked as available again!");
                location.reload();
            } catch (error) {
                console.error("Error updating equipment condition:", error);
                alert("Failed to update equipment condition.");
            }
        });
    });

});
