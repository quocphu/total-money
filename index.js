Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

const DB_LIST_COIN = 'LIST_COIN'
const DB_OWER_LIST = 'LIST_COINT'
const DB_LIST_COINT = 'LIST_COINT'
const DB_OwnerIdList = 'OwnerIdList'

var gOwnerIdList = [];
var gListId = [];
var drawList = [];

function ditermineClass(number) {
    if (number < 0) {
        return 'red'
    }
    return 'green'
}

function getListId(cb) {
    var url = 'https://api.coinmarketcap.com/v2/listings/';
    $.get(url, function (res) {
        if (!res || !res.data) {
            return cb('Can not get data', null)
        }
        return cb(null, res.data)
    });
}

function getCoinInfo(coin, cb) {
    var url = 'https://api.coinmarketcap.com/v2/ticker/' + coin.id + '/';
    $.get(url, function (res) {
        if (!res || !res.data) {
            return cb('Can not get data', null)
        }
        var rs = {
            id: res.data.id,
            name: res.data.name,
            symbol: res.data.symbol,
            amount: coin.amount
        }
        rs = Object.assign(rs, res.data.quotes.USD)
        cb(null, rs)
    })
}

// coinList = [{id, amount}]
function getListCoinInfo(coinList, cb) {
    var rs = [];
    async.eachSeries(coinList, function (coin, next) {
        getCoinInfo(coin, function (err, coinInfo) {
            if (coinInfo) {
                rs.push(coinInfo)
            }
            next()
        })
    }, function () {
        cb(null, rs)
    })
}

data = [
    {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "price": 7577.19,
        "volume_24h": 4590290000.0,
        "market_cap": 129234180980.0,
        "percent_change_1h": 1.76,
        "percent_change_24h": 1.16,
        "percent_change_7d": -8.19,
        "amount": 10
    }
]

function addRowToTable(tableBody, data) {

    var idx = tableBody.find('tr').length - 1;

    var tr = '<tr>'
    tr += '<td>' + data.symbol + '</td>';

    var changeColor = ditermineClass(data.percent_change_1h)
    tr += `<td class="${changeColor}">${data.percent_change_1h}</td>`

    changeColor = ditermineClass(data.percent_change_24h)
    tr += `<td class="${changeColor}">${data.percent_change_24h}</td>`;

    changeColor = ditermineClass(data.percent_change_7d)
    tr += `<td class="${changeColor}">${data.percent_change_7d}</td>`;

    tr += '<td>' + data.price.formatMoney(2, '.', ',') + '</td>';
    tr += '<td>' + data.amount.formatMoney(2, '.', ',') + '</td>';
    tr += '<td class="money">' + (data.amount * data.price).formatMoney(2, '.', ',') + '</td>';
    tr += `<td></td>`;
    tr += '</tr>'

    // tr = $(tr);
    // tr.find('td:last').append($(`<a href="#" class="delete" data-idx="${idx}">X</a>`))

    tableBody.append(tr)
    tableBody.find('td:last').append($(`<a href="#" class="delete" data-idx="${idx}">X</a>`))
}

function drawTable(data) {
    var body = $('#tbl tbody');
    // Reset all row
    for (var i = 0; i < data.length; i++) {
        addRowToTable(body, data[i])
    }
}


$(document).ready(function () {


    async.series(
        [
            function (next) {
                if (!localStorage.listId) {
                    getListId(function (err, res) {
                        localStorage.setItem('listId', JSON.stringify(res));
                        next();
                    })
                } else {

                    next()
                }
            },
            function (next) {
                gListId = JSON.parse(localStorage.listId);
                next()
            },
            function (next) {
                if (localStorage.OwnerIdList) {
                    gOwnerIdList = JSON.parse(localStorage.OwnerIdList)
                }
                getListCoinInfo(gOwnerIdList, function (err, rs) {
                    gOwnerIdList = rs
                    next()
                })
            },
            function (next) {
                drawTable(gOwnerIdList)
                next()
            }
        ],
        function () {
            $('#note').hide()
            console.log('done');

            // remove row event
            // $('.delete').each(function (idx, el) {
            //     $(el).on('click', function (event) {
            //         event.preventDefault();
            //         var rmIdx = parseInt($(this).attr('data-idx'));
            //         gOwnerIdList.splice(rmIdx, 1)
            //         localStorage.setItem(DB_OwnerIdList, JSON.stringify(gOwnerIdList))
            //         $(this).closest('tr').remove()
            //     })
            // })

                $('.delete').on('click', function (event) {
                    event.preventDefault();
                    var rmIdx = parseInt($(this).attr('data-idx'));
                    gOwnerIdList.splice(rmIdx, 1)
                    localStorage.setItem(DB_OwnerIdList, JSON.stringify(gOwnerIdList))
                    $(this).closest('tr').remove()
                })
           
        }
    )


    //Add click

    $('#btnAdd').on('click', function () {
        var coinSymbol = $('#txt-symbol').val();
        var amount = $('#txt-amount').val();
        if (!coinSymbol || coinSymbol.length == 0 || coinSymbol.trim().length == 0) {
            return;
        }
        coinSymbol = coinSymbol.toUpperCase()
        var coinId = -1;
        for (var i = 0; i < gListId.length; i++) {
            if (gListId[i].symbol == coinSymbol) {
                coinId = gListId[i].id;
                break;
            }
            console.log(gListId[i].symbol);
        }
        if (coinId == -1) {
            return alert("Coin does not exist")
        }

        amount = parseFloat(amount);
        if (isNaN(amount)) {
            alert("Amount must be number")
        }

        var coin = { id: coinId, amount: amount };
        gOwnerIdList.push(coin);

        localStorage.setItem(DB_OwnerIdList, JSON.stringify(gOwnerIdList))


        var body = $('#tbl tbody');

        $('#note').show()
        getCoinInfo(coin, function (err, data) {
            if (data) {
                addRowToTable(body, data)
            } else {
                console.log('can not get data ', coinId);
            }
            $('#note').hide()
        })
        // alert(coinId)
    })

    $('#btn-sum').on('click', function(){
        var s = 0;
        for(var i = 0; i< gOwnerIdList.length; i++){
            s += (gOwnerIdList[i].price * gOwnerIdList[i].amount)
        }
        $('#txt-sum').text(s.formatMoney(2, ".", ","))
    })
})