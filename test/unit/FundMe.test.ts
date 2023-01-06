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
      const response = await fundMe.priceFeed();
      expect(response).to.equal(mockV3Aggregator.address);
    });
  });

  describe("fund()", async () => {
    it("fails if you don't send enough ETH", async () => {
      await expect(fundMe.fund()).to.be.reverted;
    });

    it("updated the amount funded datastructure", async () => {
      await fundMe.fund({ value: sendValue });

      const response = await fundMe.addressToAmountFunded(deployer.address);

      expect(response).to.equal(sendValue);
    });

    it("adds funder to array of funders", async () => {
      await fundMe.fund({ value: sendValue });

      const response = await fundMe.funders(0);

      expect(response).to.equal(deployer.address);
    });
  });

  describe("withdraw()", async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });

    it("withdraws ETH from a single funder", async () => {
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
  });
});
