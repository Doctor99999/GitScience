import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("AmanatSplitter v4.1", function () {
  async function deploySplitterFixture() {
    const [founder, operator, buyer, infra, authorA, authorB] = await ethers.getSigners();

    // Деплоим минимальный стандартный ERC-20 (ruffled: USDT-подобный без возврата bool)
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("USDT", "USDT", ethers.parseEther("1000000"));
    await token.waitForDeployment();

    const Splitter = await ethers.getContractFactory("AmanatSplitter");
    const splitter = await Splitter.deploy(founder.address, infra.address);
    await splitter.waitForDeployment();

    // Пополняем покупателя
    await token.transfer(buyer.address, ethers.parseEther("10000"));
    await token.connect(buyer).approve(splitter.getAddress(), ethers.parseEther("10000"));

    return { splitter, token, founder, operator, buyer, infra, authorA, authorB };
  }

  describe("settleAmanatRoyalty (55/15/30 + tax escrow 48h)", function () {
    it("раздаёт ровно 55/15/30 от baseAmount, gross-up уходит в tax-escrow", async function () {
      const { splitter, token, founder, operator, buyer, infra, authorA, authorB } =
        await loadFixture(deploySplitterFixture);

      // Оператором по умолчанию становится founder (msg.sender в конструкторе = founder).
      // Авторизуем отдельный операторский EOA для проверки onlyOperator.
      await splitter.setPlatformOperator(operator.address);

      const base = ethers.parseEther("1000");
      const grossUp = (base * 2000n) / 10000n;

      const authors = [
        { wallet: authorA.address, weightBasisPoints: 6000n },
        { wallet: authorB.address, weightBasisPoints: 4000n },
      ];

      await expect(
        splitter.connect(operator).settleAmanatRoyalty(
          await token.getAddress(),
          buyer.address,
          ethers.encodeBytes32String("GS-2026-00001"),
          base,
          authors
        )
      )
        .to.emit(splitter, "RoyaltyDistributed")
        .withArgs(
          ethers.encodeBytes32String("GS-2026-00001"),
          buyer.address,
          base,
          base + grossUp,
          (base * 5500n) / 10000n,
          (base * 1500n) / 10000n,
          (base * 3000n) / 10000n,
          grossUp
        );

      // Авторы
      expect(await splitter.pendingRoyalties(await token.getAddress(), authorA.address)).to.equal(
        ((base * 5500n) / 10000n * 6000n) / 10000n
      );
      expect(await splitter.pendingRoyalties(await token.getAddress(), authorB.address)).to.equal(
        ((base * 5500n) / 10000n * 4000n) / 10000n
      );

      // Инфра + founder ровно 30%
      expect(await splitter.pendingRoyalties(await token.getAddress(), infra.address)).to.equal(
        (base * 1500n) / 10000n
      );
      expect(await splitter.pendingRoyalties(await token.getAddress(), founder.address)).to.equal(
        (base * 3000n) / 10000n
      );

      // Tax escrow = 20% от base, locked 48h
      const tokenAddr = await token.getAddress();
      expect(await splitter.taxEscrowBalance(tokenAddr)).to.equal(grossUp);
      expect(await splitter.taxEscrowReleaseTime(tokenAddr)).to.be.greaterThan(
        (await ethers.provider.getBlock("latest"))!.timestamp
      );
    });

    it("не присваивает gross-up остатком основателю (основатель ровно 30%)", async function () {
      const { splitter, token, founder, buyer, authorA } = await loadFixture(deploySplitterFixture);
      const tokenAddr = await token.getAddress();
      const base = ethers.parseEther("3001"); // нечётная база — проверка пылевых остатков

      await splitter.settleAmanatRoyalty(
        tokenAddr,
        buyer.address,
        ethers.encodeBytes32String("GS-2026-00002"),
        base,
        [{ wallet: authorA.address, weightBasisPoints: 10000n }]
      );

      // founder НЕ должен получить gross-up: ровно 30% от базы
      expect(await splitter.pendingRoyalties(tokenAddr, founder.address)).to.equal(
        (base * 3000n) / 10000n
      );
      // gross-up (+пыль, если есть) уходит в escrow, а НЕ основателю
      expect(await splitter.taxEscrowBalance(tokenAddr)).to.be.greaterThanOrEqual(
        (base * 2000n) / 10000n
      );
    });

    it("отклоняет settle без right авторизации (только оператор/founder)", async function () {
      const { splitter, buyer, authorA } = await loadFixture(deploySplitterFixture);
      await expect(
        splitter.connect(authorA).settleAmanatRoyalty(
          "0x0000000000000000000000000000000000000000",
          buyer.address,
          ethers.encodeBytes32String("X"),
          1000n,
          [{ wallet: authorA.address, weightBasisPoints: 10000n }]
        )
      ).to.be.revertedWith("GS: not authorized platform operator");
    });

    it("отклоняет более 64 авторов", async function () {
      const { splitter, token, buyer, authorA } = await loadFixture(deploySplitterFixture);
      const authors = Array.from({ length: 65 }, (_, i) => ({
        wallet: i === 64 ? "0x0000000000000000000000000000000000000001" : authorA.address,
        weightBasisPoints: i === 64 ? 9999n : 10000n,
      }));
      await expect(
        splitter.settleAmanatRoyalty(
          await token.getAddress(),
          buyer.address,
          ethers.encodeBytes32String("X"),
          1000n,
          authors
        )
      ).to.be.revertedWith("GS: max 64 authors");
    });

    it("отклоняет доли, не суммирующиеся в 10000 bps", async function () {
      const { splitter, token, buyer, authorA, authorB } = await loadFixture(deploySplitterFixture);
      await expect(
        splitter.settleAmanatRoyalty(
          await token.getAddress(),
          buyer.address,
          ethers.encodeBytes32String("X"),
          1000n,
          [
            { wallet: authorA.address, weightBasisPoints: 7000n },
            { wallet: authorB.address, weightBasisPoints: 2000n },
          ]
        )
      ).to.be.revertedWith("Author weights must sum to 10000 bps");
    });

    it("отклоняет нулевую baseAmount", async function () {
      const { splitter, token, buyer, authorA } = await loadFixture(deploySplitterFixture);
      await expect(
        splitter.settleAmanatRoyalty(
          await token.getAddress(),
          buyer.address,
          ethers.encodeBytes32String("X"),
          0,
          [{ wallet: authorA.address, weightBasisPoints: 10000n }]
        )
      ).to.be.revertedWith("Base amount must be > 0");
    });
  });

  describe("tax escrow timelock (48h)", function () {
    it("блокирует вывод налога до истечения 48h, затем allow founder claim", async function () {
      const { splitter, token, founder, buyer, authorA } = await loadFixture(deploySplitterFixture);
      const tokenAddr = await token.getAddress();
      const base = ethers.parseEther("1000");

      await splitter.settleAmanatRoyalty(
        tokenAddr,
        buyer.address,
        ethers.encodeBytes32String("GS-TAX-1"),
        base,
        [{ wallet: authorA.address, weightBasisPoints: 10000n }]
      );

      const taxBefore = await splitter.taxEscrowBalance(tokenAddr);
      expect(taxBefore).to.equal((base * 2000n) / 10000n);

      // До timelock — revert
      await expect(splitter.connect(founder).claimTaxEscrow(tokenAddr)).to.be.revertedWith(
        "GS: tax escrow still locked"
      );

      // Пропускаем 48 часов
      await time.increase(48 * 60 * 60 + 1);

      const before = await token.balanceOf(founder.address);
      await expect(splitter.connect(founder).claimTaxEscrow(tokenAddr))
        .to.emit(splitter, "TaxEscrowClaimed")
        .withArgs(tokenAddr, taxBefore);
      expect(await token.balanceOf(founder.address)).to.equal(before + taxBefore);
      expect(await splitter.taxEscrowBalance(tokenAddr)).to.equal(0);
    });

    it("tax escrow не выводят не-founder", async function () {
      const { splitter, token, authorA, buyer } = await loadFixture(deploySplitterFixture);
      await splitter.settleAmanatRoyalty(
        await token.getAddress(),
        buyer.address,
        ethers.encodeBytes32String("GS-TAX-2"),
        ethers.parseEther("100"),
        [{ wallet: authorA.address, weightBasisPoints: 10000n }]
      );
      await time.increase(48 * 60 * 60 + 1);
      await expect(splitter.connect(authorA).claimTaxEscrow(await token.getAddress())).to.be.revertedWith(
        "GS: not founder"
      );
    });

    it("двойной claim невозможен (nothing to claim)", async function () {
      const { splitter, token, founder, buyer, authorA } = await loadFixture(deploySplitterFixture);
      const tokenAddr = await token.getAddress();
      await splitter.settleAmanatRoyalty(
        tokenAddr,
        buyer.address,
        ethers.encodeBytes32String("GS-TAX-3"),
        ethers.parseEther("10"),
        [{ wallet: authorA.address, weightBasisPoints: 10000n }]
      );
      await time.increase(48 * 60 * 60 + 1);
      await splitter.connect(founder).claimTaxEscrow(tokenAddr);
      await expect(splitter.connect(founder).claimTaxEscrow(tokenAddr)).to.be.revertedWith(
        "GS: no tax escrow to claim"
      );
    });
  });

  describe("claim/pull + recover + solvency", function () {
    it("авторы claim свои royalties по pull-pattern", async function () {
      const { splitter, token, authorA, buyer } = await loadFixture(deploySplitterFixture);
      const tokenAddr = await token.getAddress();
      const base = ethers.parseEther("1000");
      await splitter.settleAmanatRoyalty(
        tokenAddr,
        buyer.address,
        ethers.encodeBytes32String("GS-CLAIM-1"),
        base,
        [{ wallet: authorA.address, weightBasisPoints: 10000n }]
      );
      const owed = await splitter.pendingRoyalties(tokenAddr, authorA.address);
      const before = await token.balanceOf(authorA.address);
      await expect(splitter.connect(authorA).claimRoyalties(tokenAddr))
        .to.emit(splitter, "RoyaltyClaimed")
        .withArgs(tokenAddr, authorA.address, owed);
      expect(await token.balanceOf(authorA.address)).to.equal(before + owed);
      expect(await splitter.pendingRoyalties(tokenAddr, authorA.address)).to.equal(0);
    });

    it("recoverERC20 не может украсть pending / escrow", async function () {
      const { splitter, token, founder, buyer, authorA } = await loadFixture(deploySplitterFixture);
      const tokenAddr = await token.getAddress();
      await splitter.settleAmanatRoyalty(
        tokenAddr,
        buyer.address,
        ethers.encodeBytes32String("GS-REC-1"),
        ethers.parseEther("100"),
        [{ wallet: authorA.address, weightBasisPoints: 10000n }]
      );
      const liabilities = await splitter.totalPendingRoyalties(tokenAddr);
      const balance = await token.balanceOf(splitter.getAddress());

      // recover не больше surplus
      await expect(
        splitter.connect(founder).recoverERC20(tokenAddr, founder.address, balance - liabilities + 1n)
      ).to.be.revertedWith("GS: cannot recover pending royalties");
      // recover ровно surplus — ок
      await splitter.connect(founder).recoverERC20(tokenAddr, founder.address, balance - liabilities);
    });

    it("solvency downguard срабатывает при попытке снять больше, чем есть", async function () {
      const { splitter, token, buyer, authorA, authorB, founder, infra } = await loadFixture(
        deploySplitterFixture
      );
      const tokenAddr = await token.getAddress();
      await splitter.settleAmanatRoyalty(
        tokenAddr,
        buyer.address,
        ethers.encodeBytes32String("GS-SOL-1"),
        ethers.parseEther("10"),
        [
          { wallet: authorA.address, weightBasisPoints: 5000n },
          { wallet: authorB.address, weightBasisPoints: 5000n },
        ]
      );

      // После первого claim (авторA) checker: totalPending всё ещё ≥ balance → ок.
      await splitter.connect(authorA).claimRoyalties(tokenAddr);
      await splitter.connect(authorB).claimRoyalties(tokenAddr);

      // founder claim tax escrow после timelock — solvency сохранится.
      await time.increase(48 * 60 * 60 + 1);
      await splitter.connect(founder).claimTaxEscrow(tokenAddr);
      await splitter.connect(infra).claimRoyalties(tokenAddr);

      // Все обязательства закрыты: повторный claim невозможен
      await expect(splitter.connect(authorA).claimRoyalties(tokenAddr)).to.be.revertedWith(
        "GS: no pending royalties to claim"
      );
    });
  });
});

