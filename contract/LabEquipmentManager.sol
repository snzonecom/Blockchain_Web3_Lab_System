// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LabEquipmentManager is ERC721URIStorage, Ownable {
    // Enum for equipment condition
    enum Condition { UNKNOWN, UNDAMAGED, DAMAGED }
    
    // Structure for equipment
    struct Equipment {
        string name;
        string description;
        bool isAvailable;
        address currentBorrower;
        uint256 borrowTime;
        uint256 returnTime;
        Condition currentCondition;
    }
    
    // Structure for transaction history
    struct Transaction {
        address borrower;
        uint256 borrowTime;
        uint256 returnTime; // 0 if not returned yet
        Condition returnCondition; // Condition when returned
    }
    
    // State variables
    uint256 public equipmentCount;
    mapping(uint256 => Equipment) public equipments;
    mapping(uint256 => Transaction[]) public equipmentHistory;
    
    // Equipment name counter to manage repeatable equipment
    mapping(string => uint256) private equipmentNameCount;
    
    // Events
    event EquipmentAdded(uint256 id, string name);
    event EquipmentBorrowed(uint256 id, address borrower, uint256 borrowTime);
    event EquipmentReturned(uint256 id, address borrower, uint256 returnTime, Condition condition);
    event EquipmentConditionChanged(uint256 id, Condition condition);
    
    // Constructor - Pass msg.sender to Ownable
    constructor() ERC721("LabEquipmentNFT", "LABEQ") Ownable(msg.sender) {}
    
    // Function to add new equipment and mint NFT
    function addEquipment(string memory _name, string memory _description, string memory _tokenURI) public onlyOwner {
        // Increment equipment name counter
        equipmentNameCount[_name]++;
        
        // Increment total equipment count
        equipmentCount++;
        
        // Create equipment name with counter if there are duplicates
        string memory equipmentName = _name;
        if (equipmentNameCount[_name] > 1) {
            equipmentName = string(abi.encodePacked(_name, " #", toString(equipmentNameCount[_name])));
        }
        
        // Create new equipment with unique ID
        equipments[equipmentCount] = Equipment({
            name: equipmentName,
            description: _description,
            isAvailable: true,
            currentBorrower: address(0),
            borrowTime: 0,
            returnTime: 0,
            currentCondition: Condition.UNDAMAGED // New equipment starts as undamaged
        });
        
        _mint(msg.sender, equipmentCount);
        _setTokenURI(equipmentCount, _tokenURI);
        
        emit EquipmentAdded(equipmentCount, equipmentName);
    }
    
    // Function to borrow equipment
    function borrowEquipment(uint256 _id) public {
        require(_id > 0 && _id <= equipmentCount, "Invalid equipment ID");
        require(equipments[_id].isAvailable, "Equipment is not available");
        
        equipments[_id].isAvailable = false;
        equipments[_id].currentBorrower = msg.sender;
        equipments[_id].borrowTime = block.timestamp;
        equipments[_id].returnTime = 0; // Not returned yet
        
        // Create a new transaction record and add it to history
        Transaction memory newTransaction = Transaction({
            borrower: msg.sender,
            borrowTime: block.timestamp,
            returnTime: 0, // Not returned yet
            returnCondition: Condition.UNKNOWN // Condition not yet determined
        });
        
        equipmentHistory[_id].push(newTransaction);
        
        emit EquipmentBorrowed(_id, msg.sender, block.timestamp);
    }
    
    // Function to return equipment with condition reporting
    function returnEquipment(uint256 _id, bool _isDamaged) public {
        require(_id > 0 && _id <= equipmentCount, "Invalid equipment ID");
        require(!equipments[_id].isAvailable, "Equipment is already available");
        require(equipments[_id].currentBorrower == msg.sender, "You did not borrow this equipment");
        
        uint256 returnTime = block.timestamp;
        Condition returnCondition = _isDamaged ? Condition.DAMAGED : Condition.UNDAMAGED;
        
        // Update equipment status and condition
        equipments[_id].isAvailable = true;
        equipments[_id].returnTime = returnTime;
        equipments[_id].currentCondition = returnCondition;
        
        // Update the latest transaction in history
        uint256 lastIndex = equipmentHistory[_id].length - 1;
        equipmentHistory[_id][lastIndex].returnTime = returnTime;
        equipmentHistory[_id][lastIndex].returnCondition = returnCondition;
        
        // Clear current borrower
        equipments[_id].currentBorrower = address(0);
        
        emit EquipmentReturned(_id, msg.sender, returnTime, returnCondition);
    }
    
    // Function for admin to update equipment condition (can be used for repairs)
    function updateEquipmentCondition(uint256 _id, bool _isDamaged) public onlyOwner {
        require(_id > 0 && _id <= equipmentCount, "Invalid equipment ID");
        
        Condition newCondition = _isDamaged ? Condition.DAMAGED : Condition.UNDAMAGED;
        equipments[_id].currentCondition = newCondition;
        
        emit EquipmentConditionChanged(_id, newCondition);
    }
    
    // Function to get equipment details with condition
    function getEquipment(uint256 _id) public view returns (
        string memory name,
        string memory description,
        bool isAvailable,
        address currentBorrower,
        uint256 borrowTime,
        uint256 returnTime,
        Condition condition
    ) {
        require(_id > 0 && _id <= equipmentCount, "Invalid equipment ID");
        Equipment memory equip = equipments[_id];
        return (
            equip.name,
            equip.description,
            equip.isAvailable,
            equip.currentBorrower,
            equip.borrowTime,
            equip.returnTime,
            equip.currentCondition
        );
    }
    
    // Function to get transaction history for an equipment
    function getEquipmentHistory(uint256 _id) public view returns (Transaction[] memory) {
        require(_id > 0 && _id <= equipmentCount, "Invalid equipment ID");
        return equipmentHistory[_id];
    }
    
    // Function to get total transaction count for an equipment
    function getEquipmentTransactionCount(uint256 _id) public view returns (uint256) {
        require(_id > 0 && _id <= equipmentCount, "Invalid equipment ID");
        return equipmentHistory[_id].length;
    }
    
    // Function to get condition as a string (for UI display)
    function getConditionString(Condition _condition) public pure returns (string memory) {
        if (_condition == Condition.UNDAMAGED) return "Undamaged";
        if (_condition == Condition.DAMAGED) return "Damaged";
        return "Unknown";
    }
    
    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        // Special case for 0
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        // Count digits
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        // Convert to string
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}