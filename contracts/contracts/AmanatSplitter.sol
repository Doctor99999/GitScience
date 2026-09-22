// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GitScience™ AmanatSplitter v4.1-ENTERPRISE (Pull Pattern, Tax Escrow)
 * @notice Децентрализованный смарт-контракт маршрутизации авторских роялти Аманата.
 * @dev Применяет единый золотой стандарт консенсуса Fair-Share:
 *      - 5500 bps (55%) Авторский пул (распределяется по CRediT CASRAI)
 *      - 1500 bps (15%) Фонд независимых рецензентов и валидаторов
 *      - 3000 bps (30%) Фонд Создателя протокола / Protocol Treasury (ровно от базы)
 *      - +20% B2B Tax Gross-Up для корпоративных покупателей и клиник
 *      - [ОБНОВЛЕНИЕ v4.1]: Налоговый gross-up (+20%) направляется в tax-escrow
 *        и доступен Создателю протокола только после 48-часового timelock
 *        (releaseTaxEscrow). Основателю начисляется РОВНО 30% от baseAmount —
 *        без тихого присвоения остатков и налоговой надбавки.
 *      - Устойчивые низкоуровневые безопасные переводы SafeERC20 для USDT/USDC.
 *      - Защита ReentrancyGuard + строгий доступ: settle доступен только
 *        платформенному оператору (независимо от покупателя).
 *      - [ОБНОВЛЕНИЕ v4.0]: Переход на безопасный Pull-паттерн. Пользователи сами
 *        инициируют вывод средств (claimRoyalties), исключая риск DoS из-за блокировки
 *        кошелька одного из соавторов.
 */

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract AmanatSplitter {
    address public immutable founderWallet;
    address public immutable infrastructurePool;
    address public platformOperator;
    uint256 private _status = 1;

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant AUTHOR_POOL_BPS = 5500; // 55%
    uint256 public constant INFRA_POOL_BPS  = 1500; // 15%
    uint256 public constant FOUNDER_BPS     = 3000; // 30% (РОВНО от baseAmount)
    uint256 public constant B2B_TAX_GROSSUP_BPS = 2000; // +20%
    uint256 public constant TAX_ESCROW_TIMELOCK = 48 hours;
    uint256 public constant MAX_AUTHORS = 64;

    // tokenAddress => userWallet => amount
    mapping(address => mapping(address => uint256)) public pendingRoyalties;
    // tokenAddress => amount
    mapping(address => uint256) public totalPendingRoyalties;

    // Налоговый gross-up (+20% B2B) изолируется до 48h timelock.
    // tokenAddress => accumulatedTax
    mapping(address => uint256) public taxEscrowBalance;
    // tokenAddress => earliest release timestamp (single conservative bucket)
    mapping(address => uint256) public taxEscrowReleaseTime;

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
        uint256 founderDisbursed,
        uint256 taxEscrowAmount
    );
    event RoyaltyClaimed(address indexed token, address indexed claimant, uint256 amount);
    event TaxEscrowClaimed(address indexed token, uint256 amount);
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
     * @notice Распределяет роялти в ERC-20 (USDT / USDC) по единой формуле 55 / 15 / 30
     *         с B2B Tax Gross-Up (+20%) в tax-escrow (timelock 48h).
     * @dev Доступен только верифицированному платформенному оператору (нотариальный шлюз).
     *      Pull-паттерн: начисляет балансы, но не переводит токены автоматически.
     *      Основатель получает РОВНО 30% от baseAmount; gross-up (+20%) и пылевые
     *      остатки округления изолируются в taxEscrowBalance до taxEscrowReleaseTime.
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
        require(authors.length <= MAX_AUTHORS, "GS: max 64 authors");

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
        uint256 totalAuthorDisbursed = _distributeAuthorPool(tokenAddress, baseAmount, authors);

        // 2. Фонд инфраструктуры и рецензентов (15% от baseAmount)
        uint256 infraTotal = (baseAmount * INFRA_POOL_BPS) / BPS_DENOMINATOR;
        pendingRoyalties[tokenAddress][infrastructurePool] += infraTotal;

        // 3. Фонд Создателя — РОВНО 30% от baseAmount (не за счёт gross-up)
        uint256 founderTotal = (baseAmount * FOUNDER_BPS) / BPS_DENOMINATOR;
        pendingRoyalties[tokenAddress][founderWallet] += founderTotal;

        // 4. Налоговый gross-up (+20%) + пылевые остатки округления → tax-escrow (48h timelock)
        uint256 taxEscrowAmount = invoiceTotal - totalAuthorDisbursed - infraTotal - founderTotal;
        require(taxEscrowAmount > 0, "GS: no tax escrow");
        _escrowTax(tokenAddress, taxEscrowAmount);

        totalPendingRoyalties[tokenAddress] += invoiceTotal;

        // Downguard: контракт обязан оставаться обеспеченным под все обязательства.
        _assertSolvent(tokenAddress);

        emit RoyaltyDistributed(
            registrationCodeHash,
            buyer,
            baseAmount,
            invoiceTotal,
            totalAuthorDisbursed,
            infraTotal,
            founderTotal,
            taxEscrowAmount
        );
    }

    /**
     * @notice Позволяет авторам, фонду и основателю запрашивать свои начисленные роялти (Pull Pattern).
     * @param tokenAddress Адрес токена (например, USDT), в котором начислено роялти.
     */
    function claimRoyalties(address tokenAddress) external nonReentrant {
        _assertSolvent(tokenAddress);

        uint256 amount = pendingRoyalties[tokenAddress][msg.sender];
        require(amount > 0, "GS: no pending royalties to claim");

        // Обнуляем баланс ПЕРЕД переводом во избежание Reentrancy атак
        pendingRoyalties[tokenAddress][msg.sender] = 0;
        totalPendingRoyalties[tokenAddress] -= amount;

        _safeTransfer(tokenAddress, msg.sender, amount);

        emit RoyaltyClaimed(tokenAddress, msg.sender, amount);
    }

    /**
     * @notice Вывод начисленного B2B tax gross-up после 48-часового timelock.
     * @dev Только Создатель протокола. Отпускается не раньше taxEscrowReleaseTime
     *      (консервативный единый бакет: более поздний settle продлевает lock всех налогов).
     */
    function claimTaxEscrow(address tokenAddress) external onlyFounder nonReentrant {
        _assertSolvent(tokenAddress);

        uint256 amount = taxEscrowBalance[tokenAddress];
        require(amount > 0, "GS: no tax escrow to claim");
        require(block.timestamp >= taxEscrowReleaseTime[tokenAddress], "GS: tax escrow still locked");

        taxEscrowBalance[tokenAddress] = 0;
        totalPendingRoyalties[tokenAddress] -= amount;

        _safeTransfer(tokenAddress, founderWallet, amount);

        emit TaxEscrowClaimed(tokenAddress, amount);
    }

    /**
     * @dev Распределяет авторский пул (55% от baseAmount) по долям CRediT.
     *      Возвращает фактически начисленную сумму (до копейки).
     */
    function _distributeAuthorPool(
        address tokenAddress,
        uint256 baseAmount,
        Contributor[] calldata authors
    ) private returns (uint256 totalAuthorDisbursed) {
        uint256 authorTotal = (baseAmount * AUTHOR_POOL_BPS) / BPS_DENOMINATOR;
        for (uint256 i = 0; i < authors.length; i++) {
            require(authors[i].wallet != address(0), "GS: zero author wallet");
            uint256 authorShare = (authorTotal * authors[i].weightBasisPoints) / BPS_DENOMINATOR;
            if (authorShare > 0) {
                pendingRoyalties[tokenAddress][authors[i].wallet] += authorShare;
                totalAuthorDisbursed += authorShare;
            }
        }
    }

    /**
     * @dev Накапливает налог в escrow и пересматривает timelock (консервативно: поздний settle продлевает lock).
     */
    function _escrowTax(address tokenAddress, uint256 amount) private {
        taxEscrowBalance[tokenAddress] += amount;
        uint256 newReleaseTime = block.timestamp + TAX_ESCROW_TIMELOCK;
        if (newReleaseTime > taxEscrowReleaseTime[tokenAddress]) {
            taxEscrowReleaseTime[tokenAddress] = newReleaseTime;
        }
    }

    /**
     * @dev Downguard: баланс контракта обязан покрывать все начисленные обязательства.
     */
    function _assertSolvent(address tokenAddress) internal view {
        require(
            IERC20(tokenAddress).balanceOf(address(this)) >= totalPendingRoyalties[tokenAddress],
            "GS: splitter insolvent"
        );
    }

    function recoverERC20(address token, address to, uint256 amount) external nonReentrant {
        require(msg.sender == founderWallet, "GS: not founder");
        require(to != address(0), "GS: zero address");
        // ВАЖНО: recoverERC20 не позволяет красть обязательства (pending + tax escrow).
        uint256 currentBalance = IERC20(token).balanceOf(address(this));
        require(currentBalance >= totalPendingRoyalties[token], "GS: under-collateralized");
        require(amount <= currentBalance - totalPendingRoyalties[token], "GS: cannot recover pending royalties");

        _safeTransfer(token, to, amount);
        emit TokensRecovered(token, to, amount);
    }

    receive() external payable {}

    function withdrawNative(address payable to, uint256 amount) external nonReentrant {
        require(msg.sender == founderWallet, "GS: not founder");
        require(to != address(0), "GS: zero address");
        require(amount <= address(this).balance, "GS: insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "GS: native transfer failed");
    }
}
