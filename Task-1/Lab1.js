"use strict";

const SHOW = "SHOW_PRICE";
const UPDATE = "UPDATE_USD_PRICE";

const fs = require("fs");
const EventEmitter = require("events");

function readJsonFromFile(fileName) {
  try {
    const data = fs.readFileSync(fileName, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error);
    return { rates: [] };
  }
}

class CurrencyConverter extends EventEmitter {
  static calculateRates(usdPrices) {
    const rates = {};
    const usdMap = {};

    for (const { asset_id_quote: sym, rate } of usdPrices) {
      if (rate > 0) {
        rates[`USD-${sym}`] = rate;
        rates[`${sym}-USD`] = 1 / rate;
        usdMap[sym] = rate;
      }
    }

    const symbols = Object.keys(usdMap);
    for (const from of symbols) {
      for (const to of symbols) {
        if (from !== to) {
          rates[`${from}-${to}`] = usdMap[to] / usdMap[from];
        }
      }
    }

    return { rates, usdMap };
  }

  constructor(coin2USD) {
    super();
    const { rates, usdMap } = this.constructor.calculateRates(coin2USD.rates);
    this.rates = rates;
    this.usdMap = usdMap;

    this.on(SHOW, this.handleShow.bind(this));
    this.on(UPDATE, this.handleUpdate.bind(this));
  }

  handleShow({ from, to }) {
    console.log(`\n[SHOW] Requested conversion: ${from} → ${to}`);
    try {
      const rate = this.convert(1, from, to);
      console.log(`1 ${from} is worth ${rate.toFixed(8)} ${to}`);
    } catch (e) {
      console.error(`[SHOW] Error: ${e.message}`);
    }
  }

  handleUpdate({ sym, usdPrice }) {
    if (!sym || typeof usdPrice !== "number" || usdPrice <= 0) {
      console.error("[UPDATE] Invalid update parameters.");
      return;
    }

    console.log(`\n[UPDATE] Updating ${sym} price to ${usdPrice} USD.`);
    this.usdMap[sym] = usdPrice;

    const entries = Object.entries(this.usdMap).map(([symbol, rate]) => ({
      asset_id_quote: symbol,
      rate
    }));

    const { rates } = this.constructor.calculateRates(entries);
    this.rates = rates;
    console.log("[UPDATE] Rates updated successfully.");
  }

  convert(amount, from, to) {
    const direct = this.rates[`${from}-${to}`];
    if (direct !== undefined) return amount * direct;

    const viaUSD = this.rates[`${from}-USD`] && this.rates[`USD-${to}`];
    if (viaUSD) return amount * this.rates[`${from}-USD`] * this.rates[`USD-${to}`];

    throw new Error(`Rate for ${from}-${to} not found and no fallback via USD.`);
  }
}

// ====================== MAIN ==========================

const converter = new CurrencyConverter(readJsonFromFile("./rates.json"));

function testConversion(amount, from, to) {
  try {
    const result = converter.convert(amount, from, to);
    console.log(`${amount} ${from} is worth ${result.toFixed(8)} ${to}`);
  } catch (e) {
    console.error(`[TEST] Conversion failed: ${e.message}`);
  }
}

console.log("\n===== Initial Conversions =====");
testConversion(4000, "ETH", "BTC");
testConversion(200, "BTC", "EOS");

console.log("\n===== SHOW Events =====");
converter.emit(SHOW, { from: "EOS", to: "BTC" });
converter.emit(SHOW, { from: "EOS", to: "ETH" });
converter.emit(SHOW, { from: "ETC", to: "ETH" });
converter.emit(SHOW, { from: "LTC", to: "BTC" });

console.log("\n===== UPDATE Event =====");
converter.emit(UPDATE, { sym: "BTC", usdPrice: 50000 });

console.log("\n===== After UPDATE: SHOW Event =====");
converter.emit(SHOW, { from: "LTC", to: "BTC" });
