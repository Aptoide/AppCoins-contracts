var ExtendedAdvertisement = artifacts.require("./ExtendedAdvertisement.sol");
var ExtendedAdvertisementStorage = artifacts.require("./ExtendedAdvertisementStorage.sol");
var ExtendedFinance = artifacts.require("./ExtendedFinance.sol");
var AppCoins = artifacts.require("./AppCoins.sol");
var chai = require('chai');
var Web3 = require('web3');
var TestUtils = require('./TestUtils.js');
var expect = chai.expect;
var chaiAsPromissed = require('chai-as-promised');
chai.use(chaiAsPromissed);

const web3 = new Web3(Web3.givenProvider || 'ws://some.local-or-remote.node:8546');

var BigNumber = require('big-number');
var appcInstance;
var addInstance;
var adFinanceInstance;
var devShare = 0.85;
var appStoreShare = 0.1;
var oemShare = 0.05;

var expectRevert = RegExp('revert');

var campaignPrice;
var campaignBudget;
var startDate;
var endDate;
var packageName;

var privateKey0;
var privateKey1;
var privateKey2;
var objSign0;
var objSign1;
var objSign2;

function convertCountryCodeToIndex(countryCode) {
	var begin = new Buffer("AA");
	var one = new Buffer("A");
	var buffer = new  Buffer(countryCode);
	var first = new  Buffer(countryCode[0]);

	return buffer.readUInt16BE() - begin.readUInt16BE() - 230*(first.readUInt8()-one.readUInt8());
}

