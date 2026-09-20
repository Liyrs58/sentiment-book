import type { NewsArticle } from "./types";

function article(
  id: string,
  date: string,
  ticker: string,
  source: string,
  headline: string,
  dek: string,
  positive: number,
  negative: number
): NewsArticle {
  const neutral = Number((1 - positive - negative).toFixed(4));
  return {
    id,
    date,
    month: date.slice(0, 7),
    ticker,
    source,
    headline,
    dek,
    scores: { positive, negative, neutral },
    scoredBy: "finbert-paper",
  };
}

/**
 * Bundled wire copy for the 2024–2025 sample window.
 * Scores are precomputed FinBERT-style class probabilities (offline paper mode).
 */
export const NEWS: NewsArticle[] = [
  article(
    "2024-01-gspc-soft",
    "2024-01-12",
    "GSPC",
    "FT",
    "U.S. inflation cools; traders lean into a June cut",
    "Core CPI undershoots, lifting the S&P 500 as real yields ease. Breadth remains narrow.",
    0.72,
    0.09
  ),
  article(
    "2024-01-gc-bid",
    "2024-01-18",
    "GC",
    "Reuters",
    "Gold firms as real rates slip and ETF outflows stall",
    "Bullion holds the $2,000 handle. Official-sector buying remains the silent bid.",
    0.64,
    0.11
  ),
  article(
    "2024-01-hsi-property",
    "2024-01-26",
    "HSI",
    "SCMP",
    "Hong Kong developers wobble as home prices print a fresh low",
    "Hang Seng property names lead declines. Liquidity, not valuations, is the constraint.",
    0.12,
    0.71
  ),
  article(
    "2024-02-ixic-nvidia",
    "2024-02-22",
    "IXIC",
    "Bloomberg",
    "Nvidia results reset the AI capex clock; Nasdaq extends melt-up",
    "Data-centre guidance pulls the composite to records. Breadth still a footnote.",
    0.81,
    0.06
  ),
  article(
    "2024-02-ks11-hbm",
    "2024-02-16",
    "KS11",
    "Yonhap",
    "Korean chipmakers lift KOSPI on HBM allocation talk",
    "Samsung and SK Hynix catch a second-derivative bid from AI server demand.",
    0.69,
    0.12
  ),
  article(
    "2024-02-ssec-slow",
    "2024-02-08",
    "SSEC",
    "Caixin",
    "Shanghai Composite sags as private-sector PMI stays below 50",
    "Stimulus remains piecemeal. Foreign positioning is already light.",
    0.18,
    0.62
  ),
  article(
    "2024-03-gc-record",
    "2024-03-08",
    "GC",
    "WSJ",
    "Gold prints a record as traders price a June Federal Reserve cut",
    "The metal clears $2,180. Central-bank demand and a softer dollar do the rest.",
    0.78,
    0.07
  ),
  article(
    "2024-03-sx5e-ecb",
    "2024-03-07",
    "SX5E",
    "Les Echos",
    "ECB holds, but Lagarde opens the door to June",
    "Euro Stoxx banks rally on the path of least resistance for deposits.",
    0.61,
    0.16
  ),
  article(
    "2024-03-cl-opec",
    "2024-03-28",
    "CL",
    "Argus",
    "OPEC+ extends cuts; WTI firms toward $83",
    "Compliance is the usual question. Inventories nevertheless tighten into driving season.",
    0.58,
    0.19
  ),
  article(
    "2024-04-cl-iran",
    "2024-04-14",
    "CL",
    "Reuters",
    "Iran-Israel strikes lift the war premium; WTI spikes then fades",
    "The geopolitical bid proves perishable. Demand, not the Strait, reasserts itself.",
    0.41,
    0.37
  ),
  article(
    "2024-04-gspc-cpi",
    "2024-04-10",
    "GSPC",
    "FT",
    "Sticky U.S. CPI pushes rate-cut odds into 2025; S&P 500 stumbles",
    "Three hot prints in a row. Duration and growth stocks both pay the bill.",
    0.14,
    0.68
  ),
  article(
    "2024-04-dji-industrials",
    "2024-04-23",
    "DJI",
    "Barron's",
    "Dow industrials lag as higher-for-longer revisits the cost of capital",
    "Caterpillar and the transports quietly de-rate. The index looks tired, not broken.",
    0.22,
    0.51
  ),
  article(
    "2024-05-nsei-election",
    "2024-05-06",
    "NSEI",
    "Economic Times",
    "Nifty marks records into the general election; FIIs stay long India",
    "Domestic SIP flows dwarf foreign wobbles. Valuations are the only complaint.",
    0.74,
    0.09
  ),
  article(
    "2024-05-bsesn-banks",
    "2024-05-21",
    "BSESN",
    "Mint",
    "Sensex banks extend the bid after a narrower-than-feared election result",
    "Coalition arithmetic is messy; the policy mix is not. Private banks lead.",
    0.66,
    0.14
  ),
  article(
    "2024-05-ftse-gilt",
    "2024-05-15",
    "FTSE",
    "The Times",
    "FTSE 100 capped as gilt yields refuse to recede",
    "Energy and miners keep the index afloat. Domestic UK names do not.",
    0.33,
    0.39
  ),
  article(
    "2024-06-sx5e-cut",
    "2024-06-06",
    "SX5E",
    "Handelsblatt",
    "ECB delivers a first cut; Euro Stoxx banks take it in stride",
    "The path after June is data-dependent. Real rates in the euro area still bite.",
    0.57,
    0.18
  ),
  article(
    "2024-06-fchi-vote",
    "2024-06-10",
    "FCHI",
    "Le Monde",
    "Snap French election hammers the CAC 40; banks gap lower",
    "Sovereign-spread risk returns to a market that had forgotten it.",
    0.08,
    0.79
  ),
  article(
    "2024-06-si-industrial",
    "2024-06-20",
    "SI",
    "Kitco",
    "Silver lags gold as industrial demand in China stays patchy",
    "The gold/silver ratio stretches. Photovoltaic offtake is the missing bid.",
    0.27,
    0.48
  ),
  article(
    "2024-07-fchi-second",
    "2024-07-08",
    "FCHI",
    "Les Echos",
    "Hung parliament in Paris; CAC 40 claws back half the June slide",
    "The worst fiscal outcomes are taken off the table. Banks still trade cheap.",
    0.49,
    0.28
  ),
  article(
    "2024-07-ixic-earnings",
    "2024-07-24",
    "IXIC",
    "Bloomberg",
    "Megacap earnings clear a high bar; Nasdaq holds records",
    "Capex commentary stays aggressive. The index is an earnings story, not a multiple one.",
    0.7,
    0.11
  ),
  article(
    "2024-07-cl-demand",
    "2024-07-30",
    "CL",
    "IEA Oil Market Report",
    "IEA trims demand; WTI slips as U.S. gasoline looks soft",
    "China's apparent oil demand is the swing factor. Inventories rebuild.",
    0.19,
    0.58
  ),
  article(
    "2024-08-gspc-unwind",
    "2024-08-05",
    "GSPC",
    "FT",
    "Yen carry unwind slams global equities; S&P 500 posts its worst day of the year",
    "Vol of vol spikes. The VIX prints a 30-handle that does not linger.",
    0.06,
    0.84
  ),
  article(
    "2024-08-ks11-carry",
    "2024-08-05",
    "KS11",
    "Korea Times",
    "KOSPI tumbles as the carry trade meets thin August books",
    "Foreigners dump semiconductors into a holiday tape. The bounce starts the same week.",
    0.09,
    0.8
  ),
  article(
    "2024-08-gc-haven",
    "2024-08-07",
    "GC",
    "Reuters",
    "Gold bid as equity vol erupts, then fades with the rebound",
    "The haven bid is real for two sessions. Recalibration of rate-cut odds does more.",
    0.63,
    0.17
  ),
  article(
    "2024-09-hsi-stimulus",
    "2024-09-24",
    "HSI",
    "SCMP",
    "Beijing's stimulus barrage ignites the Hang Seng; property and brokers gap up",
    "Swap facility, RRR and a pledged stock-market bid. The tape finally has a narrative.",
    0.83,
    0.06
  ),
  article(
    "2024-09-ssec-package",
    "2024-09-26",
    "SSEC",
    "Xinhua",
    "Shanghai Composite surges as the PBOC and CSRC move in concert",
    "A coordinated package, not another drip. Turnover explodes from a depressed base.",
    0.8,
    0.08
  ),
  article(
    "2024-09-gspc-cut",
    "2024-09-18",
    "GSPC",
    "WSJ",
    "Fed cuts 50bp; S&P 500 treats it as insurance, not panic",
    "The larger increment is read as confidence in the landing, for a week.",
    0.67,
    0.14
  ),
  article(
    "2024-10-hsi-fade",
    "2024-10-09",
    "HSI",
    "FT",
    "Hang Seng gives back the stimulus spike as follow-through is thin",
    "The policy put is real; the earnings put is not. Northbound flows stall.",
    0.29,
    0.52
  ),
  article(
    "2024-10-cl-middle-east",
    "2024-10-02",
    "CL",
    "Reuters",
    "Crude pops on Middle East escalation, then rolls over as supply holds",
    "Spare capacity and SPR talk cap the premium. WTI fails to hold $75.",
    0.36,
    0.4
  ),
  article(
    "2024-10-dji-rotation",
    "2024-10-17",
    "DJI",
    "WSJ",
    "Dow catches a rotation bid as rate-sensitive industrials stabilize",
    "Soft-landing tape favours cash-flow names the Nasdaq had ignored.",
    0.55,
    0.2
  ),
  article(
    "2024-11-gspc-election",
    "2024-11-06",
    "GSPC",
    "FT",
    "Sweep in Washington: S&P 500 prices deregulation and a friendlier fiscal mix",
    "Financials and cyclicals lead. The dollar and the long bond are the other side.",
    0.76,
    0.1
  ),
  article(
    "2024-11-ixic-mixed",
    "2024-11-12",
    "IXIC",
    "Bloomberg",
    "Nasdaq lags the post-election tape as tariff talk hits megacap supply chains",
    "The same administration is both pro-equity and anti-import. Positioning is confused.",
    0.38,
    0.34
  ),
  article(
    "2024-11-ssec-tariff",
    "2024-11-08",
    "SSEC",
    "Caixin",
    "Shanghai slips as markets price a second Trump tariff round",
    "Exporters de-rate first. The domestic-demand story has not yet replaced them.",
    0.16,
    0.66
  ),
  article(
    "2024-12-gc-banks",
    "2024-12-11",
    "GC",
    "World Gold Council",
    "Official-sector gold buying stays elevated into year-end",
    "EM reserve managers keep accumulating. The ETF bid is a late arrival.",
    0.71,
    0.09
  ),
  article(
    "2024-12-ftse-budget",
    "2024-12-03",
    "FTSE",
    "The Telegraph",
    "FTSE 100 holds as sterling and gilts digest the autumn budget",
    "Miners and oils do the work. UK domestic earnings remain a second thought.",
    0.44,
    0.27
  ),
  article(
    "2024-12-nsei-fii",
    "2024-12-16",
    "NSEI",
    "Moneycontrol",
    "Nifty consolidates after a year of records; FII selling is absorbed",
    "Domestic institutions remain the buyer of first resort. Multiples are full.",
    0.48,
    0.24
  ),
  article(
    "2025-01-ixic-deepseek",
    "2025-01-27",
    "IXIC",
    "FT",
    "A cheaper Chinese model rattles AI capex assumptions; Nasdaq drops hard",
    "The question is not whether demand exists. It is whether the spend was too front-loaded.",
    0.11,
    0.77
  ),
  article(
    "2025-01-ks11-deepseek",
    "2025-01-27",
    "KS11",
    "Korea Herald",
    "KOSPI semiconductors sold as the market reprices HBM intensity",
    "A one-day tape. The medium-term capacity argument is slower to unwind.",
    0.14,
    0.7
  ),
  article(
    "2025-01-ssec-ai",
    "2025-01-28",
    "SSEC",
    "Yicai",
    "Onshore China tech bid as markets read a local model as a national champion",
    "The same news that hits Nasdaq is a relative-value gift in Shanghai.",
    0.68,
    0.15
  ),
  article(
    "2025-02-gc-ath",
    "2025-02-10",
    "GC",
    "Reuters",
    "Gold pushes through $2,900 as official buying refuses to fade",
    "Real yields are no longer the whole story. Diversification of reserves is.",
    0.79,
    0.07
  ),
  article(
    "2025-02-si-catchup",
    "2025-02-14",
    "SI",
    "Kitco",
    "Silver finally follows gold; industrial offtake improves at the margin",
    "The ratio compresses from extreme levels. Volumes confirm the move.",
    0.66,
    0.13
  ),
  article(
    "2025-02-gspc-earnings",
    "2025-02-21",
    "GSPC",
    "WSJ",
    "S&P 500 earnings season lands close to the high bar",
    "Margins hold. Guidance is cautious, not catastrophic. Multiples still need a friend.",
    0.52,
    0.22
  ),
  article(
    "2025-03-sx5e-defence",
    "2025-03-05",
    "SX5E",
    "FAZ",
    "Europe's defence-spend pivot lifts Euro Stoxx industrials and banks",
    "Fiscal exceptionalism for security. The Bund market is the constraint.",
    0.73,
    0.11
  ),
  article(
    "2025-03-fchi-defence",
    "2025-03-06",
    "FCHI",
    "Les Echos",
    "CAC 40 defence and luxury diverge; the index still nets a gain",
    "Re-armament is a sector story. Chinese tourist traffic is the other one.",
    0.58,
    0.2
  ),
  article(
    "2025-03-ftse-energy",
    "2025-03-19",
    "FTSE",
    "FT",
    "FTSE 100 helped by energy and a softer sterling",
    "The index remains a global cyclicals vehicle listed in London.",
    0.54,
    0.21
  ),
  article(
    "2025-04-gspc-tariff",
    "2025-04-03",
    "GSPC",
    "FT",
    "Broad tariff announcement knocks the S&P 500 into a risk-off air pocket",
    "Growth, margin and dollar assumptions all move at once. Liquidity is the first casualty.",
    0.07,
    0.82
  ),
  article(
    "2025-04-gc-panic",
    "2025-04-04",
    "GC",
    "Reuters",
    "Gold spiked, then offered, as the tariff shock forces a dash for cash",
    "The haven bid loses to margin calls for two sessions — then reasserts.",
    0.46,
    0.33
  ),
  article(
    "2025-04-hsi-tariff",
    "2025-04-07",
    "HSI",
    "SCMP",
    "Hang Seng exporters gapped down on the new tariff schedule",
    "The second China shock in six months. Domestic policy is asked to do more.",
    0.1,
    0.76
  ),
  article(
    "2025-04-cl-demand-scare",
    "2025-04-09",
    "CL",
    "Argus",
    "WTI slides as markets price a growth scare, not a supply one",
    "OPEC+ has little room to tighten into weaker demand. The curve flattens.",
    0.12,
    0.69
  ),
  article(
    "2025-05-gspc-pause",
    "2025-05-13",
    "GSPC",
    "WSJ",
    "A 90-day tariff pause rebuilds the S&P 500; the bounce is violent",
    "Positioning had been one-way. The index recoups a large share of April in days.",
    0.74,
    0.12
  ),
  article(
    "2025-05-ixic-bounce",
    "2025-05-14",
    "IXIC",
    "Bloomberg",
    "Nasdaq leads the relief rally as megacap supply-chain risk is deferred",
    "Deferred is not cancelled. Multiples re-expand anyway.",
    0.71,
    0.14
  ),
  article(
    "2025-05-nsei-relative",
    "2025-05-20",
    "NSEI",
    "Economic Times",
    "Nifty holds up as a relative-value shelter from the tariff tape",
    "India is not immune. It is less in the blast radius. Domestic flows do the rest.",
    0.61,
    0.17
  ),
  article(
    "2025-06-cl-strait",
    "2025-06-13",
    "CL",
    "Reuters",
    "Middle East escalation puts a $10 war premium back into WTI",
    "The bid is geopolitical, not fundamental. Inventories still argue for patience.",
    0.62,
    0.22
  ),
  article(
    "2025-06-gc-geo",
    "2025-06-13",
    "GC",
    "FT",
    "Gold catches a second bid as geopolitical risk joins the fiscal one",
    "Two hedges, one metal. Real-money allocations continue to grind higher.",
    0.75,
    0.09
  ),
  article(
    "2025-06-sx5e-energy",
    "2025-06-24",
    "SX5E",
    "Il Sole 24 Ore",
    "Euro Stoxx energy names lift the index as the oil premium sticks for a week",
    "Banks are quieter. The tape is a commodity story with a European listing.",
    0.5,
    0.24
  ),
  article(
    "2025-07-ixic-capex",
    "2025-07-23",
    "IXIC",
    "The Information",
    "Hyperscaler capex commentary stays large; Nasdaq grinds to a high",
    "The DeepSeek scare is treated as a one-quarter event. Spending plans say otherwise.",
    0.69,
    0.13
  ),
  article(
    "2025-07-ks11-hbm2",
    "2025-07-11",
    "KS11",
    "Maeil Business",
    "KOSPI lifted by another round of HBM allocation rumours",
    "Memory pricing is the cleaner tell. Foreigners return on the margin.",
    0.64,
    0.16
  ),
  article(
    "2025-07-dji-industrials2",
    "2025-07-18",
    "DJI",
    "Barron's",
    "Dow industrials participate as the ISM finally clears 50",
    "A manufacturing pulse, not a boom. Enough to keep the index from being a leftover.",
    0.56,
    0.19
  ),
  article(
    "2025-08-gspc-jackson",
    "2025-08-22",
    "GSPC",
    "FT",
    "Jackson Hole tilts dovish; S&P 500 prices a September cut",
    "Labour-market cooling is the permission structure. Inflation is the risk to it.",
    0.63,
    0.15
  ),
  article(
    "2025-08-ftse-oil",
    "2025-08-08",
    "FTSE",
    "The Guardian",
    "FTSE 100 slips with crude as the war premium unwinds",
    "The index's energy weight works both ways. Sterling does little to help.",
    0.24,
    0.49
  ),
  article(
    "2025-09-gspc-cut2",
    "2025-09-17",
    "GSPC",
    "WSJ",
    "Fed cuts again; S&P 500 makes a measured new high",
    "Not a panic cut. Financial conditions ease without a disorderly dollar move.",
    0.66,
    0.14
  ),
  article(
    "2025-09-bsesn-rbi",
    "2025-09-05",
    "BSESN",
    "Business Standard",
    "RBI holds with a dovish hitch; Sensex banks grind higher",
    "Inflation is behaving. The current account is the quieter constraint.",
    0.59,
    0.17
  ),
  article(
    "2025-09-hsi-property2",
    "2025-09-12",
    "HSI",
    "SCMP",
    "Hong Kong property measures disappoint; Hang Seng fades a summer bounce",
    "Policy is still playing defence. The September 2024 playbook is not repeated.",
    0.21,
    0.61
  ),
  article(
    "2025-10-gc-3000",
    "2025-10-08",
    "GC",
    "Reuters",
    "Gold clears $3,000 as real-money allocations catch up with official buying",
    "A round number, then another. The bid is structural until real yields reprice hard.",
    0.82,
    0.06
  ),
  article(
    "2025-10-si-3000",
    "2025-10-09",
    "SI",
    "Kitco",
    "Silver gaps with gold; tightness in registered inventories adds a squeeze flavour",
    "Industrial and monetary demand finally rhyme. Volatility is the cost of admission.",
    0.77,
    0.1
  ),
  article(
    "2025-10-ssec-policy",
    "2025-10-21",
    "SSEC",
    "Caixin",
    "Shanghai Composite muted as a new policy package looks familiar",
    "The bar is now the September 2024 episode. This one does not clear it.",
    0.31,
    0.41
  ),
  article(
    "2025-11-gspc-breadth",
    "2025-11-12",
    "GSPC",
    "WSJ",
    "S&P 500 breadth improves as equal-weight catches a bid",
    "A healthier tape, if a less spectacular one. Earnings, not multiple, do the work.",
    0.6,
    0.16
  ),
  article(
    "2025-11-sx5e-pmis",
    "2025-11-21",
    "SX5E",
    "Reuters",
    "Euro-area PMIs stabilize; Euro Stoxx banks lead a quiet grind",
    "Not a re-acceleration. Enough to keep the ECB on a shallow path.",
    0.53,
    0.2
  ),
  article(
    "2025-11-cl-glut",
    "2025-11-06",
    "CL",
    "IEA",
    "IEA flags a 2026 surplus; WTI slides toward the mid-50s",
    "Non-OPEC supply is the story. Demand is fine. The call on OPEC is not.",
    0.13,
    0.72
  ),
  article(
    "2025-12-gc-year",
    "2025-12-09",
    "GC",
    "World Gold Council",
    "Gold heads for a second outsized year as reserve managers stay in the market",
    "The allocation shift is slow and one-way. Pullbacks remain bought.",
    0.73,
    0.1
  ),
  article(
    "2025-12-nsei-fii2",
    "2025-12-11",
    "NSEI",
    "Economic Times",
    "Nifty ends the year near records as SIP flows offset a thin FII year",
    "Domestic savings are the structural bid. Valuations remain the tactical one.",
    0.62,
    0.15
  ),
  article(
    "2025-12-dji-yearend",
    "2025-12-18",
    "DJI",
    "Barron's",
    "Dow industrials finish a workmanlike year; no melt-up, no accident",
    "Cash-flow compounding. The unfashionable way to keep up with a 14-asset book.",
    0.51,
    0.2
  ),
];

export const NEWS_BY_ID = Object.fromEntries(NEWS.map((n) => [n.id, n]));
