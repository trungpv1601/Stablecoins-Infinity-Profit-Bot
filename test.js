var config = require('./config.json');

const Binance = require('binance-api-node').default;

// Authenticated client, can make signed calls
const client = Binance({
	apiKey: config.API_KEY,
	apiSecret: config.SECRET_KEY
});

client.accountInfo().then(result => {
	console.log(result);
})

// client
// 	.openOrders({
// 		symbol: 'USDCUSDT'
// 	})
// 	.then(result => {
// 		console.log(result);
// 		console.log(result.length);
// 	})
// 	.catch(err => {
// 		console.log(err);
// 	});
