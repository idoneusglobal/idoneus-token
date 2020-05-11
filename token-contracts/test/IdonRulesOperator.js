const etherlime = require('etherlime-lib');
const IdoneusToken = require('../build/IdoneusToken.json');
const IdonRulesOperator = require('../build/IdonRulesOperator.json');
const Whitelisting = require('../build/Whitelisting.json');

describe('Idon Rules Operator', () => {
  let deployer = new etherlime.EtherlimeGanacheDeployer();
  let idoneusTokenInstance;
  let idonRulesOperator;
  let whitelisting;

  const owner = accounts[0].signer;
  const whitelistedUserOne = accounts[1].signer;
  const whitelistedUserTwo = accounts[2].signer;
  const nonWhitelistedUser = accounts[3].signer;
  const nonWhitelistedUserTwo = accounts[4].signer;
  const status = true;

  const amountToMint = ethers.utils.parseEther('5');

  // idonTokenPrice, minimumIdonPrice, feePercentage should be multiplied by 100
  // 12.000 usd
  let idonTokenPrice = '12000'; //rate fiat per idon
  // 10.000 usd
  let minimumIdonPrice = '10000';
  // 21.345% fee
  let feePercentage = '21345';

  const rulesOperatorAdmin = accounts[8].signer;

  describe('Idon Rules Operator implementation', () => {
    describe('Idon Rules Operator setup', () => {
      beforeEach(async () => {
        whitelisting = await deployer.deploy(Whitelisting);
        idonRulesOperator = await deployer.deploy(IdonRulesOperator, {}, idonTokenPrice, minimumIdonPrice, feePercentage, whitelisting.contractAddress);
        idoneusTokenInstance = await deployer.deploy(IdoneusToken, {}, idonRulesOperator.contractAddress);
      });

      it('Should initiate contract properties', async () => {
        let rulesOperatorsAddress = await idoneusTokenInstance.rulesOperator();
        let minimumPrice = await idonRulesOperator.minimumIDONPrice();
        let tokenPrice = await idonRulesOperator.idonTokenPrice();
        let fee = await idonRulesOperator.transferFeePercentage();

        assert.equal(rulesOperatorsAddress, idonRulesOperator.contractAddress);
        assert(tokenPrice.eq(idonTokenPrice));
        assert(minimumPrice.eq(minimumIdonPrice));
        assert(fee.eq(feePercentage));
      });

      it('Should set token price from operator', async () => {
        const eventName = "TokenPriceModified";
        const newPrice = '15';
        await idonRulesOperator.setOperator(rulesOperatorAdmin.address, true);
        let transaction = await idonRulesOperator.from(rulesOperatorAdmin).setIdonTokenPrice(newPrice);

        const transactionReceipt = await idonRulesOperator.verboseWaitForTransaction(transaction);
        let isEmitted = utils.hasEvent(transactionReceipt, idonRulesOperator, eventName);
        assert(isEmitted, 'Event TokenPriceModified was not emitted');

        let tokenPrice = await idonRulesOperator.idonTokenPrice();
        assert.equal(newPrice, tokenPrice.toString());
      });

      it('Should revert if not operator tries to set token price', async () => {
        const newPrice = '15';
        await assert.revert(idonRulesOperator.from(rulesOperatorAdmin).setIdonTokenPrice(newPrice));
      });

      it('Should set minimum token price limit from owner', async () => {
        const eventName = "MinimumPriceLimitModified";
        const newMinimumLimit = '12';
        let transaction = await idonRulesOperator.setMinimumPriceLimit(newMinimumLimit);

        const transactionReceipt = await idonRulesOperator.verboseWaitForTransaction(transaction);
        let isEmitted = utils.hasEvent(transactionReceipt, idonRulesOperator, eventName);
        assert(isEmitted, 'Event MinimumPriceLimitModified was not emitted');

        let minimumLimit = await idonRulesOperator.minimumIDONPrice();
        assert.equal(newMinimumLimit, minimumLimit.toString());
      });

      it('Should revert if not owner tries to set minimum price limit', async () => {
        const newMinimumLimit = '12';
        await assert.revert(idonRulesOperator.from(rulesOperatorAdmin).setMinimumPriceLimit(newMinimumLimit));
      });

      it('Should set fee percentagefrom owner', async () => {
        const eventName = "FeePercentageModified";
        const newFee = '20';
        let transaction = await idonRulesOperator.setFeePercentage(newFee);

        const transactionReceipt = await idonRulesOperator.verboseWaitForTransaction(transaction);
        let isEmitted = utils.hasEvent(transactionReceipt, idonRulesOperator, eventName);
        assert(isEmitted, 'Event FeePercentageModified was not emitted');

        let newFeePercentage = await idonRulesOperator.transferFeePercentage();
        assert(newFeePercentage.eq(newFee));
      });

      it('Should revert if not owner tryes to change fee percentage', async () => {
        const notOwner = accounts[7].signer;
        const newFee = '20';
        await assert.revert(idonRulesOperator.from(notOwner).setFeePercentage(newFee));
      });

      it('Should set whitelisting contract from owner', async () => {
        const eventName = "WhitelistingInstanceModified";
        const newWhitelistingContract = accounts[5].signer.address;
        let transaction = await idonRulesOperator.setWhitelisting(newWhitelistingContract);

        const transactionReceipt = await idonRulesOperator.verboseWaitForTransaction(transaction);
        let isEmitted = utils.hasEvent(transactionReceipt, idonRulesOperator, eventName);
        assert(isEmitted, 'Event WhitelistingInstanceModified was not emitted');

        let newWhitelistingAddress = await idonRulesOperator.whitelisting();
        assert.equal(newWhitelistingAddress, newWhitelistingContract);
      });

      it('Should revert if not owner tryes to change whitelisting contract', async () => {
        const notOwner = accounts[7].signer;
        const newWhitelistingContract = accounts[5].signer.address;
        await assert.revert(idonRulesOperator.from(notOwner).setWhitelisting(newWhitelistingContract));
      });
    });

    describe('Token Rules Operations', () => {
      describe('Whith token price is above minimum limits', () => {
        beforeEach(async () => {
          whitelisting = await deployer.deploy(Whitelisting);
          await whitelisting.setWhitelisted([whitelistedUserOne.address, whitelistedUserTwo.address], status);
          idonRulesOperator = await deployer.deploy(IdonRulesOperator, {}, idonTokenPrice, minimumIdonPrice, feePercentage, whitelisting.contractAddress);
          idoneusTokenInstance = await deployer.deploy(IdoneusToken, {}, idonRulesOperator.contractAddress);
          await idoneusTokenInstance.mint(whitelistedUserOne.address, amountToMint);
        });

        it('Should transfer tokens from whitelisted to whitelisted', async () => {
          let balanceBefore = await idoneusTokenInstance.balanceOf(whitelistedUserTwo.address);
          await idoneusTokenInstance.from(whitelistedUserOne).transfer(whitelistedUserTwo.address, amountToMint);
          let balanceAfter = await idoneusTokenInstance.balanceOf(whitelistedUserTwo.address);
          assert(balanceAfter.eq(balanceBefore.add(amountToMint)));
        });

        it('Should transfer tokens from whitelisted to whitelisted with transferFrom', async () => {
          let balanceBefore = await idoneusTokenInstance.balanceOf(whitelistedUserTwo.address);
          await idoneusTokenInstance.from(whitelistedUserOne).approve(whitelistedUserTwo.address, amountToMint);
          await idoneusTokenInstance.from(whitelistedUserTwo).transferFrom(whitelistedUserOne.address, whitelistedUserTwo.address, amountToMint);
          let balanceAfter = await idoneusTokenInstance.balanceOf(whitelistedUserTwo.address);
          assert(balanceAfter.eq(balanceBefore.add(amountToMint)));
        });

        it('Should transfer tokens from whitelisted to non-whitelisted', async () => {
          let balanceBefore = await idoneusTokenInstance.balanceOf(nonWhitelistedUser.address);
          await idoneusTokenInstance.from(whitelistedUserOne).transfer(nonWhitelistedUser.address, amountToMint);
          let balanceAfter = await idoneusTokenInstance.balanceOf(nonWhitelistedUser.address);
          let balanceOwner = await idoneusTokenInstance.balanceOf(owner.address);

          const tax = amountToMint.mul(feePercentage).div(100000);

          assert(balanceAfter.eq(balanceBefore.add(amountToMint.sub(tax))));
          assert(balanceOwner.eq(tax));
        });
      });

      describe('Whith token price is below minimum limits', () => {
        beforeEach(async () => {
          idonTokenPrice = '8';
          minimumIdonPrice = '10';
          whitelisting = await deployer.deploy(Whitelisting);
          await whitelisting.setWhitelisted([whitelistedUserOne.address, whitelistedUserTwo.address], status);
          idonRulesOperator = await deployer.deploy(IdonRulesOperator, {}, idonTokenPrice, minimumIdonPrice, feePercentage, whitelisting.contractAddress);
          idoneusTokenInstance = await deployer.deploy(IdoneusToken, {}, idonRulesOperator.contractAddress);
          await idoneusTokenInstance.mint(whitelistedUserOne.address, amountToMint);
          await idoneusTokenInstance.mint(nonWhitelistedUser.address, amountToMint);
        });

        it('Should transfer tokens from whitelisted to whitelisted', async () => {
          let balanceBefore = await idoneusTokenInstance.balanceOf(whitelistedUserTwo.address);
          await idoneusTokenInstance.from(whitelistedUserOne).transfer(whitelistedUserTwo.address, amountToMint);
          let balanceAfter = await idoneusTokenInstance.balanceOf(whitelistedUserTwo.address);
          assert(balanceAfter.eq(balanceBefore.add(amountToMint)));
        });

        it('Should revert if transfer tokens between whitelisted and non-whitelisted', async () => {
          await assert.revert(idoneusTokenInstance.from(whitelistedUserOne).transfer(nonWhitelistedUser.address, amountToMint));
        });

        it('Should revert if transfer tokens between non-whitelisted and whitelisted', async () => {
          await assert.revert(idoneusTokenInstance.from(nonWhitelistedUser).transfer(whitelistedUserOne.address, amountToMint));
        });

        it('Should revert if transfer tokens between non-whitelisted and whitelisted', async () => {
          await assert.revert(idoneusTokenInstance.from(nonWhitelistedUser).transfer(nonWhitelistedUserTwo.address, amountToMint));
        });
      });
    });
  });
});