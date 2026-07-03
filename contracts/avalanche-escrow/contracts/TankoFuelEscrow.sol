// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TankoFuelEscrow {
    enum Status {
        Funded,
        Released,
        Refunded
    }

    struct FuelEscrow {
        address manager;
        address driver;
        uint256 amount;
        string reference;
        Status status;
        uint256 createdAt;
        uint256 completedAt;
    }

    uint256 public nextEscrowId = 1;
    mapping(uint256 => FuelEscrow) public escrows;

    event FuelEscrowCreated(
        uint256 indexed escrowId,
        address indexed manager,
        address indexed driver,
        uint256 amount,
        string reference
    );
    event FuelEscrowReleased(uint256 indexed escrowId, address indexed driver, uint256 amount);
    event FuelEscrowRefunded(uint256 indexed escrowId, address indexed manager, uint256 amount);

    error InvalidDriver();
    error InvalidAmount();
    error EscrowNotFound();
    error Unauthorized();
    error InvalidStatus();
    error TransferFailed();

    function createFuelEscrow(address driver, string calldata reference)
        external
        payable
        returns (uint256 escrowId)
    {
        if (driver == address(0)) revert InvalidDriver();
        if (msg.value == 0) revert InvalidAmount();

        escrowId = nextEscrowId++;
        escrows[escrowId] = FuelEscrow({
            manager: msg.sender,
            driver: driver,
            amount: msg.value,
            reference: reference,
            status: Status.Funded,
            createdAt: block.timestamp,
            completedAt: 0
        });

        emit FuelEscrowCreated(escrowId, msg.sender, driver, msg.value, reference);
    }

    function releaseFuelEscrow(uint256 escrowId) external {
        FuelEscrow storage escrow = escrows[escrowId];
        if (escrow.manager == address(0)) revert EscrowNotFound();
        if (msg.sender != escrow.manager) revert Unauthorized();
        if (escrow.status != Status.Funded) revert InvalidStatus();

        escrow.status = Status.Released;
        escrow.completedAt = block.timestamp;

        (bool sent,) = escrow.driver.call{value: escrow.amount}("");
        if (!sent) revert TransferFailed();

        emit FuelEscrowReleased(escrowId, escrow.driver, escrow.amount);
    }

    function refundFuelEscrow(uint256 escrowId) external {
        FuelEscrow storage escrow = escrows[escrowId];
        if (escrow.manager == address(0)) revert EscrowNotFound();
        if (msg.sender != escrow.manager) revert Unauthorized();
        if (escrow.status != Status.Funded) revert InvalidStatus();

        escrow.status = Status.Refunded;
        escrow.completedAt = block.timestamp;

        (bool sent,) = escrow.manager.call{value: escrow.amount}("");
        if (!sent) revert TransferFailed();

        emit FuelEscrowRefunded(escrowId, escrow.manager, escrow.amount);
    }
}
