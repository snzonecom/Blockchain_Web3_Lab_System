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
    document.getElementById("addEquipmentBtn").addEventListener("click", async () => {
        const name = document.getElementById("equipmentName").value.trim();
        const description = document.getElementById("equipmentDescription").value.trim();
        const condition = "UNDAMAGED";

        if (!name || !description || !condition) {
            Swal.fire({
                icon: "warning",
                title: "Missing Fields",
                text: "Please fill in all fields before submitting.",
            });
            return;
        }

        try {
            // Fetch the latest equipment count from the contract to determine new ID
            const equipmentCount = await contract.methods.equipmentCount().call();
            const newEquipmentId = Number(equipmentCount) + 1;

            // Generate metadata URL dynamically
            const tokenURI = `http://localhost:3000/metadata/${newEquipmentId}.json`;

            Swal.fire({
                title: "Adding Equipment...",
                text: "Please wait while the transaction is being processed.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            // Call smart contract function to add equipment
            await contract.methods.addEquipment(name, description, condition, tokenURI)
                .send({ from: userAccount });

            Swal.fire({
                icon: "success",
                title: "Equipment Added",
                text: "The equipment has been successfully added!",
                confirmButtonColor: "#014d6f",
            }).then(() => {
                location.reload();
            });

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Transaction Failed",
                text: "Failed to add equipment. Please try again.",
                confirmButtonColor: "#014d6f",
            });
        }
    });
});
