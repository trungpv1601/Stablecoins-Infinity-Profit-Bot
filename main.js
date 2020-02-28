var config = require('./config.json');
var cron = require('node-cron');
var app = require('express')();
var coins = ['TUSD', 'USDT', 'USDC', 'USDC', 'PAX', 'USDS', 'USDSB'];

const Binance = require('binance-api-node').default;
const client = Binance({
	apiKey: config.API_KEY,
	apiSecret: config.SECRET_KEY
});

if (config.BOT_TOKEN == '' && config.BOT_CHAT == '') {
	bot_enabled = 0;
} else {
	const TelegramBot = require('node-telegram-bot-api');
	const TOKEN = config.BOT_TOKEN;
	var bot = new TelegramBot(TOKEN, { polling: true });
	bot.sendMessage(config.BOT_CHAT, '\u{1F916} Stablecoins Bot Starting');
	bot_enabled = 1;
}

client
	.openOrders({
		symbol: config.CURRENCY + config.MARKET
	})
	.then(result => {
		for (let index = 0; index < result.length; index++) {
			if (result[index].side == 'BUY') {
				if (bot_enabled == 1) {
					bot.sendMessage(
						config.BOT_CHAT,
						'\u{1F5E3} Purchase order found: ' +
							result[index].orderId +
							' Total of: ' +
							result[index].origQty +
							' in the amount of: ' +
							result[index].price +
							''
					);
				}
				console.log(
					'Purchase order found: ' +
						result[index].orderId +
						' Total of: ' +
						result[index].origQty +
						' in the amount of: ' +
						result[index].price +
						''
				);
				filledBuyOrder = false;
				OrderBuyID = result[index].orderId;
				buyAmount = result[index].origQty;
				buyPriceTemp = result[index].price;
			}
			if (result[index].side == 'SELL') {
				if (bot_enabled == 1) {
					bot.sendMessage(
						config.BOT_CHAT,
						'\u{1F5E3} Purchase order found: ' +
							result[index].orderId +
							' in the amount of: ' +
							result[index].origQty +
							' in the amount of: ' +
							result[index].price +
							''
					);
				}
				console.log(
					'Purchase order found: ' +
						result[index].orderId +
						' in the amount of: ' +
						result[index].origQty +
						' in the amount of: ' +
						result[index].price +
						''
				);
				filledSellOrder = false;
				OrderSellID = result[index].orderId;
				sellAmount = result[index].origQty;
				sellPriceTemp = result[index].price;
			}
		}
	});

