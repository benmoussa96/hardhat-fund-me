import { ethers } from "hardhat";

const main = async () => {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const fundMe = await ethers.getContract("FundMe", deployer);

  console.log("Withdrawing...");

  const txnResponse = await fundMe.withdraw();
  await txnResponse.wait(1);

  console.log("Withdrew all funds!");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
