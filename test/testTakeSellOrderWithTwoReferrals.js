const actors = require("./config/actors");
const contract = require("./helper/contract");
const config = require("./config/config");
const utils = require("./helper/utils");
const assert = require("./helper/assert").assertString;

const etherAddress = config.etherAddress;
const { feeAccount, alice, evelyn, stan, george } = actors;

describe("order maker and order taker have referrers", () => {
    let cfg;
    let tokenContractAddress;
    let weidexContract;

    before(async () => {
        cfg = await utils.init();
        weidexContract = cfg.exchange.instance;
        tokenContractAddress = cfg.token.address;

        await contract.transferTokens(cfg.token, alice.wallet, 100000);
        await contract.depositTokensWithReferral(alice.wallet, cfg.token, cfg.exchange, 100000, george.wallet);
        await contract.depositEthersWithReferral(cfg.exchange, evelyn.wallet, 10, stan.wallet);
    });

    describe("take sell order", () => {
        it("should execute the order without exception", async () => {
            await contract.takeSellOrder(alice.wallet, evelyn.wallet, cfg.token, 10000, 1, 154, cfg.exchange, 1);

            await utils.updateExchangeBalancesAfter(weidexContract, tokenContractAddress);
            assert(alice.exchangeBalanceAfter, "90000000000000000000000");
            assert(evelyn.exchangeBalanceAfter, "9990000000000000000000");
            assert(george.exchangeBalanceAfter, "0");
            assert(stan.exchangeBalanceAfter, "2000000000000000000");
            assert(feeAccount.exchangeBalanceAfter, "8000000000000000000");

            await utils.updateExchangeBalancesAfter(weidexContract, etherAddress);
            assert(alice.exchangeBalanceAfter, "999000000000000000");
            assert(evelyn.exchangeBalanceAfter, "9000000000000000000");
            assert(george.exchangeBalanceAfter, "200000000000000");
            assert(stan.exchangeBalanceAfter, "0");
            assert(feeAccount.exchangeBalanceAfter, "800000000000000");
        });

        it("should have correct balances", async () => {
            await utils.updateExchangeBalancesAfter(weidexContract, tokenContractAddress);
            assert(alice.exchangeBalanceAfter, "90000000000000000000000");
            assert(evelyn.exchangeBalanceAfter, "9990000000000000000000");
            assert(feeAccount.exchangeBalanceAfter, "8000000000000000000");

            await utils.updateExchangeBalancesAfter(weidexContract, etherAddress);
            assert(alice.exchangeBalanceAfter, "999000000000000000");
            assert(evelyn.exchangeBalanceAfter, "9000000000000000000");
            assert(feeAccount.exchangeBalanceAfter, "800000000000000");
        });

        it("should have correct balances for the referrers", async () => {
            await utils.updateExchangeBalancesAfter(weidexContract, tokenContractAddress);
            assert(george.exchangeBalanceAfter, "0");
            assert(stan.exchangeBalanceAfter, "2000000000000000000");

            await utils.updateExchangeBalancesAfter(weidexContract, etherAddress);
            assert(george.exchangeBalanceAfter, "200000000000000");
            assert(stan.exchangeBalanceAfter, "0");
        });

        it("should have correct volume", async () => {
            const dailyVolumeAfter = await weidexContract.dailyVolume();
            assert(dailyVolumeAfter, "1000000000000000000");
        });
    });
});