var task = cron.schedule(
	'*/' + config.LOOP_TIME + ' * * * * *',
	() => {
		client
			.dailyStats({ symbol: config.CURRENCY + config.MARKET })
			.then(result => {
				changePrice = parseFloat(result.priceChangePercent);
				avgPrice = parseFloat(result.lastPrice);
				minDay = parseFloat(result.lowPrice);
				maxDay = parseFloat(result.highPrice);
				spreadDay = parseFloat(maxDay - minDay).toFixed(4);
				spreadOpera = parseFloat(spreadDay / 4);
				otherStables = 0;
				client
					.accountInfo({ useServerTime: true })
					.then(result => {
						for (let index = 0; index < result.balances.length; index++) {
							if (result.balances[index].asset == 'BNB') {
								balanceBNB =
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free);
							}
							if (result.balances[index].asset == 'TUSD') {
								saldo_TUSD = (
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free)
								).toFixed(8);
							}
							if (result.balances[index].asset == 'USDT') {
								saldo_USDT = (
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free)
								).toFixed(8);
							}
							if (result.balances[index].asset == 'USDC') {
								saldo_USDC = (
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free)
								).toFixed(8);
							}
							if (result.balances[index].asset == 'PAX') {
								saldo_PAX = (
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free)
								).toFixed(8);
							}
							if (result.balances[index].asset == 'USDS') {
								saldo_USDS = (
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free)
								).toFixed(8);
							}
							if (result.balances[index].asset == 'USDSB') {
								saldo_USDSB = (
									parseFloat(result.balances[index].locked) +
									parseFloat(result.balances[index].free)
								).toFixed(8);
							}

							if (result.balances[index].asset == config.MARKET) {
								marketBalanceLocked = parseFloat(result.balances[index].locked);
								marketBalanceFree = parseFloat(result.balances[index].free);
							} else if (result.balances[index].asset == config.CURRENCY) {
								currencyBalanceLocked = parseFloat(result.balances[index].locked);
								currencyBalanceFree = parseFloat(result.balances[index].free);
							}

							if (coins.indexOf(result.balances[index].asset) > -1) {
								if (
									result.balances[index].asset != config.MARKET &&
									result.balances[index].asset != config.CURRENCY
								) {
									let otherCoinsLocked = parseFloat(result.balances[index].locked);
									let otherCoinsFree = parseFloat(result.balances[index].free);
									otherStables = otherStables + (otherCoinsLocked + otherCoinsFree);
								}
							}
						}

						total = (
							marketBalanceLocked +
							marketBalanceFree +
							currencyBalanceLocked +
							currencyBalanceFree +
							otherStables
						).toFixed(8);

						if (marketBalanceLocked + marketBalanceFree < total / 2) {
							buyAmount = (((total / 2) * config.BUY_VALUE) / 100).toFixed(2);
							sellAmount = (((total / 2) * config.BUY_VALUE) / 100).toFixed(2);
						} else {
							if (currencyBalanceLocked + currencyBalanceFree < total / 2) {
								buyAmount = (((total / 2) * config.BUY_VALUE) / 100).toFixed(2);
								sellAmount = (((total / 2) * config.BUY_VALUE) / 100).toFixed(2);
							} else {
								if (setAmount == 0) {
									buyAmount = (
										((marketBalanceLocked + marketBalanceFree) * config.BUY_VALUE) /
										100
									).toFixed(2);
									sellAmount = (
										((currencyBalanceLocked + currencyBalanceFree) * config.BUY_VALUE) /
										100
									).toFixed(2);
									setAmount = 1;
								}
							}
						}

						if (config.AUTO_SPREAD == 1) {
							status_spread = 'ACTIVATED';
						} else {
							status_spread = 'DISABLED';
						}

						console.clear();
						console.log('===========================================');
						console.log(
							'BALANCE ' + config.MARKET + '...:',
							marketBalanceLocked + marketBalanceFree
						);
						console.log(
							'BALANCE ' + config.CURRENCY + '...:',
							currencyBalanceLocked + currencyBalanceFree
						);
						console.log('OTHER STABLE:', otherStables.toFixed(8));
						console.log('BNB BALANCE....:', balanceBNB);
						console.log('TOTAL BALANCE..:', total, 'USD');
						console.log('AUTO SPREAD..:', status_spread);
						console.log('MINIMUM OF THE DAY:', minDay);
						console.log('MAXIMUM OF THE DAY:', maxDay);
						console.log(config.CURRENCY + config.MARKET + '.....:', avgPrice);
						console.log('24H VARIATION.:', changePrice + ' %');
						console.log('SPREAD 24H...:', spreadDay);
						console.log('OPERA SPREAD.:', spreadOpera);
						console.log('INITIAL BALANCE:', config.INITIAL_INVESTMENT, 'USD');
						console.log('PROFIT........:', (total - config.INITIAL_INVESTMENT).toFixed(4), 'USD');
						console.log(
							'              ',
							(((total - config.INITIAL_INVESTMENT) * 100) / config.INITIAL_INVESTMENT).toFixed(2),
							'%'
						);
						console.log('===========================================');
						console.log(
							'UPTIME.......:',
							((Math.floor(+new Date() / 1000) - startTime) / 3600).toFixed(2),
							'hours'
						);
						console.log(
							'ORDERS.......:',
							'SALES: [',
							totalVendas,
							'] SHOPPING: [',
							totalCompras,
							']'
						);
						simpleStrategy();
					})
					.catch(err => {
						throw err;
					});
			})
			.catch(err => {
				console.log(err);
			});
	},
	{ scheduled: false }
);