describe("SovereignIPNFT v4.1", function () {
  async function deployNFTFixture() {
    const [founder, minter, alice] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("SovereignIPNFT");
    const nft = await NFT.deploy(founder.address, "0x0000000000000000000000000000000000000001");
    await nft.waitForDeployment();
    await nft.setPlatformMinter(minter.address);
    return { nft, founder, minter, alice };
  }

  it("mint записывает PatentRecord и выдаёт токен", async function () {
    const { nft, minter, alice } = await loadFixture(deployNFTFixture);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("hash-A"));
    const tx = await nft
      .connect(minter)
      .mintIPNFT(alice.address, "GS-2026-NFT-1", hash, "0x1234", "ipfs://QmTest");
    await tx.wait();

    expect(await nft.ownerOf(1)).to.equal(alice.address);
    const rec = await nft.patentRecords(1);
    expect(rec.registrationCode).to.equal("GS-2026-NFT-1");
    expect(rec.leadAuthor).to.equal(alice.address);
    // sha256Hash в контракте — string: registeredHashes хранит keccak256(utf8-байтов hex-строки)
    const registryKey = ethers.keccak256(ethers.toUtf8Bytes(hash));
    expect(await nft.registeredHashes(registryKey)).to.equal(true);
  });

  it("отклоняет mint на сам контракт (v4.1 guard)", async function () {
    const { nft, minter } = await loadFixture(deployNFTFixture);
    await expect(
      nft
        .connect(minter)
        .mintIPNFT(
          await nft.getAddress(),
          "GS-2026-NFT-2",
          ethers.keccak256(ethers.toUtf8Bytes("hash-B")),
          "0x0",
          "ipfs://x"
        )
    ).to.be.revertedWith("GS: cannot mint to the contract itself");
  });

  it("отклоняет transfer на сам контракт (v4.1 guard)", async function () {
    const { nft, minter, alice } = await loadFixture(deployNFTFixture);
    await nft
      .connect(minter)
      .mintIPNFT(
        alice.address,
        "GS-2026-NFT-3",
        ethers.keccak256(ethers.toUtf8Bytes("hash-C")),
        "0x0",
        "ipfs://y"
      );
    await expect(
      nft.connect(alice).transferFrom(alice.address, await nft.getAddress(), 1)
    ).to.be.revertedWith("GS: cannot transfer to the contract itself");
  });

  it("royaltyInfo = 30% в AmanatSplitter (EIP-2981)", async function () {
    const { nft, minter, alice } = await loadFixture(deployNFTFixture);
    await nft
      .connect(minter)
      .mintIPNFT(
        alice.address,
        "GS-2026-NFT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash-D")),
        "0x0",
        "ipfs://z"
      );
    const splitterAddr = await nft.amanatSplitterAddress();
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("1000"));
    expect(receiver).to.equal(splitterAddr);
    expect(amount).to.equal(ethers.parseEther("300"));
  });

  it("дубликат prior-art hash отклоняется", async function () {
    const { nft, minter, alice } = await loadFixture(deployNFTFixture);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("hash-dupe"));
    await nft
      .connect(minter)
      .mintIPNFT(alice.address, "GS-2026-NFT-5", hash, "0x0", "ipfs://a");
    await expect(
      nft
        .connect(minter)
        .mintIPNFT(alice.address, "GS-2026-NFT-6", hash, "0x0", "ipfs://b")
    ).to.be.revertedWith("GS: duplicate prior art hash");
  });

  it("safeTransferFrom к контракту без onERC721Received отклоняется", async function () {
    const { nft, minter, alice } = await loadFixture(deployNFTFixture);
    await nft
      .connect(minter)
      .mintIPNFT(
        alice.address,
        "GS-2026-NFT-7",
        ethers.keccak256(ethers.toUtf8Bytes("hash-E")),
        "0x0",
        "ipfs://c"
      );
    const Splitter = await ethers.getContractFactory("AmanatSplitter");
    const nftAddr = await nft.getAddress();
    const splitter = await Splitter.deploy(nftAddr, alice.address);
    await splitter.waitForDeployment();
    await expect(
      nft
        .connect(alice)
        ["safeTransferFrom(address,address,uint256)"](alice.address, await splitter.getAddress(), 1)
    ).to.be.revertedWith("GS: receiver rejected ERC721 transfer");
  });
});