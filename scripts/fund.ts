import { ethers } from "hardhat";

const main = async () => {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const fundMe = await ethers.getContract("FundMe", deployer);

  console.log("Funding contract...");

  const txnResponse = await fundMe.fund({
    value: ethers.utils.parseEther("0.1"),
  });
  await txnResponse.wait(1);

  console.log("Funded 0.1 ETH!");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
