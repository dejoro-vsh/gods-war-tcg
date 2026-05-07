const ethers = require('ethers');
const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
const contractAddress = "0x4ECaFff2F1412297Ef24Ea7906940825623580f4";
const abi = ["function baseURI() view returns (string)"];
const contract = new ethers.Contract(contractAddress, abi, provider);

contract.baseURI().then(res => console.log("Current baseURI:", res)).catch(console.error);
