import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { network, deployments, ethers } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

describe("FundMe", async () => {
  let fundMe: FundMe,
    deployer: SignerWithAddress,
    mockV3Aggregator: MockV3Aggregator;

  const sendValue = ethers.utils.parseEther("1"); // 1 ETH

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];

    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor()", () => {
    it("sets the owner addresses correctly", async () => {
      const response = await fundMe.i_owner();
      expect(response).to.equal(deployer.address);
    });

    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.s_priceFeed();
      expect(response).to.equal(mockV3Aggregator.address);
    });
  });

  describe("fund()", async () => {
    it("fails if you don't send enough ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWithCustomError(
        fundMe,
        "FundMe__FundAmountNotEnough"
      );
    });

    it("updates the amount funded datastructure", async () => {
      await fundMe.fund({ value: sendValue });

      const response = await fundMe.s_addressToAmountFunded(deployer.address);

      expect(response).to.equal(sendValue);
    });

    it("adds funder to array of s_funders", async () => {
      await fundMe.fund({ value: sendValue });

      const response = await fundMe.s_funders(0);

      expect(response).to.equal(deployer.address);
    });
  });

  describe("withdraw()", async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });

    it("withdraws ETH when there is a single funder", async () => {
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      const txnResponse = await fundMe.withdraw();
      const txnReceipt = await txnResponse.wait(1);

      const { gasUsed, effectiveGasPrice } = txnReceipt;
      const txnGasCost = gasUsed.mul(effectiveGasPrice);

      const finalFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const finalDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      expect(finalFundMeBalance).to.equal(0);
      expect(startingDeployerBalance.add(startingFundMeBalance)).to.equal(
        finalDeployerBalance.add(txnGasCost)
      );
    });

    it("withdraws ETH when there are multiple s_funders", async () => {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      const txnResponse = await fundMe.withdraw();
      const txnReceipt = await txnResponse.wait(1);

      const { gasUsed, effectiveGasPrice } = txnReceipt;
      const txnGasCost = gasUsed.mul(effectiveGasPrice);

      const finalFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const finalDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      expect(finalFundMeBalance).to.equal(0);
      expect(startingDeployerBalance.add(startingFundMeBalance)).to.equal(
        finalDeployerBalance.add(txnGasCost)
      );

      await expect(fundMe.s_funders(0)).to.be.reverted;

      for (let i = 0; i < 6; i++) {
        expect(
          await fundMe.s_addressToAmountFunded(accounts[i].address)
        ).to.equal(0);
      }
    });

    it("only allows owner to withdraw funds", async () => {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);

      await expect(
        attackerConnectedContract.withdraw()
      ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
    });

    // ---------------------------------------------------------------------------------

    it("tests unoptimized withdraw", async () => {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      const txnResponse = await fundMe.withdrawNotOptimized();
      const txnReceipt = await txnResponse.wait(1);

      const { gasUsed, effectiveGasPrice } = txnReceipt;
      const txnGasCost = gasUsed.mul(effectiveGasPrice);

      const finalFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const finalDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      expect(finalFundMeBalance).to.equal(0);
      expect(startingDeployerBalance.add(startingFundMeBalance)).to.equal(
        finalDeployerBalance.add(txnGasCost)
      );

      await expect(fundMe.s_funders(0)).to.be.reverted;

      for (let i = 0; i < 6; i++) {
        expect(
          await fundMe.s_addressToAmountFunded(accounts[i].address)
        ).to.equal(0);
      }
    });
  });
});
