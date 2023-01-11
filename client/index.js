import { ethers } from "./ethers-5.2.esm.min.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");

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

const fund = async (ethAmount) => {
  console.log(`Funding with ${ethAmount}`);
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    console.log(signer);
  }
};

connectButton.onclick = connect;
fundButton.onclick = fund;
