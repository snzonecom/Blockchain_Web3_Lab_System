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

            Swal.fire({
                title: "Mark Equipment as Available?",
                text: "Are you sure you want to update the equipment condition?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, update it",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#014d6f",
                cancelButtonColor: "#dc3545"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        Swal.fire({
                            title: "Processing...",
                            text: "Please wait while we update the equipment.",
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });
            
                        const accounts = await web3.eth.getAccounts();
                        await contract.methods.updateEquipmentCondition(equipmentId, false)
                            .send({ from: accounts[0] });
            
                        Swal.fire({
                            title: "Success!",
                            text: "Equipment marked as available again!",
                            icon: "success",
                            confirmButtonColor: "#014d6f",
                            confirmButtonText: "OK"
                        }).then(() => {
                            location.reload();
                        });
            
                    } catch (error) {
                        console.error("Error updating equipment condition:", error);
                        Swal.fire({
                            title: "Error!",
                            text: "Failed to update equipment condition.",
                            icon: "error",
                            confirmButtonColor: "#014d6f",
                            confirmButtonText: "OK"
                        });
                    }
                }
            });

            
        });
    });

});