contract('ExtendedAdvertisement', function(accounts) {
    beforeEach('Setting Advertisement test...',async () => {

        appcInstance = await AppCoins.new();
        AdvertisementStorageInstance = await ExtendedAdvertisementStorage.new();
  		adFinanceInstance = await ExtendedFinance.new(appcInstance.address);

        addInstance = await ExtendedAdvertisement.new(appcInstance.address, AdvertisementStorageInstance.address,adFinanceInstance.address);

        await adFinanceInstance.setAllowedAddress(addInstance.address);
        await adFinanceInstance.setAdsStorageAddress(AdvertisementStorageInstance.address);
        await AdvertisementStorageInstance.addAddressToWhitelist(addInstance.address);
		await addInstance.addAddressToWhitelist(accounts[1]);

  		TestUtils.setAppCoinsInstance(appcInstance);
  		TestUtils.setContractInstance(addInstance);

  		campaignPrice =  500000000000000000;
  		campaignBudget = 1000000000000000000;

  		var countryList = []

  		countryList.push(convertCountryCodeToIndex("PT"))
  		countryList.push(convertCountryCodeToIndex("GB"))
  		countryList.push(convertCountryCodeToIndex("FR"))

          countryCode = countryList[0]

  		startDate = 20;
  		endDate = 1922838059980;
  		packageName = "com.facebook.orca";

  		await appcInstance.approve(addInstance.address,campaignBudget);

  		await addInstance.createCampaign(packageName,countryList,[1,2],campaignPrice,campaignPrice,startDate,endDate, "appcoins.io");

  		await appcInstance.transfer(accounts[1],campaignBudget);
  		countryList.push(convertCountryCodeToIndex("PT"))
  		countryList.push(convertCountryCodeToIndex("GB"))
  		countryList.push(convertCountryCodeToIndex("FR"))
  		countryList.push(convertCountryCodeToIndex("PA"))
  		await appcInstance.approve(addInstance.address,campaignBudget, { from: accounts[1]});
  		await addInstance.createCampaign(packageName,countryList,[1,2],campaignPrice,campaignBudget,startDate,endDate , "appcoins.io",  { from : accounts[1]});


  		examplePoA = new Object();
  		examplePoA.packageName = "com.facebook.orca";
  		// Need to get bid generated by create Campaign
  		examplePoA.bid = Web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000001");

  		example2PoA = new Object();
  		example2PoA.packageName = "com.facebook.orca";
  		example2PoA.bid = examplePoA.bid;

  		wrongTimestampPoA = new Object();
  		wrongTimestampPoA.packageName = "com.facebook.orca";
  		wrongTimestampPoA.bid = examplePoA.bid;

  		wrongNoncePoA = new Object();
  		wrongNoncePoA.packageName = examplePoA.packageName;
  		wrongNoncePoA.bid = Web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000001");

  		walletName = "com.asfoundation.wallet.dev";

        // New custom account that will sign the hashRoot
        privateKey0 = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200";
        privateKey1 = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201";
        privateKey2 = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202";

        const msg = "Some data to be tested";

        objSign0 = await web3.eth.accounts.sign(msg, privateKey0);
        objSign1 = await web3.eth.accounts.sign(msg, privateKey1);
        objSign2 = await web3.eth.accounts.sign(msg, privateKey2);

  	});

    it('should create a campaign', async function() {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000003");
  		var countryList = []
  		var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);

		countryList.push(convertCountryCodeToIndex("PT"))
		countryList.push(convertCountryCodeToIndex("GB"))
		countryList.push(convertCountryCodeToIndex("FR"))
		countryList.push(convertCountryCodeToIndex("PA"))

		await appcInstance.approve(addInstance.address,campaignBudget);

		var eventsStorage = AdvertisementStorageInstance.allEvents();
		var eventsInfo = addInstance.allEvents();
		var packageName1 = "com.instagram.android";

		await addInstance.createCampaign(packageName1,countryList,[1,2],campaignPrice,campaignBudget,20,1922838059980, "appcoins.io");

		var eventStorageLog = await new Promise(
				function(resolve, reject){
		        eventsStorage.watch(function(error, log){ eventsStorage.stopWatching(); resolve(log); });
		    });
		var eventInfoLog = await new Promise(
				function(resolve, reject){
		        eventsInfo.watch(function(error, log){ eventsInfo.stopWatching(); resolve(log); });
		    });

	    assert.equal(eventStorageLog.event,"CampaignCreated", "Event must be a CampaignCreated event");
	    assert.equal(eventStorageLog.args.bidId,bid,"BidId on campaign create event is not correct");
	    assert.equal(eventStorageLog.args.price,campaignPrice,"Price on campaign create event is not correct");
	    assert.equal(eventStorageLog.args.budget,campaignBudget,"Budget on campaign create event is not correct");
	    assert.equal(eventStorageLog.args.startDate,startDate,"Start date on campaign create event is not correct");
	    assert.equal(eventStorageLog.args.endDate,endDate,"Finish date on campaign create event is not correct");

		assert.equal(eventInfoLog.event,"CampaignInformation", "Event must be a CampaignInformation event");
	    assert.equal(eventInfoLog.args.bidId,bid,"BidId on campaign info event is not correct");
	    assert.equal(eventInfoLog.args.owner,accounts[0],"owner on campaign info event is not correct");
	    assert.equal(eventInfoLog.args.packageName,packageName1,"Package name on campaign info event is not correct");
	    assert.equal(eventInfoLog.args.countries[0],countryList[0],"Countries 1 on campaign info event are not correct");
	    assert.equal(eventInfoLog.args.countries[1],countryList[1],"Countries 2 on campaign info event are not correct");
	    assert.equal(eventInfoLog.args.countries[2],countryList[2],"Countries 3 on campaign info event are not correct");

		var budget = await addInstance.getBudgetOfCampaign.call(bid);

		expect(JSON.parse(budget)).to.be.equal(campaignBudget,"Campaign budget is incorrect");
		expect(await TestUtils.getBalance(adFinanceInstance.address)).to.be.equal(contractBalance+campaignBudget,"AppCoins are not being stored on AdvertisementFinance.");
		expect(await TestUtils.getBalance(addInstance.address)).to.be.equal(0,"AppCoins should not be stored on ExtendedAdvertisement. contract.");
  	});

    it('should emit an error event if no approval was issued before creating a campaign', async function() {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000003");
  		var countryList = []
  		var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);
     	countryList.push(convertCountryCodeToIndex("PT"))
		countryList.push(convertCountryCodeToIndex("GB"))
		countryList.push(convertCountryCodeToIndex("FR"))
		countryList.push(convertCountryCodeToIndex("PA"))
 		var eventsInfo = addInstance.allEvents();
		var packageName1 = "com.instagram.android";
 		await addInstance.createCampaign(packageName1,countryList,[1,2],campaignPrice,campaignBudget,20,1922838059980, "appcoins.io");

		var eventNumber = -1;
		var eventInfoLog = await new Promise(
			function(resolve, reject){
			eventsInfo.watch(function(error, log){
				eventsInfo.stopWatching();
				if(log.logIndex > eventNumber){
					eventNumber = log.logIndex;
				}
				resolve(log);
			});
		});
 		assert.equal(eventNumber,0,"Only 1 event should be emmited");
		assert.equal(eventInfoLog.event,"Error","Event must be a Error event");
		assert.equal(eventInfoLog.args.message,"Not enough allowance","Error message should be 'Not enough allowance'.")
 	})

	it('should cancel a campaign as contract owner', async function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");

		var userInitBalance = await TestUtils.getBalance(accounts[1]);
		var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);
		var campaignBalance = JSON.parse(await addInstance.getBudgetOfCampaign.call(bid));
		var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);
		await addInstance.cancelCampaign(bid);

		var newUserBalance = await TestUtils.getBalance(accounts[1]);
		var newContractBalance = await TestUtils.getBalance(adFinanceInstance.address);
		var newCampaignBalance = JSON.parse(await addInstance.getBudgetOfCampaign.call(bid));
		var validity =  await addInstance.getCampaignValidity.call(bid);


		expect(validity).to.be.equal(false);
		expect(await TestUtils.getBalance(adFinanceInstance.address)).to.be.equal(contractBalance-campaignBudget,"AppCoins are not being stored on AdvertisementFinance.");
		expect(campaignBalance).to.be.not.equal(0,"Campaign balance is 0");
		expect(newCampaignBalance).to.be.equal(0,"Campaign balance after cancel should be 0");
		expect(userInitBalance+campaignBalance).to.be.equal(newUserBalance,"User balance should be updated");
		expect(contractBalance-campaignBalance).to.be.equal(newContractBalance,"Contract balance not updated");
	})

	it('should cancel a campaign as campaign owner', async function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");

		var userInitBalance = await TestUtils.getBalance(accounts[1]);
		var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);
		var campaignBalance = JSON.parse(await addInstance.getBudgetOfCampaign.call(bid));

		await addInstance.cancelCampaign(bid, { from : accounts[1]});

		var newUserBalance = await TestUtils.getBalance(accounts[1]);
		var newContractBalance = await TestUtils.getBalance(adFinanceInstance.address);
		var newCampaignBalance = JSON.parse(await addInstance.getBudgetOfCampaign.call(bid));
		var validity =  await addInstance.getCampaignValidity.call(bid);

		expect(validity).to.be.equal(false);
		expect(await TestUtils.getBalance(adFinanceInstance.address)).to.be.equal(contractBalance-campaignBudget,"AppCoins are not being stored on AdvertisementFinance.");
		expect(await TestUtils.getBalance(addInstance.address)).to.be.equal(0,"AppCoins should not be stored on ExtendedAdvertisement. contract.");
		expect(campaignBalance).to.be.not.equal(0,"Campaign balance is 0");
		expect(newCampaignBalance).to.be.equal(0,"Campaign balance after cancel should be 0");
		expect(userInitBalance+campaignBalance).to.be.equal(newUserBalance,"User balance should be updated");
		expect(contractBalance-campaignBalance).to.be.equal(newContractBalance,"Contract balance not updated");
	})

	it('should revert cancel campaign if it is not issued from campaign owner nor from contract owner', async function () {
		var reverted = false;
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");
		await addInstance.cancelCampaign(bid,{ from : accounts[2]}).catch(
			(err) => {
				reverted = expectRevert.test(err.message);
			});
		expect(reverted).to.be.equal(true,"Revert expected");
	});

	it('should revert and emit an error event when a campaign is created without allowance', async function(){
		var userInitBalance = await TestUtils.getBalance(accounts[0]);

		await TestUtils.expectErrorMessageTest('Not enough allowance',async () => {
			var countryList = [];
			countryList.push(convertCountryCodeToIndex("GB"));
			countryList.push(convertCountryCodeToIndex("FR"));
			await addInstance.createCampaign.sendTransaction("org.telegram.messenger",countryList,[1,2],campaignPrice,campaignBudget,20,1922838059980, "appcoins.io");
		})

		var newUserBalance = await TestUtils.getBalance(accounts[0]);

		expect(userInitBalance).to.be.equal(newUserBalance);

	});

	it('should emit an event when PoA is received', async function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");
		await TestUtils.expectEventTest('BulkPoARegistered',() => {
			return addInstance.bulkRegisterPoA.sendTransaction(bid,objSign1.messageHash, objSign1.signature,1,{from: accounts[1]});
		})
	});

	it('should set the Campaign validity to false when the remaining budget is smaller than the price', function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000001");
		return addInstance.bulkRegisterPoA.sendTransaction(bid,objSign1.messageHash, objSign1.signature,1,{from: accounts[1]}).then( instance => {
			return addInstance.getCampaignValidity.call(bid).then( valid => {

				expect(valid).to.be.equal(false);
			});
		});
	});

	it('should bulkPoARegister and transfer the equivalent to one installation to the trusted party balance on finance contract', async function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000001");
		var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);
		var campaignBudget = JSON.parse(await addInstance.getBudgetOfCampaign.call(examplePoA.bid));
		await addInstance.addAddressToWhitelist(accounts[2]);
		return addInstance.bulkRegisterPoA.sendTransaction(bid,objSign2.messageHash, objSign2.signature,1,{from: accounts[2]}).then( async () => {
			var contractFinalBalance = JSON.parse(await TestUtils.getBalance(adFinanceInstance.address));
			var userVirtualBalance = JSON.parse(await addInstance.getRewardsBalance.call(accounts[2],{from: accounts[2]}));
			var campaignFinalBudget = JSON.parse(await addInstance.getBudgetOfCampaign.call(examplePoA.bid));

			expect(contractFinalBalance).to.equal(contractBalance,"No appcoins should leave the finance contract");
			expect(userVirtualBalance).to.equal(campaignPrice,"Appcoins from PoA validation should go to user's balance on finance contract");
			expect(campaignFinalBudget).to.equal(campaignBudget-campaignPrice,"Campaign balance needs to be updated")
		});


	});

	it('should revert registerPoA and emit an error event when the campaing is invalid', async () => {


		await addInstance.cancelCampaign(examplePoA.bid);

		var events = addInstance.allEvents();

		await addInstance.bulkRegisterPoA(examplePoA.bid,objSign1.messageHash, objSign1.signature,1,{from: accounts[1]});

		var eventLog = await new Promise(function (resolve,reject){
			events.watch(function(error,log){ events.stopWatching(); resolve(log); });
		})

		expect(eventLog.event).to.equal("BulkPoARegistered","Event should be a BulkRegisterPoA");
		expect(JSON.parse(eventLog.args.convertedPoAs)).to.equal(0,'No PoA should be converted');
	});

	// it('should revert if PoA root hash is incorrectly signed', async () => {
    //
    //
	// 	await addInstance.cancelCampaign(examplePoA.bid);
    //
	// 	var events = addInstance.allEvents();
    //
	// 	await addInstance.bulkRegisterPoA(examplePoA.bid, objSign1.messageHash, objSign1.signature, 1, {from: accounts[0]});
    //
	// 	var eventLog = await new Promise(function (resolve,reject){
	// 		events.watch(function(error,log){ events.stopWatching(); resolve(log); });
	// 	})
    //
	// 	expect(eventLog.event).to.equal("Error","Invalid signature");
	// });


	it('should upgrade advertisement storage and cancel all campaigns', async function() {
		var user0Balance = await TestUtils.getBalance(accounts[0]);
		var user1Balance = await TestUtils.getBalance(accounts[1]);
		var countryList = []
		countryList.push(convertCountryCodeToIndex("PT"))
		countryList.push(convertCountryCodeToIndex("GB"))
		countryList.push(convertCountryCodeToIndex("FR"))
		countryList.push(convertCountryCodeToIndex("PA"))

        AdvertisementStorageInstance = await ExtendedAdvertisementStorage.new();

		await addInstance.upgradeStorage(AdvertisementStorageInstance.address);
        await AdvertisementStorageInstance.addAddressToWhitelist(addInstance.address);

		var addsFinalBalance = await TestUtils.getBalance(AdvertisementStorageInstance.address);
		var user0FinalBalance = await TestUtils.getBalance(accounts[0]);
		var user1FinalBalance = await TestUtils.getBalance(accounts[1]);
		var bidIdList = await addInstance.getBidIdList.call();

		expect(addsFinalBalance).to.be.equal(0,'Advertisement contract balance should be 0');
		expect(await TestUtils.getBalance(adFinanceInstance.address)).to.be.equal(0,"AdvertisementFinance contract balance should be 0");
		expect(user0FinalBalance).to.be.equal(user0Balance+campaignPrice,'User 0 should receive campaignBudget value of his campaign');
		expect(user1FinalBalance).to.be.equal(user1Balance+campaignBudget,'User 1 should receive campaignBudget value of his campaign');
		expect(bidIdList.length).to.be.equal(0,'Campaign list should be 0');

		await appcInstance.approve(addInstance.address,campaignBudget, {from: accounts[1]});

		await addInstance.createCampaign(packageName,countryList,[1,2],campaignPrice,campaignBudget,startDate,endDate, "appcoins.io", { from : accounts[1]});
		var newBid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000003");
		var bidIdList = await addInstance.getBidIdList.call();

		expect(bidIdList[0]).to.be.equal(newBid,"BidId should not reset to 1 after update");
	})


	it('should upgrade advertisement contract without changing storage nor finance contracts', async function() {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");
		addInstance = await	ExtendedAdvertisement.new(appcInstance.address, AdvertisementStorageInstance.address,adFinanceInstance.address);

		await appcInstance.transfer(accounts[1],campaignBudget);
		await adFinanceInstance.setAllowedAddress(addInstance.address);

		var budget = await addInstance.getBudgetOfCampaign.call(examplePoA.bid);

		expect(JSON.parse(budget)).to.be.equal(campaignPrice,"Campaign budget is incorrect");

		await AdvertisementStorageInstance.addAddressToWhitelist(addInstance.address);
		await addInstance.addAddressToWhitelist(accounts[2]);

		var initBalance = JSON.parse(await addInstance.getRewardsBalance.call(accounts[2],{from: accounts[2]}));
        return addInstance.bulkRegisterPoA.sendTransaction(bid,objSign2.messageHash, objSign2.signature,1,{from: accounts[2]}).then( async instance => {
			var balance = JSON.parse(await addInstance.getRewardsBalance.call(accounts[2],{from: accounts[2]}));
			expect(balance).to.be.equal(campaignPrice+initBalance,'Campaign price was not transfered');
		})
	})

	it('should upgrade advertisement finance and transfer campaign money to the new contract', async function () {
		var addsBalance = await TestUtils.getBalance(AdvertisementStorageInstance.address);
		var oldFinanceInitBalance = await TestUtils.getBalance(adFinanceInstance.address);

		var advertisementFinanceInstance = await ExtendedFinance.new(appcInstance.address);

		await advertisementFinanceInstance.setAllowedAddress.sendTransaction(addInstance.address)

		var newFinanceInitBalance = await TestUtils.getBalance(advertisementFinanceInstance.address);
		var bidIdListBeforeUpgrade = await addInstance.getBidIdList.call();

		expect(newFinanceInitBalance).to.be.equal(0,'New advertisement finance contract should have an initial balance of 0');

		await addInstance.upgradeFinance(advertisementFinanceInstance.address);

		var oldFinanceFinalBalance = await TestUtils.getBalance(adFinanceInstance.address);
		var newFinanceFinalBalance = await TestUtils.getBalance(advertisementFinanceInstance.address);

		var bidIdListAfterUpgrade = await addInstance.getBidIdList.call();

		expect(newFinanceFinalBalance).to.equal(oldFinanceInitBalance,'New finance contract after upgrade should have the same balance as the old finance contract before upgrade');
		expect(oldFinanceFinalBalance).to.equal(0,'Old finance contract should have a balance of 0 after upgrade');
		expect(bidIdListAfterUpgrade).to.eql(bidIdListBeforeUpgrade,'Bid Id List should suffer no change from this upgrade');
		var devsBalance = {}
		var devsList = []

		for(var i = 0; i < bidIdListAfterUpgrade.length; i++){
			var id = bidIdListAfterUpgrade[i];
			var dev = await addInstance.getOwnerOfCampaign.call(id);
			var campaignBalance = JSON.parse(await addInstance.getBudgetOfCampaign.call(id));

			if(devsList.indexOf(dev) < 0){
				devsBalance[dev] = campaignBalance;
				devsList.push(dev);
			} else {
				devsBalance[dev] += campaignBalance;
			}

		}

		for(var j = 0; j < devsList.length; j++){
			var dev = devsList[j];
			await advertisementFinanceInstance.withdraw.sendTransaction(dev,devsBalance[dev]);
		}

		var newFinanceResetBalance = await TestUtils.getBalance(advertisementFinanceInstance.address);
		expect(newFinanceResetBalance).to.be.equal(0,'Each developer should have the same money each deposited after the upgrade on the new finance contract');

	})

	it('should allow a whitelisted address to create a campaign in behalf of a user and still withdraw funds from rewards', async function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");
		var initBalance = await TestUtils.getBalance(accounts[0]);

		await addInstance.bulkRegisterPoA.sendTransaction(bid,objSign0.messageHash, objSign0.signature,1)
		await addInstance.withdraw();
		var finalBalance = await TestUtils.getBalance(accounts[0]);

		expect(finalBalance).to.be.equal(initBalance+campaignPrice,"Balance was not withdrawn to user account");
	});

	it('should allow to withdraw a balance', async function () {
		var bid = web3.utils.toHex("0x0000000000000000000000000000000000000000000000000000000000000002");
		var initBalance = await TestUtils.getBalance(accounts[2]);
		await addInstance.addAddressToWhitelist(accounts[2]);
		return addInstance.bulkRegisterPoA.sendTransaction(bid,objSign2.messageHash, objSign2.signature,1,{from: accounts[2]})
			.then(async () => {
				var contractBalance = await TestUtils.getBalance(adFinanceInstance.address);
				return addInstance.withdraw.sendTransaction({from: accounts[2]}).then( async () => {
					var finalContractBalance = await TestUtils.getBalance(adFinanceInstance.address);
					var finalBalance = await TestUtils.getBalance(accounts[2]);
					expect(finalContractBalance).to.equal(contractBalance-campaignPrice,"Contract balance was not updated");
					expect(finalBalance).to.equal(initBalance+campaignPrice,"Balance was not withdrawn to user account");
				});
			});
	});
});
