declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export const connectMetaMask = async (): Promise<string> => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask to vote.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts.length === 0) {
      throw new Error('No accounts found. Please connect to MetaMask.');
    }
    
    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Please connect your MetaMask wallet to vote.');
    }
    throw new Error('Failed to connect to MetaMask: ' + error.message);
  }
};

export const sendVoteTransaction = async (
  voterId: string, 
  candidateId: string, 
  electionId: string
): Promise<string> => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  // Get current account
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  const fromAddress = accounts[0];

  if (!fromAddress) {
    throw new Error('No connected account found');
  }

  // Create a simple transaction that will trigger MetaMask confirmation
  // This sends 0 ETH to a zero address with some data
  const transactionParameters = {
    from: fromAddress,
    to: '0x0000000000000000000000000000000000000000', // Zero address
    value: '0x0', // 0 ETH
    data: `0x${Buffer.from(`VOTE:${voterId}:${candidateId}:${electionId}`).toString('hex')}`,
    gasLimit: '0x5208', // 21000 gas (standard for simple transfers)
  };

  console.log('Sending vote transaction with data:', transactionParameters);

  try {
    // This will trigger the MetaMask confirmation popup
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });

    console.log('Transaction hash:', txHash);
    return txHash;
  } catch (error: any) {
    console.error('Transaction error:', error);
    if (error.code === 4001) {
      throw new Error('Transaction was rejected by user.');
    }
    throw new Error('Transaction failed: ' + error.message);
  }
};