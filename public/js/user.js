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

    console.log("Connected wallet:", userAccount);

    // Handle borrowing equipment
    document.querySelectorAll(".borrow-button").forEach(button => {
        button.addEventListener("click", async () => {
            const equipmentId = button.getAttribute("data-id");

            try {
                await contract.methods.borrowEquipment(equipmentId)
                    .send({ from: userAccount });

                alert("Equipment borrowed successfully!");
                location.reload();
            } catch (error) {
                console.error("Error borrowing equipment:", error);
                alert("Failed to borrow equipment.");
            }
        });
    });

    // Handle returning equipment
    document.querySelectorAll(".return-button").forEach(button => {
        button.addEventListener("click", async () => {
            const equipmentId = button.getAttribute("data-id");

            // Ask the user if the equipment is damaged
            const isDamaged = confirm("Is the equipment damaged? Click 'OK' for YES, 'Cancel' for NO.");

            try {
                const accounts = await web3.eth.getAccounts(); // Get the user's wallet address
                await contract.methods.returnEquipment(equipmentId, isDamaged)
                    .send({ from: accounts[0] });

                alert("Equipment returned successfully!");
                location.reload();
            } catch (error) {
                console.error("Error returning equipment:", error);
                alert("Failed to return equipment.");
            }
        });
    });

});
