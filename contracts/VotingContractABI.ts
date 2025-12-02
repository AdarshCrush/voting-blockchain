// Replace this with your actual contract ABI
export const VOTING_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_voterId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_candidateId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_electionId",
        "type": "string"
      }
    ],
    "name": "vote",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_voterId",
        "type": "string"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
  // Add other functions from your contract
] as const;