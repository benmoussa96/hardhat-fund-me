import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe: FundMe, deployer: SignerWithAddress;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();

        const finalBalance = await fundMe.provider.getBalance(fundMe.address);

        expect(finalBalance).to.equal(0);
      });
    });
