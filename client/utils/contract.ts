import Web3 from 'web3';

export interface Candidate {
  id: number;
  name: string;
  voteCount: string;
  party: string;
  position: string;
}

export const getContract = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const web3 = new Web3(window.ethereum);
  
  const contractABI = [
    {
      "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCandidates",
      "outputs": [
        {
          "components": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "party", "type": "string" },
            { "internalType": "string", "name": "position", "type": "string" },
            { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
          ],
          "internalType": "struct Voting.Candidate[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "_voter", "type": "address" }],
      "name": "hasVoted",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVotingStatus",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRemainingTime",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionName",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionDescription",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xYourContractAddress';

  return new web3.eth.Contract(contractABI, contractAddress);
};