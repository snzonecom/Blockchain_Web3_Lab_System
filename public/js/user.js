function showTab(tabId) {
    // Hide all equipment lists
    document.querySelectorAll('.equipment-list').forEach(list => {
        list.classList.remove('active');
    });

    // Show the selected tab
    document.getElementById(tabId).classList.add('active');

    // Update active tab styling
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

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

    // console.log("Connected wallet:", userAccount);

    // Handle borrowing equipment
    document.querySelectorAll(".borrow-button").forEach(button => {
        button.addEventListener("click", async () => {
            const equipmentId = button.getAttribute("data-id");

            try {
                Swal.fire({
                    title: "Processing...",
                    text: "Please wait while we process your request.",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                await contract.methods.borrowEquipment(equipmentId)
                    .send({ from: userAccount });

                Swal.fire({
                    title: "Success!",
                    text: "Equipment borrowed successfully!",
                    icon: "success",
                    confirmButtonColor: "#014d6f",
                    confirmButtonText: "OK"
                }).then(() => {
                    location.reload();
                });

            } catch (error) {
                console.error("Error borrowing equipment:", error);
                Swal.fire({
                    title: "Error!",
                    text: "Failed to borrow equipment.",
                    icon: "error",
                    confirmButtonColor: "#014d6f",
                    confirmButtonText: "OK"
                });
            }
        });
    });

    // Handle returning equipment
    document.querySelectorAll(".return-button").forEach(button => {
        button.addEventListener("click", async () => {
            const equipmentId = button.getAttribute("data-id");

            Swal.fire({
                title: "Is the equipment damaged?",
                text: "Click 'Yes' if the equipment is damaged, or 'No' if it is undamaged.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, it's damaged",
                cancelButtonText: "No, it's fine",
                confirmButtonColor: "#d33",
                cancelButtonColor: "#28a745"
            }).then(async (result) => {
                if (result.isConfirmed || result.dismiss === Swal.DismissReason.cancel) {
                    const isDamaged = result.isConfirmed;

                    try {
                        Swal.fire({
                            title: "Processing...",
                            text: "Please wait while we process your return.",
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });

                        const accounts = await web3.eth.getAccounts();
                        await contract.methods.returnEquipment(equipmentId, isDamaged)
                            .send({ from: accounts[0] });

                        Swal.fire({
                            title: "Success!",
                            text: "Equipment returned successfully!",
                            icon: "success",
                            confirmButtonColor: "#014d6f",
                            confirmButtonText: "OK"
                        }).then(() => {
                            location.reload();
                        });

                    } catch (error) {
                        console.error("Error returning equipment:", error);
                        Swal.fire({
                            title: "Error!",
                            text: "Failed to return equipment.",
                            icon: "error",
                            confirmButtonColor: "#014d6f",
                            confirmButtonText: "OK"
                        });
                    }
                }
            });
        });
    });

    // For '/user' endpoint -- getting the connected account
    document.addEventListener("DOMContentLoaded", async () => {
        if (typeof window.ethereum === "undefined") {
            alert("Please install MetaMask to use this feature.");
            return;
        }

        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const accounts = await web3.eth.getAccounts();
        const userAccount = accounts[0];

        // Send request with userAccount in the query string
        const userPageResponse = await fetch(`/user?account=${encodeURIComponent(userAccount)}`);

        const userPageText = await userPageResponse.text();

        document.body.innerHTML = userPageText; // Render the response in the page
    });


});
