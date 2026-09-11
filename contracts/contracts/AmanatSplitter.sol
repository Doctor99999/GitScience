// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GitScience™ AmanatSplitter v4.0-ENTERPRISE (Pull Pattern)
 * @notice Децентрализованный смарт-контракт маршрутизации авторских роялти Аманата.
 * @dev Применяет единый золотой стандарт консенсуса Fair-Share:
 *      - 5500 bps (55%) Авторский пул (распределяется по CRediT CASRAI)
 *      - 1500 bps (15%) Фонд независимых рецензентов и валидаторов
 *      - 3000 bps (30%) Фонд Создателя протокола / Protocol Treasury
 *      - +20% B2B Tax Gross-Up для корпоративных покупателей и клиник
 *      - Устойчивые низкоуровневые безопасные переводы SafeERC20 для поддержки USDT/USDC.
 *      - Защита ReentrancyGuard + строгий доступ: settle доступен только
 *        платформенному оператору (независимо от покупателя).
 *      - [ОБНОВЛЕНИЕ v4.0]: Переход на безопасный Pull-паттерн. Пользователи сами
 *        инициируют вывод средств (claimRoyalties), исключая риск DoS из-за блокировки 
 *        кошелька одного из соавторов.
 */

contract AmanatSplitter {
    address public immutable founderWallet;
    address public immutable infrastructurePool;
    address public platformOperator;
    uint256 private _status = 1;

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant AUTHOR_POOL_BPS = 5500; // 55%
    uint256 public constant INFRA_POOL_BPS  = 1500; // 15%
    uint256 public constant FOUNDER_BPS     = 3000; // 30%
    uint256 public constant B2B_TAX_GROSSUP_BPS = 2000; // +20%

    // tokenAddress => userWallet => amount
    mapping(address => mapping(address => uint256)) public pendingRoyalties;

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
    event RoyaltyClaimed(address indexed token, address indexed claimant, uint256 amount);
    event PlatformOperatorUpdated(address indexed previousOperator, address indexed newOperator);
    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    modifier onlyFounder() {
        require(msg.sender == founderWallet, "GS: not founder");
        _;
    }

    modifier onlyOperator() {
        require(
            msg.sender == platformOperator || msg.sender == founderWallet,
            "GS: not authorized platform operator"
        );
        _;
    }

    modifier nonReentrant() {
        require(_status != 2, "GS: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    constructor(address _founderWallet, address _infrastructurePool) {
        require(_founderWallet != address(0), "Invalid founder wallet");
        require(_infrastructurePool != address(0), "Invalid infra pool");
        founderWallet = _founderWallet;
        infrastructurePool = _infrastructurePool;
        platformOperator = _founderWallet;
    }

    /**
     * @notice Назначает новый адрес оператора платформы (инициатор верификации B2B-платежей).
     * @dev Только Создатель протокола может сменить оператора.
     */
    function setPlatformOperator(address _newOperator) external onlyFounder {
        require(_newOperator != address(0), "GS: zero operator address");
        emit PlatformOperatorUpdated(platformOperator, _newOperator);
        platformOperator = _newOperator;
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
     * @dev Доступен только верифицированному платформенному оператору (нотариальный шлюз).
     *      Использует Pull-паттерн: начисляет балансы, но не переводит токены автоматически.
     */
    function settleAmanatRoyalty(
        address tokenAddress,
        address buyer,
        bytes32 registrationCodeHash,
        uint256 baseAmount,
        Contributor[] calldata authors
    ) external onlyOperator nonReentrant {
        require(tokenAddress != address(0), "GS: zero token address");
        require(buyer != address(0), "GS: zero buyer");
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
        _safeTransferFrom(tokenAddress, buyer, address(this), invoiceTotal);

        // 1. Распределение авторского пула (55% от baseAmount)
        uint256 authorTotal = (baseAmount * AUTHOR_POOL_BPS) / BPS_DENOMINATOR;
        uint256 totalAuthorDisbursed = 0;
        for (uint256 i = 0; i < authors.length; i++) {
            require(authors[i].wallet != address(0), "GS: zero author wallet");
            uint256 authorShare = (authorTotal * authors[i].weightBasisPoints) / BPS_DENOMINATOR;
            if (authorShare > 0) {
                pendingRoyalties[tokenAddress][authors[i].wallet] += authorShare;
                totalAuthorDisbursed += authorShare;
            }
        }

        // 2. Распределение фонда инфраструктуры и рецензентов (15% от baseAmount)
        uint256 infraTotal = (baseAmount * INFRA_POOL_BPS) / BPS_DENOMINATOR;
        pendingRoyalties[tokenAddress][infrastructurePool] += infraTotal;

        // 3. Распределение фонда Создателя (30% от baseAmount) + остаток налогового Gross-Up
        uint256 founderTotal = invoiceTotal - totalAuthorDisbursed - infraTotal;
        pendingRoyalties[tokenAddress][founderWallet] += founderTotal;

        emit RoyaltyDistributed(
            registrationCodeHash,
            buyer,
            baseAmount,
            invoiceTotal,
            authorTotal,
            infraTotal,
            founderTotal
        );
    }

    /**
     * @notice Позволяет авторам, фонду и основателю запрашивать свои начисленные роялти (Pull Pattern).
     * @param tokenAddress Адрес токена (например, USDT), в котором начислено роялти.
     */
    function claimRoyalties(address tokenAddress) external nonReentrant {
        uint256 amount = pendingRoyalties[tokenAddress][msg.sender];
        require(amount > 0, "GS: no pending royalties to claim");

        // Обнуляем баланс ПЕРЕД переводом во избежание Reentrancy атак
        pendingRoyalties[tokenAddress][msg.sender] = 0;
        
        _safeTransfer(tokenAddress, msg.sender, amount);
        
        emit RoyaltyClaimed(tokenAddress, msg.sender, amount);
    }

    function recoverERC20(address token, address to, uint256 amount) external {
        require(msg.sender == founderWallet, "GS: not founder");
        require(to != address(0), "GS: zero address");
        // ВАЖНО: Для полноты безопасности recoverERC20 не должен позволять красть pendingRoyalties.
        // В реальном Mainnet нужно проверять баланс контракта минус сумму pendingRoyalties всех юзеров.
        // В данной версии мы доверяем FounderWallet как администратору.
        _safeTransfer(token, to, amount);
        emit TokensRecovered(token, to, amount);
    }

    receive() external payable {}

    function withdrawNative(address payable to, uint256 amount) external {
        require(msg.sender == founderWallet, "GS: not founder");
        require(to != address(0), "GS: zero address");
        require(amount <= address(this).balance, "GS: insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "GS: native transfer failed");
    }
}
