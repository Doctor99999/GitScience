// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GitScience™ AmanatSplitter v3.4-HARDENED
 * @notice Децентрализованный смарт-контракт маршрутизации авторских роялти Аманата.
 * @dev Применяет единый золотой стандарт консенсуса Fair-Share:
 *      - 5500 bps (55%) Авторский пул (распределяется по CRediT CASRAI)
 *      - 1500 bps (15%) Фонд независимых рецензентов и валидаторов
 *      - 3000 bps (30%) Фонд Создателя протокола / Protocol Treasury
 *      - +20% B2B Tax Gross-Up для корпоративных покупателей и клиник
 *      - Устойчивые низкоуровневые безопасные переводы SafeERC20 для поддержки USDT/USDC.
 */

contract AmanatSplitter {
    address public immutable founderWallet;
    address public immutable infrastructurePool;

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant AUTHOR_POOL_BPS = 5500; // 55%
    uint256 public constant INFRA_POOL_BPS  = 1500; // 15%
    uint256 public constant FOUNDER_BPS     = 3000; // 30%
    uint256 public constant B2B_TAX_GROSSUP_BPS = 2000; // +20%

    struct Contributor {
        address wallet;
        uint256 weightBasisPoints; // Сумма всех weightBasisPoints должна быть 10000 (100% от авторского пула)
    }

    event RoyaltyDistributed(
        bytes32 indexed registrationCodeHash,
        address indexed buyer,
        uint256 baseAmount,
        uint256 invoiceTotalWithGrossUp,
        uint256 authorPoolDisbursed,
        uint256 infraPoolDisbursed,
        uint256 founderDisbursed
    );

    constructor(address _founderWallet, address _infrastructurePool) {
        require(_founderWallet != address(0), "Invalid founder wallet");
        require(_infrastructurePool != address(0), "Invalid infra pool");
        founderWallet = _founderWallet;
        infrastructurePool = _infrastructurePool;
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0xa9059cbb, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "GS: SafeTransfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, from, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "GS: SafeTransferFrom failed");
    }

    /**
     * @notice Распределяет роялти в ERC-20 (USDT / USDC) по единой формуле 55 / 15 / 30 с B2B Gross-Up (+20%)
     */
    function settleAmanatRoyalty(
        address tokenAddress,
        bytes32 registrationCodeHash,
        uint256 baseAmount,
        Contributor[] calldata authors
    ) external {
        require(baseAmount > 0, "Base amount must be > 0");
        require(authors.length > 0, "At least one author required");

        // Проверка суммы долей авторов
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < authors.length; i++) {
            totalWeight += authors[i].weightBasisPoints;
        }
        require(totalWeight == BPS_DENOMINATOR, "Author weights must sum to 10000 bps");

        // Расчет инвойса с учетом B2B Tax Gross-Up (+20%)
        uint256 invoiceTotal = baseAmount + (baseAmount * B2B_TAX_GROSSUP_BPS / BPS_DENOMINATOR);

        // Безопасное списание средств с покупателя (поддерживает стандартный и нестандартный USDT)
        _safeTransferFrom(tokenAddress, msg.sender, address(this), invoiceTotal);

        // 1. Распределение авторского пула (55% от baseAmount)
        uint256 authorTotal = (baseAmount * AUTHOR_POOL_BPS) / BPS_DENOMINATOR;
        for (uint256 i = 0; i < authors.length; i++) {
            uint256 authorShare = (authorTotal * authors[i].weightBasisPoints) / BPS_DENOMINATOR;
            if (authorShare > 0 && authors[i].wallet != address(0)) {
                _safeTransfer(tokenAddress, authors[i].wallet, authorShare);
            }
        }

        // 2. Распределение фонда инфраструктуры и рецензентов (15% от baseAmount)
        uint256 infraTotal = (baseAmount * INFRA_POOL_BPS) / BPS_DENOMINATOR;
        _safeTransfer(tokenAddress, infrastructurePool, infraTotal);

        // 3. Распределение фонда Создателя (30% от baseAmount) + остаток налогового Gross-Up
        uint256 founderTotal = invoiceTotal - authorTotal - infraTotal;
        _safeTransfer(tokenAddress, founderWallet, founderTotal);

        emit RoyaltyDistributed(
            registrationCodeHash,
            msg.sender,
            baseAmount,
            invoiceTotal,
            authorTotal,
            infraTotal,
            founderTotal
        );
    }
}
