const etherlime = require('etherlime-lib');
const IdoneusToken = require('../build/IdoneusToken.json');
const validatorImplementationMock = accounts[9].signer;

describe('Idoneus Token', () => {
	let deployer = new etherlime.EtherlimeGanacheDeployer();
	let idoneusTokenInstance;

	describe('Set Idon Rules Operator', () => {
		before(async () => {
			idoneusTokenInstance = await deployer.deploy(IdoneusToken, {}, validatorImplementationMock.address);
		});

		it('Should return Idon Rules Operator implementation address', async () => {
			let rulesOperatorsAddress = await idoneusTokenInstance.rulesOperator();
			assert.strictEqual(rulesOperatorsAddress, validatorImplementationMock.address);
		});

		it('Should change Idon Rules Operator implementation address', async () => {
			eventName = "RulesOperatorModified";
			let newValidatorImpl = accounts[8].signer;
			let transaction = await idoneusTokenInstance.setRulesOperator(newValidatorImpl.address);

			const transactionReceipt = await idoneusTokenInstance.verboseWaitForTransaction(transaction);
			let isEmitted = utils.hasEvent(transactionReceipt, idoneusTokenInstance, eventName);
			assert(isEmitted, 'Event RulesOperatorModified was not emitted');

			let newValidatorImplAddress = await idoneusTokenInstance.rulesOperator();
			assert.strictEqual(newValidatorImplAddress, newValidatorImpl.address);
		});

		it('Should NOT set Idon Rules Operator implementation address if not from owner', async () => {
			const notOwner = accounts[7].signer;

			let newValidatorImpl = accounts[8].signer;
			await assert.revert(idoneusTokenInstance.from(notOwner.address).setRulesOperator(newValidatorImpl.address));
		});
	});
});