function navigateIfEnabled(url) {
    const targetDiv = event.currentTarget; // Get the clicked div
    if (!targetDiv.classList.contains("disabled")) {
        // Get the account from localStorage
        const account = localStorage.getItem("account");
        let finalUrl = url;

        // Ensure URL starts with a "/"
        if (!url.startsWith("/")) {
            finalUrl = "/" + url;
        }

        // Append account parameter if applicable
        if (finalUrl === "/user") {
            finalUrl += `?account=${encodeURIComponent(account)}`;
        }

        window.location.href = finalUrl;
    } else {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You are not allowed to access this feature. You should login first",
            confirmButtonColor: "#d33"
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const userOption = document.getElementById("user-option");
    const adminPanel = document.getElementById("admin-panel");

    const role = localStorage.getItem("role");

    if (role === "Admin") {
        adminPanel.classList.remove("disabled");
        adminPanel.classList.add("active");
        userOption.classList.remove("active");
    } else {
        adminPanel.classList.add("disabled");
        userOption.classList.add("active");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");
    const accountInfo = document.getElementById("account-info");
    const accountAddress = document.getElementById("accountAddress");
    const userRole = document.getElementById("userRole");

    const userOption = document.getElementById("user-option");
    const adminPanel = document.getElementById("admin-panel");

    let accounts = [];

    // Initially disable both options
    function disableAllOptions() {
        userOption.classList.add("disabled");
        adminPanel.classList.add("disabled");
    }
    disableAllOptions();

    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install MetaMask to use this application.");
        connectButton.disabled = true;
        return;
    }

    async function updateUI(account) {
        accountAddress.textContent = account;
        accountInfo.classList.remove("hidden");
        connectButton.textContent = "Connect Other Account";
        disconnectButton.classList.remove("hidden");

        // Simulate fetching role from smart contract (replace with actual call)
        const role = await getRoleFromContract(account);
        userRole.textContent = role;

        // Enable the correct option based on role
        disableAllOptions();
        if (role === "Admin") {
            adminPanel.classList.remove("disabled");
        } else if (role === "User") {
            userOption.classList.remove("disabled");
        }

        localStorage.setItem("connected", "true");
        localStorage.setItem("account", account);
        localStorage.setItem("role", role);
    }

    async function getRoleFromContract(account) {
        try {
            const web3 = new Web3(window.ethereum);
            const response = await fetch("/api/contract-info");
            const { contractAddress, contractABI } = await response.json();
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            // Fetch owner from contract (correct method)
            const owner = await contract.methods.owner().call();

            return owner.toLowerCase() === account.toLowerCase() ? "Admin" : "User";
        } catch (error) {
            console.error("Error fetching role:", error);
            return "User";
        }
    }


    // Check for stored session
    if (localStorage.getItem("connected") === "true") {
        const storedAccount = localStorage.getItem("account");
        const storedRole = localStorage.getItem("role");

        if (storedAccount) {
            updateUI(storedAccount);
        }
    }

    connectButton.addEventListener("click", async () => {
        try {
            accounts = await ethereum.request({ method: "eth_requestAccounts" });
            await updateUI(accounts[0]);
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    });

    disconnectButton.addEventListener("click", () => {
        localStorage.removeItem("connected");
        localStorage.removeItem("account");
        localStorage.removeItem("role");

        accountAddress.textContent = "N/A";
        userRole.textContent = "N/A";
        accountInfo.classList.add("hidden");
        connectButton.textContent = "Connect My MetaMask";
        disconnectButton.classList.add("hidden");

        disableAllOptions();
    });


});
