import { ethers } from "./ethers-5.2.esm.min.js";
import { contractAddress, abi } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");

const connect = async () => {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    connectButton.innerHTML = "Connected!";
    console.log("Connected!");
  } else {
    connectButton.innerHTML = "No Metamask detected!";
    console.log("No Metamask detected!");
  }
};

const fund = async (/*ethAmount*/) => {
  const ethAmount = document.getElementById("ethAmount").value;

  console.log(`Funding with ${ethAmount} ETH...`);

  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const txnResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      await listenForTransactionMine(txnResponse, provider);
      console.log(`Funded!`);
    } catch (error) {
      console.log(error);
    }
  }
};

const getBalance = async () => {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    const formattedBalance = ethers.utils.formatEther(balance);
    console.log(formattedBalance);

    return formattedBalance;
  }
};

const withdraw = async () => {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const balance = await getBalance();

    console.log(`Withdrawing ${balance} ETH to ${await signer.getAddress()}`);

    try {
      const txnResponse = await contract.withdraw();
      await listenForTransactionMine(txnResponse, provider);
      console.log(`Withdrew funds!`);
    } catch (error) {
      console.log(error);
    }
  }
};

connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

const listenForTransactionMine = (txnResponse, provider) => {
  console.log(`Mining ${txnResponse.hash} ...`);
  return new Promise((resolve, reject) => {
    provider.once(txnResponse.hash, (txnReceipt) => {
      console.log(
        `Transaction mined with ${txnReceipt.confirmations} confirmation(s)!`
      );
      resolve();
    });
  });
};
