const connect = async () => {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    document.getElementById("connectButton").innerHTML = "Connected!";
    console.log("Connected!");
  } else {
    document.getElementById("connectButton").innerHTML =
      "No Metamask detected!";
    console.log("No Metamask detected!");
  }
};