function simpleStrategy() {
	if (OrderBuyID != 0 && hasFundsBuy == 1) {
		client
			.getOrder({
				symbol: config.CURRENCY + config.MARKET,
				orderId: OrderBuyID
			})
			.then(result => {
				dateOrderBuy = result.time;
				if (result.status == 'FILLED') {
					filledBuyOrder = true;
					if (bot_enabled == 1) {
						bot.sendMessage(
							config.BOT_CHAT,
							'\u{1f911} Purchase order successfully executed. Current balance: ' +
								config.MARKET +
								': ' +
								(marketBalanceLocked + marketBalanceFree).toFixed(4) +
								' ' +
								config.CURRENCY +
								' ' +
								(currencyBalanceLocked + currencyBalanceFree).toFixed(4) +
								' Current profit: ' +
								(total - config.INITIAL_INVESTMENT).toFixed(4) +
								' USD' +
								' \u{1F4B0} ' +
								(((total - config.INITIAL_INVESTMENT) * 100) / config.INITIAL_INVESTMENT).toFixed(
									2
								) +
								'%'
						);
					}
					client
						.cancelOrder({
							symbol: config.CURRENCY + config.MARKET,
							orderId: OrderSellID
						})
						.catch(err => {
							console.log(err);
						});
				}

				if (result.status == 'CANCELED') {
					filledBuyOrder = true;
					if (bot_enabled == 1) {
						bot.sendMessage(
							config.BOT_CHAT,
							'\u{1f6a8} Purchase Order ' +
								OrderBuyID +
								' canceled on the exchange, generating a new order.'
						);
					}
				}
			})
			.catch(err => {
				throw err;
			});
	}

	if (OrderSellID != 0 && hasFundsSell == 1) {
		client
			.getOrder({
				symbol: config.CURRENCY + config.MARKET,
				orderId: OrderSellID
			})
			.then(result => {
				dateOrderSell = result.time;
				if (result.status == 'FILLED') {
					filledSellOrder = true;
					if (bot_enabled == 1) {
						bot.sendMessage(
							config.BOT_CHAT,
							'\u{1f911} Sales order successfully executed. Current balance: ' +
								config.MARKET +
								': ' +
								(marketBalanceLocked + marketBalanceFree).toFixed(4) +
								' ' +
								config.CURRENCY +
								' ' +
								(currencyBalanceLocked + currencyBalanceFree).toFixed(4) +
								' Current profit: ' +
								(total - config.INITIAL_INVESTMENT).toFixed(4) +
								' USD' +
								' \u{1F4B0} ' +
								(((total - config.INITIAL_INVESTMENT) * 100) / config.INITIAL_INVESTMENT).toFixed(
									2
								) +
								'%'
						);
					}
					client
						.cancelOrder({
							symbol: config.CURRENCY + config.MARKET,
							orderId: OrderBuyID
						})
						.catch(err => {
							console.log(err);
						});
				}

				if (result.status == 'CANCELED') {
					filledSellOrder = true;
					if (bot_enabled == 1) {
						bot.sendMessage(
							config.BOT_CHAT,
							'\u{1f6a8} Sales order ' +
								OrderSellID +
								' canceled on the exchange, generating a new order.'
						);
					}
				}
			})
			.catch(err => {
				throw err;
			});
	}

	if (config.ORDER_EXPIRE != 0) {
		date = new Date(dateOrderBuy);
		dateOrderBuyExpire = date.setHours(date.getHours() + config.ORDER_EXPIRE);
		if (
			dateOrderBuyExpire > 1546300800 &&
			Date.now() > dateOrderBuyExpire &&
			OrderBuyID != 0 &&
			buyPriceTemp != 0 &&
			countExpireBuy > 2
		) {
			if (bot_enabled == 1) {
				bot.sendMessage(
					config.BOT_CHAT,
					'\u{231b} The purchase order expired on ' +
						new Date(dateOrderSellExpire) +
						' without market execution. Timeout in ' +
						config.ORDER_EXPIRE +
						' hours. A new purchase order for operation will be generated.'
				);
			}
			client
				.cancelOrder({
					symbol: config.CURRENCY + config.MARKET,
					orderId: OrderBuyID
				})
				.catch(err => {
					console.log(err);
				});
			countExpireBuy = 0;
		} else {
			countExpireBuy++;
		}

		date = new Date(dateOrderSell);
		dateOrderSellExpire = date.setHours(date.getHours() + config.ORDER_EXPIRE);
		if (
			dateOrderSellExpire > 1546300800 &&
			Date.now() > dateOrderSellExpire &&
			OrderSellID != 0 &&
			sellPriceTemp != 0 &&
			countExpireSell > 2
		) {
			if (bot_enabled == 1) {
				bot.sendMessage(
					config.BOT_CHAT,
					'\u{231b} The sales order expired on ' +
						new Date(dateOrderSellExpire) +
						' without market execution. Timeout in ' +
						config.ORDER_EXPIRE +
						' hours. A new sales order for operation will be generated.'
				);
			}
			client
				.cancelOrder({
					symbol: config.CURRENCY + config.MARKET,
					orderId: OrderSellID
				})
				.catch(err => {
					console.log(err);
				});
			countExpireSell = 0;
		} else {
			countExpireSell++;
		}
	}

	if (
		config.AUTO_SPREAD == 1 &&
		SpreadTemp != 0 &&
		SpreadTemp != spreadOpera &&
		spreadOpera >= config.SPREAD_MIN
	) {
		if (bot_enabled == 1) {
			bot.sendMessage(
				config.BOT_CHAT,
				'\u{1f6a7} Adjustment in the market spread of ' +
					SpreadTemp +
					' for ' +
					spreadOpera +
					' for variation of ' +
					changePrice +
					' %. The next orders will use this margin.'
			);
		}
	}
	SpreadTemp = spreadOpera;
	changePriceTemp = changePrice;

	if (config.AUTO_SPREAD == 1) {
		if ((OrderSellID == 0 && OrderBuyID == 0) || spreadOpera <= config.SPREAD_MIN) {
			spreadOpera = config.SPREAD_MIN;
			buyPrice = (avgPrice * (1 - spreadOpera)).toFixed(4);
			sellPrice = (avgPrice * (1 + spreadOpera)).toFixed(4);
		} else {
			buyPrice = (avgPrice - spreadOpera).toFixed(4);
			sellPrice = (avgPrice + spreadOpera).toFixed(4);
		}
	} else {
		buyPrice = (avgPrice * (1 - config.SPREAD_BUY)).toFixed(4);
		sellPrice = (avgPrice * (1 + config.SPREAD_SELL)).toFixed(4);
	}

	client
		.myTrades({
			symbol: config.CURRENCY + config.MARKET
		})
		.then(result => {
			if (filledSellOrder == true) {
				for (let index = result.length - 1; index > 1; index--) {
					if (
						result[index].isBuyer == true &&
						filledSellOrder == true &&
						currencyBalanceFree >= 20
					) {
						if (sellPrice - parseFloat(result[index].price).toFixed(4) < spreadOpera) {
							let sellPriceTemp = (
								parseFloat(result[index].price).toFixed(4) *
								(1 + spreadOpera)
							).toFixed(4);
							if (
								sellPriceTemp > avgPrice &&
								sellPriceTemp - avgPrice >= spreadOpera &&
								notifySellMin == 0
							) {
								sellPrice = sellPriceTemp;
								if (bot_enabled == 1) {
									bot.sendMessage(
										config.BOT_CHAT,
										'\u{2716} WARNING: The sales order is below the spread difference ' +
											spreadOpera +
											' of the last purchase order in the amount of ' +
											parseFloat(result[index].price).toFixed(4) +
											' compared to the current market price in ' +
											avgPrice +
											'. It had its value readjusted to: ' +
											sellPrice +
											'.'
									);
								}
							} else {
								if (bot_enabled == 1 && notifySellMin == 0) {
									bot.sendMessage(
										config.BOT_CHAT,
										'\u{2714} NOTICE: The sales order is within the spread difference ' +
											spreadOpera +
											' of the last purchase order in the amount of ' +
											parseFloat(result[index].price).toFixed(4) +
											''
									);
								}
							}
						} else {
							if (bot_enabled == 1 && notifySellMin == 0) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{2714} NOTICE: The sales order is within the spread difference ' +
										spreadOpera +
										' of the last purchase order in the amount of ' +
										parseFloat(result[index].price).toFixed(4) +
										''
								);
							}
						}
						index = 0;
					}
				}
			}

			if (filledBuyOrder == true) {
				for (let index = result.length - 1; index > 1; index--) {
					if (result[index].isBuyer == false && filledBuyOrder == true && marketBalanceFree >= 20) {
						if (buyPrice - parseFloat(result[index].price).toFixed(4) < spreadOpera) {
							let buyPriceTemp = (
								parseFloat(result[index].price).toFixed(4) *
								(1 - spreadOpera)
							).toFixed(4);
							if (
								buyPriceTemp < avgPrice &&
								avgPrice - buyPriceTemp >= spreadOpera &&
								notifyBuyMax == 0
							) {
								buyPrice = buyPriceTemp;
								if (bot_enabled == 1) {
									bot.sendMessage(
										config.BOT_CHAT,
										'\u{2716} WARNING: The purchase order is below the spread difference ' +
											spreadOpera +
											' of the last sales order in the amount of ' +
											parseFloat(result[index].price).toFixed(4) +
											' compared to the current market price in ' +
											avgPrice +
											'. It had its value readjusted to: ' +
											buyPrice +
											'.'
									);
								}
							} else {
								if (bot_enabled == 1 && notifyBuyMax == 0) {
									bot.sendMessage(
										config.BOT_CHAT,
										'\u{2714} NOTICE: The purchase order is within the spread difference ' +
											spreadOpera +
											' of the last sales order in the amount of ' +
											parseFloat(result[index].price).toFixed(4) +
											''
									);
								}
							}
						} else {
							if (bot_enabled == 1 && notifyBuyMax == 0) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{2714} NOTICE: The purchase order is within the spread difference ' +
										spreadOpera +
										' of the last sales order in the amount of ' +
										parseFloat(result[index].price).toFixed(4) +
										''
								);
							}
						}
						index = 0;
					}
				}
			}
		});

	client
		.dailyStats({ symbol: 'BTC' + config.MARKET })
		.then(result => {
			console.log('DEFINED....: Purchase ' + buyPrice + ' and Sale ' + sellPrice);
			console.log('TIMEOUT ORDER:' + ' ' + config.ORDER_EXPIRE + ' hours');
			console.log('TIME NOW...:' + ' ' + new Date());
			console.log('============== PURCHASE DATA ============');
			console.log('PURCHASE VALUE.:', buyAmount);
			console.log('PRICE PURCHASE.:', parseFloat(buyPriceTemp).toFixed(4));
			console.log('BUY ORDER ID.:', OrderBuyID);
			console.log('EXPIRES IN....:', new Date(dateOrderBuyExpire));
			console.log('============== SALES DATA =============');
			console.log('SELL VALUE..:', sellAmount);
			console.log('PRICE SALE..:', parseFloat(sellPriceTemp).toFixed(4));
			console.log('SELL ORDER ID:', OrderSellID);
			console.log('EXPIRES IN....:', new Date(dateOrderSellExpire));
			console.log('===========================================');
			client
				.openOrders({
					symbol: config.CURRENCY + config.MARKET
				})
				.then(result => {
					if (filledBuyOrder == true) {
						if (
							(marketBalanceFree > 20 || marketBalanceFree >= buyAmount) &&
							buyPrice < config.BUY_MAX
						) {
							if (marketBalanceFree > 20 && marketBalanceFree <= buyAmount) {
								buyAmount = parseFloat(marketBalanceFree).toFixed(2);
							}
							client
								.order({
									symbol: config.CURRENCY + config.MARKET,
									side: 'BUY',
									quantity: buyAmount,
									price: buyPrice,
									useServerTime: true
								})
								.then(result => {
									totalCompras++;
									OrderBuyID = result.orderId;
									filledBuyOrder = false;
								})
								.catch(err => {
									totalCompras--;
									throw err;
								});
							notifyBuyMax = 0;
							hasFundsBuy = 1;
							buyPriceTemp = buyPrice;
							if (bot_enabled == 1) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{1F4C9} Purchase order successfully created: Quantity purchased: \u{1f4b5} ' +
										buyAmount +
										', purchase price: \u{1f3f7} ' +
										buyPrice +
										' using spread on ' +
										spreadOpera +
										'.'
								);
							}
						} else {
							if (bot_enabled == 1 && notifyBuyMax == 0 && marketBalanceFree >= buyAmount) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{274C} The purchase value of the market is above that defined in ' +
										config.BUY_MAX +
										'. The bot will wait for the price to drop to the set value to avoid losses.'
								);
								notifyBuyMax = 1;
							}
							if (bot_enabled == 1 && hasFundsBuy == 1 && notifyBuyMax == 0) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{1F6AB} The bot is out of balance for purchases in ' +
										config.MARKET +
										'. Your current balance is: ' +
										marketBalanceFree +
										'. The bot will wait until a purchase is executed to release balance.'
								);
								notifyBuyMax = 1;
							}
							OrderBuyID = 0;
							hasFundsBuy = 0;
						}
					}

					if (filledSellOrder == true) {
						if (
							(currencyBalanceFree > 20 || currencyBalanceFree >= sellAmount) &&
							sellPrice > config.SELL_MIN
						) {
							if (currencyBalanceFree > 20 && currencyBalanceFree <= sellAmount) {
								sellAmount = parseFloat(currencyBalanceFree).toFixed(2);
							}
							client
								.order({
									symbol: config.CURRENCY + config.MARKET,
									side: 'SELL',
									quantity: sellAmount,
									price: sellPrice,
									useServerTime: true
								})
								.then(result => {
									totalVendas++;
									OrderSellID = result.orderId;
									filledSellOrder = false;
								})
								.catch(err => {
									totalVendas--;
									throw err;
								});
							notifySellMin = 0;
							hasFundsSell = 1;
							sellPriceTemp = sellPrice;
							if (bot_enabled == 1) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{1F4C8} Sales order created successfully: Quantity sold: \u{1f4b5} ' +
										sellAmount +
										', sale value: \u{1f3f7} ' +
										sellPrice +
										' using spread on ' +
										spreadOpera +
										'.'
								);
							}
						} else {
							if (bot_enabled == 1 && notifySellMin == 0 && currencyBalanceFree >= sellAmount) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{274C} The sale value of the market is below that defined in ' +
										config.SELL_MIN +
										'. The bot will wait for the price to increase to the set value to avoid losses.'
								);
								notifySellMin = 1;
							}
							if (bot_enabled == 1 && hasFundsSell == 1 && notifySellMin == 0) {
								bot.sendMessage(
									config.BOT_CHAT,
									'\u{1F6AB} The bot is out of balance for sales in ' +
										config.CURRENCY +
										'. Your current balance is: ' +
										currencyBalanceFree +
										'. The bot will wait until a purchase is executed to release balance.'
								);
								notifySellMin = 1;
							}
							OrderSellID = 0;
							hasFundsSell = 0;
						}
					}
				})
				.catch(err => {
					throw err;
				});
		})
		.catch(err => {
			throw err;
		});
}

