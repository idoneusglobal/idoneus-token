const etherlime = require('etherlime-lib');
const IdoneusToken = require('../build/IdoneusToken.json');
const Whitelisting = require('../build/Whitelisting.json');
const IdonRulesOperator = require('../build/IdonRulesOperator.json');


const idonTokenPrice = '10000'; // 10 usd
const minimumIDONPrice = '10000'; // 10 usd
const transferFeePercentage = '0'; // 0%

// infura provider ID
const INFURA_PROVIDER = '148dda379bdd4346ae1ad2e9a159249d'
// set the correct multisig wallet address
const ownerMultisig = '';

const amountToMint = "1000000000000000000000000000";

const ENV = {
	LOCAL: 'LOCAL',
	TEST: 'TEST'
};

const DEPLOYERS = {
	LOCAL: (secret) => {
		return new etherlime.EtherlimeGanacheDeployer(secret, 8545, '')
	},
	TEST: (secret, network) => {
		let deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, INFURA_PROVIDER);
		let etherscanAPIKey = 'J531BRU4FNGMNCD693FT6YS9TAM9TWS6QG';
		deployer.setVerifierApiKey(etherscanAPIKey);
		return deployer;

	}
};

const deploy = async (network, secret) => {

	const env = ENV.TEST;

	const deployer = DEPLOYERS[env](secret, network);


	const whitelistingDeployed = await deployer.deployAndVerify("etherscan", Whitelisting);
	const idonRulesOperatorDeployed = await deployer.deployAndVerify("etherscan", IdonRulesOperator, {}, idonTokenPrice, minimumIDONPrice, transferFeePercentage, whitelistingDeployed.contractAddress);
	const idonTokenDeployed = await deployer.deployAndVerify("etherscan", IdoneusToken, {}, idonRulesOperatorDeployed.contractAddress);

	const idonTransferOwnership = await idonTokenDeployed.transferOwnership(ownerMultisig);
	await idonTokenDeployed.verboseWaitForTransaction(idonTransferOwnership, 'IDON Transfer Ownership');

	const whitelistingTransferOwnership = await whitelistingDeployed.transferOwnership(ownerMultisig);
	await whitelistingDeployed.verboseWaitForTransaction(whitelistingTransferOwnership, 'Whitelisting Transfer Ownership');

	const rulesOperatorTransferOwnership = await idonRulesOperatorDeployed.transferOwnership(ownerMultisig);
	await idonRulesOperatorDeployed.verboseWaitForTransaction(rulesOperatorTransferOwnership, 'Rules Operator Transfer Ownership');

	const mintTokensToMultisig = await idonTokenDeployed.mint(ownerMultisig, amountToMint);
	await idonTokenDeployed.verboseWaitForTransaction(mintTokensToMultisig, 'Mint Tokens To Multisig');

	const addMinter = await idonTokenDeployed.addMinter(ownerMultisig);
	await idonTokenDeployed.verboseWaitForTransaction(addMinter, 'Add multisig as minter')

	const renounceMinter = await idonTokenDeployed.renounceMinter();
	await idonTokenDeployed.verboseWaitForTransaction(renounceMinter, "Renounce deployer from Minter")

};

module.exports = {
	deploy
};