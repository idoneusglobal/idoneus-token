const etherlime = require('etherlime-lib');
const Operator = require('../build/Operator.json');
const owner = accounts[0].signer;
const notOwner = accounts[1].signer;
const operator = accounts[9].signer;

describe('Operator', () => {
	let deployer;
	let operatorContract;

	beforeEach(async () => {
		deployer = new etherlime.EtherlimeGanacheDeployer();
		operatorContract = await deployer.deploy(Operator);
	});

	it('Should set one as operator from owner', async () => {
		const eventName = "OperatorModified";
		const status = true;

		let transaction = await operatorContract.from(owner).setOperator(operator.address, status);

		const transactionReceipt = await operatorContract.verboseWaitForTransaction(transaction);
		let isEmitted = utils.hasEvent(transactionReceipt, operatorContract, eventName);
		assert(isEmitted, 'Event OperatorModified was not emitted');
	});

	it('Should revert if not owner tries to set operator', async () => {
		const status = true;
		await assert.revert(operatorContract.from(notOwner).setOperator(operator.address, status));
	});

	it('Should remove one as operator from owner', async () => {
		let status = true;

		await operatorContract.from(owner).setOperator(operator.address, status);
		let isWhitelisted = await operatorContract.isOperator(operator.address);
		assert.ok(isWhitelisted);

		status = false;

		await operatorContract.from(owner).setOperator(operator.address, status);
		isWhitelisted = await operatorContract.isOperator(operator.address);
		assert.notOk(isWhitelisted);
	});
});