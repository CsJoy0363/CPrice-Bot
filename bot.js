const discord = require("discord.js");
const cmc_api = require("cmc-info");
const auth = require("./auth.json");

const client = new discord.Client();

const cmc = new cmc_api("66a2a54c-a127-40fe-8925-343ac5d1f966");
let prefix = ';';


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    updateStatus();
    setInterval(updateStatus, 300000); // update status every 5 minutes
});

client.on('message', msg => {
    if (msg.content.substring(0, 1) == prefix) {
        let args = msg.content.substring(1).split(' ');
        let cmd = args[0];
        console.log(`Reqested '${cmd}'. (${msg.guild.name}#${msg.channel.name} - ${msg.guild.id})`);

        args = args.splice(1);
        switch (cmd) {
            case 'global':
                cmc.requestGlobalMetrics()
                    .then(data => {
                        let btc_dominance = numberFormat(data['btc_dominance'], 2);
                        let eth_dominance = numberFormat(data['eth_dominance'], 2);
                        let market_cap = numberFormat(data['quote']['USD']['total_market_cap'], 2);
                        let volume_24h = numberFormat(data['quote']['USD']['total_volume_24h'], 2);
                        let last_updated = data['quote']['USD']['last_update'];
                        let chunk = `**BTC dominance**: ${btc_dominance}% \n**ETH dominance**: ${eth_dominance}% \n**Total market cap**: ${market_cap} \n**Total volume 24H**: $${volume_24h} \n`;
                        msg.channel.send({
                            embed: {
                                color: 3447003,
                                fields: [{
                                    name: "Global metrics",
                                    value: chunk,
                                    inline: true
                                }, ],
                                footer: {
                                    text: `Last updated: ${last_updated}`
                                }
                            },
                        });
                    })
                    .catch(error => {
                        msg.channel.send(`Error: not found.`);
                        console.error(error);
                    });
                break;
            case 'price':
                if (args[0]) {
                    cmc.requestCoinBySymbol(args[0], 'price')
                        .then(data => {
                            msg.channel.send(`${args[0].toUpperCase()}: $${numberFormat(data, 4)}`);
                        })
                        .catch(error => {
                            msg.channel.send(`Error: not found.`);
                            console.error(error);
                        });
                } else {
                    msg.channel.send("Error: Undefined symbol.");
                }
                break;
            case 'info':
                if (args[0]) {
                    cmc.requestCoinBySymbol(args[0])
                        .then(data => {
                            let id = data['id'];
                            let name = data['name'];
                            let rank = data['cmc_rank'];
                            let supply = numberFormat(data['circulating_supply'], 2);
                            let price = numberFormat(data['quote']['USD']['price'], 4);
                            let volume_24h = numberFormat(data['quote']['USD']['volume_24h'], 2);
                            let percent_change_1h = numberFormat(data['quote']['USD']['percent_change_1h'], 2);
                            let percent_change_24h = numberFormat(data['quote']['USD']['percent_change_24h'], 2);
                            let percent_change_7d = numberFormat(data['quote']['USD']['percent_change_7d'], 2);
                            let market_cap = numberFormat(data['quote']['USD'][market_cap], 2);
                            let last_updated = data['last_updated'];
                            let chunk = `**Rank**: &{rank} \n\n**Volume 24H**: $${volume_24h} \n**Change 24H**: ${percent_change_24h}% \n**Change 7D**: ${percent_change_7d}% \n\n**Price**: $${price} \n**Circulating supply**: ${supply} \n**Market cap**: $${market_cap}`;
                            msg.channel.send({
                                embed: {
                                    color: 3447003,
                                    thumbnail: {
                                        url: `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`
                                    },
                                    fields: [{
                                        name: name,
                                        vaule: chunk,
                                        inline: true
                                    }, ],
                                    footer: {
                                        text: `Last updated: ${last_updated}`
                                    }
                                },
                            });
                        })
                        .catch(error => {
                            msg.channel.send(`Error: not found.`);
                            console.error(error);
                        });
                } else {
                    msg.channel.send("Error: Undefined symbol.");
                }
                break;
        }
    }
});

client.login(auth.token);

//play Bitcoin: $X,XXX.YY
function updateStatus() {
    cmc.requestCoinBySymbol('BTC', 'price')
        .then(data => {
            client.user.setActivity(`Bitcoin: $${numberFormat(data, )}`);
        })
        .catch(error => {
            client.user.setActivity(`API Error.`);
            console.error(error);
        });
}

function numberFormat(x, precision) {
    x = Math.round(x * Math.pow(10, precision)) / Math.pow(10, precision);
    let arr = x.toString().split(".");
    let formated = arr[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (arr.length == 2) {
        formated += "." + arr[1];
    }
    return formated;
}