// limpa o console
console.clear();
// define as variaveis
notifyBuyMax = 0;
notifySellMin = 0;
otherStables = 0;
hasFundsBuy = 1;
hasFundsSell = 1;
countExpireBuy = 0;
countExpireSell = 0;
dateOrderBuy = 0;
dateOrderBuyExpire = 0;
dateOrderSell = 0;
dateOrderSellExpire = 0;
buyPriceTemp = 0;
sellPriceTemp = 0;
changePriceTemp = 0;
startTime = Math.floor(+new Date() / 1000);
avgPrice = 0;
OrderBuyID = 0;
filledBuyOrder = true;
filledSellOrder = true;
OrderSellID = 0;
SpreadTemp = 0;
totalCompras = 0;
totalVendas = 0;
marketBalanceLocked = 0;
marketBalanceFree = 0;
currencyBalanceLocked = 0;
currencyBalanceFree = 0;
total = 0;
setAmount = 0;
setBuyOrder = 0;
saldo_TUSD = 0;
saldo_USDT = 0;
saldo_USDC = 0;
saldo_PAX = 0;
saldo_USDS = 0;
saldo_USDSB = 0;
total_stable = 0;

console.log('Getting Started...');

task.start();

app.get('/', (req, res) => {
	let total_investiment = (total - config.INITIAL_INVESTMENT).toFixed(8);
	res.json({
		initialInvestment: config.INITIAL_INVESTMENT,
		market: config.MARKET,
		currency: config.CURRENCY,
		balances: {
			usdt: parseFloat(saldo_USDT),
			tusd: parseFloat(saldo_TUSD),
			pax: parseFloat(saldo_PAX),
			usdc: parseFloat(saldo_USDC),
			usds: parseFloat(saldo_USDS),
			usdsb: parseFloat(saldo_USDSB)
		},
		profit: {
			USD: parseFloat(total_investiment),
			percent: parseFloat(
				(((total - config.INITIAL_INVESTMENT) * 100) / config.INITIAL_INVESTMENT).toFixed(2)
			)
		}
	});
});

app.listen(config.LISTEN_PORT);
