import Web3 from 'web3';

// Your contract ABI - replace with actual ABI
const VOTING_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_voterId", "type": "string"},
      {"internalType": "string", "name": "_candidateId", "type": "string"},
      {"internalType": "string", "name": "_electionId", "type": "string"}
    ],
    "name": "vote",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xYourContractAddress";

export const sendVoteToContract = async (
  voterId: string, 
  candidateId: string, 
  electionId: string
): Promise<string> => {
  if (typeof (window as any).ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  const web3 = new Web3((window as any).ethereum);
  const accounts = await web3.eth.getAccounts();
  const fromAddress = accounts[0];

  if (!fromAddress) {
    throw new Error('No connected account found');
  }

  const contract = new web3.eth.Contract(VOTING_CONTRACT_ABI as any, CONTRACT_ADDRESS);

  try {
    // Estimate gas first
    const gasEstimate = await contract.methods.vote(voterId, candidateId, electionId)
      .estimateGas({ from: fromAddress });

    // Send transaction - THIS WILL TRIGGER METAMASK CONFIRMATION
    const tx = await contract.methods.vote(voterId, candidateId, electionId)
      .send({
        from: fromAddress,
        gas: gasEstimate.toString()
      });

    return tx.transactionHash;
  } catch (error: any) {
    console.error('Contract transaction error:', error);
    if (error.code === 4001) {
      throw new Error('Transaction was rejected by user.');
    }
    throw new Error('Transaction failed: ' + error.message);
  }
};