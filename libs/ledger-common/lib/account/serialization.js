"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
exports.__esModule = true;
exports.fromNFTRaw = exports.toNFTRaw = exports.toAccountRaw = exports.fromAccountRaw = exports.toAccountLikeRaw = exports.fromAccountLikeRaw = exports.toSubAccountRaw = exports.fromSubAccountRaw = exports.toChildAccountRaw = exports.fromChildAccountRaw = exports.toTokenAccountRaw = exports.fromTokenAccountRaw = exports.toSwapOperationRaw = exports.fromSwapOperationRaw = exports.fromOperationRaw = exports.inferSubOperations = exports.toOperationRaw = exports.fromBalanceHistoryRaw = exports.toBalanceHistoryRaw = void 0;
var bignumber_js_1 = require("bignumber.js");
var currencies_1 = require("../currencies");
var helpers_1 = require("./helpers");
var balanceHistoryCache_1 = require("./balanceHistoryCache");
function toBalanceHistoryRaw(b) {
    return b.map(function (_a) {
        var date = _a.date, value = _a.value;
        return [date.toISOString(), value.toString()];
    });
}
exports.toBalanceHistoryRaw = toBalanceHistoryRaw;
function fromBalanceHistoryRaw(b) {
    return b.map(function (_a) {
        var _b = __read(_a, 2), date = _b[0], value = _b[1];
        return ({
            date: new Date(date),
            value: parseFloat(value)
        });
    });
}
exports.fromBalanceHistoryRaw = fromBalanceHistoryRaw;
// STP: to add a composition in ledger-live-common
var toOperationRaw = function (_a, preserveSubOperation) {
    var date = _a.date, value = _a.value, fee = _a.fee, subOperations = _a.subOperations, internalOperations = _a.internalOperations, nftOperations = _a.nftOperations, extra = _a.extra, id = _a.id, hash = _a.hash, type = _a.type, senders = _a.senders, recipients = _a.recipients, blockHeight = _a.blockHeight, blockHash = _a.blockHash, transactionSequenceNumber = _a.transactionSequenceNumber, accountId = _a.accountId, hasFailed = _a.hasFailed, contract = _a.contract, operator = _a.operator, standard = _a.standard, tokenId = _a.tokenId;
    var copy = {
        id: id,
        hash: hash,
        type: type,
        senders: senders,
        recipients: recipients,
        accountId: accountId,
        blockHash: blockHash,
        blockHeight: blockHeight,
        extra: extra,
        date: date.toISOString(),
        value: value.toFixed(),
        fee: fee.toString(),
        contract: contract,
        operator: operator,
        standard: standard,
        tokenId: tokenId
    };
    if (transactionSequenceNumber !== undefined) {
        copy.transactionSequenceNumber = transactionSequenceNumber;
    }
    if (hasFailed !== undefined) {
        copy.hasFailed = hasFailed;
    }
    if (subOperations && preserveSubOperation) {
        copy.subOperations = subOperations.map(function (o) { return (0, exports.toOperationRaw)(o); });
    }
    if (internalOperations) {
        copy.internalOperations = internalOperations.map(function (o) { return (0, exports.toOperationRaw)(o); });
    }
    if (nftOperations) {
        copy.nftOperations = nftOperations.map(function (o) { return (0, exports.toOperationRaw)(o); });
    }
    return copy;
};
exports.toOperationRaw = toOperationRaw;
var inferSubOperations = function (txHash, subAccounts) {
    var all = [];
    for (var i = 0; i < subAccounts.length; i++) {
        var ta = subAccounts[i];
        for (var j = 0; j < ta.operations.length; j++) {
            var op = ta.operations[j];
            if (op.hash === txHash) {
                all.push(op);
            }
        }
        for (var j = 0; j < ta.pendingOperations.length; j++) {
            var op = ta.pendingOperations[j];
            if (op.hash === txHash) {
                all.push(op);
            }
        }
    }
    return all;
};
exports.inferSubOperations = inferSubOperations;
// STP: to add a composition in ledger-live-common
var fromOperationRaw = function (_a, accountId, subAccounts) {
    var date = _a.date, value = _a.value, fee = _a.fee, extra = _a.extra, subOperations = _a.subOperations, internalOperations = _a.internalOperations, nftOperations = _a.nftOperations, id = _a.id, hash = _a.hash, type = _a.type, senders = _a.senders, recipients = _a.recipients, blockHeight = _a.blockHeight, blockHash = _a.blockHash, transactionSequenceNumber = _a.transactionSequenceNumber, hasFailed = _a.hasFailed, contract = _a.contract, operator = _a.operator, standard = _a.standard, tokenId = _a.tokenId;
    var res = {
        id: id,
        hash: hash,
        type: type,
        senders: senders,
        recipients: recipients,
        accountId: accountId,
        blockHash: blockHash,
        blockHeight: blockHeight,
        date: new Date(date),
        value: new bignumber_js_1.BigNumber(value),
        fee: new bignumber_js_1.BigNumber(fee),
        extra: extra || {},
        contract: contract,
        operator: operator,
        standard: standard,
        tokenId: tokenId
    };
    if (transactionSequenceNumber !== undefined) {
        res.transactionSequenceNumber = transactionSequenceNumber;
    }
    if (hasFailed !== undefined) {
        res.hasFailed = hasFailed;
    }
    if (subAccounts) {
        res.subOperations = (0, exports.inferSubOperations)(hash, subAccounts);
    }
    else if (subOperations) {
        res.subOperations = subOperations.map(function (o) {
            return (0, exports.fromOperationRaw)(o, o.accountId);
        });
    }
    if (internalOperations) {
        res.internalOperations = internalOperations.map(function (o) {
            return (0, exports.fromOperationRaw)(o, o.accountId);
        });
    }
    if (nftOperations) {
        res.nftOperations = nftOperations.map(function (o) {
            return (0, exports.fromOperationRaw)(o, o.accountId);
        });
    }
    return res;
};
exports.fromOperationRaw = fromOperationRaw;
function fromSwapOperationRaw(raw) {
    var fromAmount = raw.fromAmount, toAmount = raw.toAmount;
    return __assign(__assign({}, raw), { fromAmount: new bignumber_js_1.BigNumber(fromAmount), toAmount: new bignumber_js_1.BigNumber(toAmount) });
}
exports.fromSwapOperationRaw = fromSwapOperationRaw;
function toSwapOperationRaw(so) {
    var fromAmount = so.fromAmount, toAmount = so.toAmount;
    return __assign(__assign({}, so), { fromAmount: fromAmount.toString(), toAmount: toAmount.toString() });
}
exports.toSwapOperationRaw = toSwapOperationRaw;
function fromTokenAccountRaw(raw) {
    var id = raw.id, parentId = raw.parentId, tokenId = raw.tokenId, starred = raw.starred, operations = raw.operations, pendingOperations = raw.pendingOperations, creationDate = raw.creationDate, balance = raw.balance, spendableBalance = raw.spendableBalance, compoundBalance = raw.compoundBalance, balanceHistoryCache = raw.balanceHistoryCache, swapHistory = raw.swapHistory, approvals = raw.approvals;
    var token = (0, currencies_1.getTokenById)(tokenId);
    var convertOperation = function (op) { return (0, exports.fromOperationRaw)(op, id); };
    var res = {
        type: "TokenAccount",
        id: id,
        parentId: parentId,
        token: token,
        starred: starred || false,
        balance: new bignumber_js_1.BigNumber(balance),
        spendableBalance: spendableBalance
            ? new bignumber_js_1.BigNumber(spendableBalance)
            : new bignumber_js_1.BigNumber(balance),
        compoundBalance: compoundBalance
            ? new bignumber_js_1.BigNumber(compoundBalance)
            : undefined,
        creationDate: new Date(creationDate || Date.now()),
        operationsCount: raw.operationsCount || (operations && operations.length) || 0,
        operations: (operations || []).map(convertOperation),
        pendingOperations: (pendingOperations || []).map(convertOperation),
        swapHistory: (swapHistory || []).map(fromSwapOperationRaw),
        approvals: approvals,
        balanceHistoryCache: balanceHistoryCache || balanceHistoryCache_1.emptyHistoryCache
    };
    res.balanceHistoryCache = (0, balanceHistoryCache_1.generateHistoryFromOperations)(res);
    return res;
}
exports.fromTokenAccountRaw = fromTokenAccountRaw;
function toTokenAccountRaw(ta) {
    var id = ta.id, parentId = ta.parentId, token = ta.token, starred = ta.starred, operations = ta.operations, operationsCount = ta.operationsCount, pendingOperations = ta.pendingOperations, balance = ta.balance, spendableBalance = ta.spendableBalance, compoundBalance = ta.compoundBalance, balanceHistoryCache = ta.balanceHistoryCache, swapHistory = ta.swapHistory, approvals = ta.approvals;
    return {
        type: "TokenAccountRaw",
        id: id,
        parentId: parentId,
        starred: starred,
        tokenId: token.id,
        balance: balance.toString(),
        spendableBalance: spendableBalance.toString(),
        compoundBalance: compoundBalance ? compoundBalance.toString() : undefined,
        balanceHistoryCache: balanceHistoryCache,
        creationDate: ta.creationDate.toISOString(),
        operationsCount: operationsCount,
        operations: operations.map(function (o) { return (0, exports.toOperationRaw)(o); }),
        pendingOperations: pendingOperations.map(function (o) { return (0, exports.toOperationRaw)(o); }),
        swapHistory: (swapHistory || []).map(toSwapOperationRaw),
        approvals: approvals
    };
}
exports.toTokenAccountRaw = toTokenAccountRaw;
function fromChildAccountRaw(raw) {
    var id = raw.id, name = raw.name, parentId = raw.parentId, currencyId = raw.currencyId, starred = raw.starred, creationDate = raw.creationDate, operations = raw.operations, operationsCount = raw.operationsCount, pendingOperations = raw.pendingOperations, balance = raw.balance, address = raw.address, balanceHistoryCache = raw.balanceHistoryCache, swapHistory = raw.swapHistory;
    var currency = (0, currencies_1.getCryptoCurrencyById)(currencyId);
    var convertOperation = function (op) { return (0, exports.fromOperationRaw)(op, id); };
    var res = {
        type: "ChildAccount",
        id: id,
        name: name,
        starred: starred || false,
        parentId: parentId,
        currency: currency,
        address: address,
        balance: new bignumber_js_1.BigNumber(balance),
        creationDate: new Date(creationDate || Date.now()),
        operationsCount: operationsCount || (operations && operations.length) || 0,
        operations: (operations || []).map(convertOperation),
        pendingOperations: (pendingOperations || []).map(convertOperation),
        swapHistory: (swapHistory || []).map(fromSwapOperationRaw),
        balanceHistoryCache: balanceHistoryCache || balanceHistoryCache_1.emptyHistoryCache
    };
    res.balanceHistoryCache = (0, balanceHistoryCache_1.generateHistoryFromOperations)(res);
    return res;
}
exports.fromChildAccountRaw = fromChildAccountRaw;
function toChildAccountRaw(ca) {
    var id = ca.id, name = ca.name, parentId = ca.parentId, starred = ca.starred, currency = ca.currency, operations = ca.operations, operationsCount = ca.operationsCount, pendingOperations = ca.pendingOperations, balance = ca.balance, balanceHistoryCache = ca.balanceHistoryCache, address = ca.address, creationDate = ca.creationDate, swapHistory = ca.swapHistory;
    return {
        type: "ChildAccountRaw",
        id: id,
        name: name,
        starred: starred,
        parentId: parentId,
        address: address,
        operationsCount: operationsCount,
        currencyId: currency.id,
        balance: balance.toString(),
        balanceHistoryCache: balanceHistoryCache,
        creationDate: creationDate.toISOString(),
        operations: operations.map(function (o) { return (0, exports.toOperationRaw)(o); }),
        pendingOperations: pendingOperations.map(function (o) { return (0, exports.toOperationRaw)(o); }),
        swapHistory: (swapHistory || []).map(toSwapOperationRaw)
    };
}
exports.toChildAccountRaw = toChildAccountRaw;
function fromSubAccountRaw(raw) {
    switch (raw.type) {
        case "ChildAccountRaw":
            return fromChildAccountRaw(raw);
        case "TokenAccountRaw":
            return fromTokenAccountRaw(raw);
        default:
            throw new Error("invalid raw.type=" + raw.type);
    }
}
exports.fromSubAccountRaw = fromSubAccountRaw;
function toSubAccountRaw(subAccount) {
    switch (subAccount.type) {
        case "ChildAccount":
            return toChildAccountRaw(subAccount);
        case "TokenAccount":
            return toTokenAccountRaw(subAccount);
        default:
            throw new Error("invalid subAccount.type=" + subAccount.type);
    }
}
exports.toSubAccountRaw = toSubAccountRaw;
function fromAccountLikeRaw(rawAccountLike) {
    if ("type" in rawAccountLike) {
        //$FlowFixMe
        return fromSubAccountRaw(rawAccountLike);
    }
    //$FlowFixMe
    return fromAccountRaw(rawAccountLike);
}
exports.fromAccountLikeRaw = fromAccountLikeRaw;
function toAccountLikeRaw(accountLike) {
    switch (accountLike.type) {
        case "Account":
            return toAccountRaw(accountLike);
        default:
            return toSubAccountRaw(accountLike);
    }
}
exports.toAccountLikeRaw = toAccountLikeRaw;
// STP: to add a composition in ledger-live-common
function fromAccountRaw(rawAccount) {
    var id = rawAccount.id, seedIdentifier = rawAccount.seedIdentifier, derivationMode = rawAccount.derivationMode, index = rawAccount.index, xpub = rawAccount.xpub, starred = rawAccount.starred, used = rawAccount.used, freshAddress = rawAccount.freshAddress, freshAddressPath = rawAccount.freshAddressPath, freshAddresses = rawAccount.freshAddresses, name = rawAccount.name, blockHeight = rawAccount.blockHeight, endpointConfig = rawAccount.endpointConfig, currencyId = rawAccount.currencyId, unitMagnitude = rawAccount.unitMagnitude, operations = rawAccount.operations, operationsCount = rawAccount.operationsCount, pendingOperations = rawAccount.pendingOperations, lastSyncDate = rawAccount.lastSyncDate, creationDate = rawAccount.creationDate, balance = rawAccount.balance, balanceHistoryCache = rawAccount.balanceHistoryCache, spendableBalance = rawAccount.spendableBalance, subAccountsRaw = rawAccount.subAccounts, swapHistory = rawAccount.swapHistory, syncHash = rawAccount.syncHash, nfts = rawAccount.nfts;
    var subAccounts = subAccountsRaw &&
        subAccountsRaw
            .map(function (ta) {
            if (ta.type === "TokenAccountRaw") {
                if ((0, currencies_1.findTokenById)(ta.tokenId)) {
                    return fromTokenAccountRaw(ta);
                }
            }
            else {
                return fromSubAccountRaw(ta);
            }
        })
            .filter(Boolean);
    var currency = (0, currencies_1.getCryptoCurrencyById)(currencyId);
    var unit = currency.units.find(function (u) { return u.magnitude === unitMagnitude; }) ||
        currency.units[0];
    var convertOperation = function (op) {
        return (0, exports.fromOperationRaw)(op, id, subAccounts);
    };
    var res = {
        type: "Account",
        id: id,
        starred: starred || false,
        used: false,
        // filled again below
        seedIdentifier: seedIdentifier,
        derivationMode: derivationMode,
        index: index,
        freshAddress: freshAddress,
        freshAddressPath: freshAddressPath,
        freshAddresses: freshAddresses || [
            // in case user come from an old data that didn't support freshAddresses
            {
                derivationPath: freshAddressPath,
                address: freshAddress
            },
        ],
        name: name,
        blockHeight: blockHeight,
        creationDate: new Date(creationDate || Date.now()),
        balance: new bignumber_js_1.BigNumber(balance),
        spendableBalance: new bignumber_js_1.BigNumber(spendableBalance || balance),
        operations: (operations || []).map(convertOperation),
        operationsCount: operationsCount || (operations && operations.length) || 0,
        pendingOperations: (pendingOperations || []).map(convertOperation),
        unit: unit,
        currency: currency,
        lastSyncDate: new Date(lastSyncDate || 0),
        swapHistory: [],
        syncHash: syncHash,
        balanceHistoryCache: balanceHistoryCache || balanceHistoryCache_1.emptyHistoryCache,
        nfts: nfts === null || nfts === void 0 ? void 0 : nfts.map(function (n) { return fromNFTRaw(n); })
    };
    res.balanceHistoryCache = (0, balanceHistoryCache_1.generateHistoryFromOperations)(res);
    if (typeof used === "undefined") {
        // old account data that didn't had the field yet
        res.used = !(0, helpers_1.isAccountEmpty)(res);
    }
    else {
        res.used = used;
    }
    if (xpub) {
        res.xpub = xpub;
    }
    if (endpointConfig) {
        res.endpointConfig = endpointConfig;
    }
    if (subAccounts) {
        res.subAccounts = subAccounts;
    }
    if (swapHistory) {
        res.swapHistory = swapHistory.map(fromSwapOperationRaw);
    }
    return res;
}
exports.fromAccountRaw = fromAccountRaw;
// STP: to add a composition in ledger-live-common
function toAccountRaw(account) {
    var id = account.id, seedIdentifier = account.seedIdentifier, xpub = account.xpub, name = account.name, starred = account.starred, used = account.used, derivationMode = account.derivationMode, index = account.index, freshAddress = account.freshAddress, freshAddressPath = account.freshAddressPath, freshAddresses = account.freshAddresses, blockHeight = account.blockHeight, currency = account.currency, creationDate = account.creationDate, operationsCount = account.operationsCount, operations = account.operations, pendingOperations = account.pendingOperations, unit = account.unit, lastSyncDate = account.lastSyncDate, balance = account.balance, balanceHistoryCache = account.balanceHistoryCache, spendableBalance = account.spendableBalance, subAccounts = account.subAccounts, endpointConfig = account.endpointConfig, swapHistory = account.swapHistory, syncHash = account.syncHash, nfts = account.nfts;
    var res = {
        id: id,
        seedIdentifier: seedIdentifier,
        name: name,
        starred: starred,
        used: used,
        derivationMode: derivationMode,
        index: index,
        freshAddress: freshAddress,
        freshAddressPath: freshAddressPath,
        freshAddresses: freshAddresses,
        blockHeight: blockHeight,
        syncHash: syncHash,
        creationDate: creationDate.toISOString(),
        operationsCount: operationsCount,
        operations: (operations || []).map(function (o) { return (0, exports.toOperationRaw)(o); }),
        pendingOperations: (pendingOperations || []).map(function (o) { return (0, exports.toOperationRaw)(o); }),
        currencyId: currency.id,
        unitMagnitude: unit.magnitude,
        lastSyncDate: lastSyncDate.toISOString(),
        balance: balance.toFixed(),
        spendableBalance: spendableBalance.toFixed(),
        nfts: nfts === null || nfts === void 0 ? void 0 : nfts.map(function (n) { return toNFTRaw(n); })
    };
    if (balanceHistoryCache) {
        res.balanceHistoryCache = balanceHistoryCache;
    }
    if (endpointConfig) {
        res.endpointConfig = endpointConfig;
    }
    if (xpub) {
        res.xpub = xpub;
    }
    if (subAccounts) {
        res.subAccounts = subAccounts.map(toSubAccountRaw);
    }
    if (swapHistory) {
        res.swapHistory = swapHistory.map(toSwapOperationRaw);
    }
    return res;
}
exports.toAccountRaw = toAccountRaw;
function toNFTRaw(_a) {
    var id = _a.id, tokenId = _a.tokenId, amount = _a.amount, contract = _a.contract, standard = _a.standard, currencyId = _a.currencyId, metadata = _a.metadata;
    return {
        id: id,
        tokenId: tokenId,
        amount: amount.toFixed(),
        contract: contract,
        standard: standard,
        currencyId: currencyId,
        metadata: metadata
    };
}
exports.toNFTRaw = toNFTRaw;
function fromNFTRaw(_a) {
    var id = _a.id, tokenId = _a.tokenId, amount = _a.amount, contract = _a.contract, standard = _a.standard, currencyId = _a.currencyId, metadata = _a.metadata;
    return {
        id: id,
        tokenId: tokenId,
        amount: new bignumber_js_1.BigNumber(amount),
        contract: contract,
        standard: standard,
        currencyId: currencyId,
        metadata: metadata
    };
}
exports.fromNFTRaw = fromNFTRaw;
//# sourceMappingURL=serialization.js.map