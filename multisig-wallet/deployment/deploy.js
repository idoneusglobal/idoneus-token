const etherlime = require('etherlime-lib');
const MultiSigWallet = require('../build/MultiSigWallet.json');

//Infura provider ID
const INFURA_PROVIDER = ''

//Owners addresses of the multisgi wallet
const Owners = [""];

const Required = 2;

const deploy = async (network, secret) => {

	let deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, INFURA_PROVIDER);
	const result = await deployer.deploy(MultiSigWallet, {}, Owners, Required);
};

module.exports = {
	deploy
};