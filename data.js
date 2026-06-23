const iowaLiquorData = {
  summary: {
    totalRows: 2490620,
    totalSales: 424834283.15,
    totalBottles: 30441277,
    uniqueStores: 2300,
    uniqueProducts: 4356,
    uniqueCounties: 103,
    uniqueVendors: 234
  },
  monthlySales: [
    { month: "Jan 2025", revenue: 31111677.66 },
    { month: "Feb 2025", revenue: 31308695.75 },
    { month: "Mar 2025", revenue: 33518798.61 },
    { month: "Apr 2025", revenue: 35499986.35 },
    { month: "May 2025", revenue: 35589683.49 },
    { month: "Jun 2025", revenue: 35946281.01 },
    { month: "Jul 2025", revenue: 36094242.39 },
    { month: "Aug 2025", revenue: 34213226.46 },
    { month: "Sep 2025", revenue: 35157772.73 },
    { month: "Oct 2025", revenue: 40047135.70 },
    { month: "Nov 2025", revenue: 34684681.00 },
    { month: "Dec 2025", revenue: 41662102.00 }
  ],
  topStores: [
    { name: "HY-VEE #3 / BDI / DES MOINES", sales: 13668737.03 },
    { name: "CENTRAL CITY 2", sales: 13201425.07 },
    { name: "ANOTHER ROUND / DEWITT", sales: 6238782.30 },
    { name: "HY-VEE WINE AND SPIRITS #1 (1281) / IOWA CITY", sales: 5659469.10 },
    { name: "BENZ DISTRIBUTING", sales: 5187730.10 },
    { name: "WALL TO WALL WINE AND SPIRITS / WEST DES MOINES", sales: 4607202.69 },
    { name: "I-80 LIQUOR / COUNCIL BLUFFS", sales: 4121645.79 },
    { name: "COSTCO WHOLESALE #788 / WDM", sales: 3473749.84 },
    { name: "HY-VEE #3 FOOD & DRUGSTORE / DAVENPORT", sales: 3345492.82 },
    { name: "WILKIE LIQUORS", sales: 3248733.93 }
  ],
  topProducts: [
    { name: "TITOS HANDMADE VODKA", sales: 29952776.16 },
    { name: "BLACK VELVET", sales: 10873864.51 },
    { name: "FIREBALL CINNAMON WHISKEY", sales: 9991580.00 },
    { name: "CROWN ROYAL", sales: 9117869.69 },
    { name: "CROWN ROYAL REGAL APPLE", sales: 8937188.49 },
    { name: "JACK DANIELS OLD #7 BLACK LABEL", sales: 8539108.35 },
    { name: "CAPTAIN MORGAN ORIGINAL SPICED", sales: 7861500.44 },
    { name: "JAMESON", sales: 6390992.45 },
    { name: "CAPTAIN MORGAN ORIGINAL SPICED BARREL", sales: 6301389.98 },
    { name: "FIREBALL CINNAMON WHISKEY MINI SLEEVE", sales: 5859419.71 }
  ],
  topCounties: [
    { name: "POLK", sales: 97441531.84 },
    { name: "LINN", sales: 36387788.68 },
    { name: "SCOTT", sales: 27101353.61 },
    { name: "JOHNSON", sales: 24091671.87 },
    { name: "BLACK HAWK", sales: 19982779.22 },
    { name: "WOODBURY", sales: 14561429.61 },
    { name: "DALLAS", sales: 14214031.47 },
    { name: "DUBUQUE", sales: 12303843.67 },
    { name: "STORY", sales: 11730415.63 },
    { name: "CLINTON", sales: 10718074.08 }
  ],
  topVendors: [
    { name: "DIAGEO AMERICAS", sales: 86283029.62 },
    { name: "SAZERAC COMPANY INC", sales: 75163581.34 },
    { name: "JIM BEAM BRANDS", sales: 28170355.89 },
    { name: "HEAVEN HILL BRANDS", sales: 26170130.51 },
    { name: "PERNOD RICARD USA", sales: 25086288.43 },
    { name: "BROWN FORMAN CORP.", sales: 19577628.17 },
    { name: "FIFTH GENERATION DISTILLED SPIRITS, INC.", sales: 18898398.81 },
    { name: "BACARDI USA INC", sales: 18565044.98 },
    { name: "PROXIMO", sales: 14732443.24 },
    { name: "LUXCO INC", sales: 14356501.15 }
  ],
  gptEvaluation: [
    {
      id: 1,
      question: "Which store generated the highest total sales revenue in 2025?",
      groundTruth: "HY-VEE #3 / BDI / DES MOINES ($13,668,737.03)",
      gptResponse: "The store that generated the highest total sales revenue in 2025 was 'HY-VEE #3 / BDI / DES MOINES' with $13,668,737.03.",
      latency: 2.53,
      tokens: 1165,
      correct: true
    },
    {
      id: 2,
      question: "Which product had the highest total sales revenue in 2025?",
      groundTruth: "TITOS HANDMADE VODKA ($29,952,776.16)",
      gptResponse: "The product with the highest total sales revenue in 2025 was 'TITOS HANDMADE VODKA,' with sales amounting to $29,952,776.16.",
      latency: 1.49,
      tokens: 1163,
      correct: true
    },
    {
      id: 3,
      question: "What was the monthly sales revenue trend throughout 2025? Did sales increase or decrease overall?",
      groundTruth: "Increased overall. Jan: $31,111,677.66 -> Dec: $41,662,102.00 (+33.9%)",
      gptResponse: "The monthly sales revenue trend throughout 2025 showed a general increase. Starting from $31,111,677.66 in January, sales gradually increased, peaking in December at $41,662,102.00. There were fluctuations, with notable increases in April ($35,499,986.35), October ($40,047,135.70), and December, indicating a general upward trend over the year.",
      latency: 2.68,
      tokens: 1217,
      correct: true
    },
    {
      id: 4,
      question: "Which county had the lowest sales revenue among the top 10 counties?",
      groundTruth: "CLINTON ($10,718,074.08)",
      gptResponse: "Clinton County had the lowest sales revenue among the top 10 counties, with $10,718,074.08.",
      latency: 0.74,
      tokens: 1152,
      correct: true
    },
    {
      id: 5,
      question: "Based on the monthly sales data, identify any anomalies or unusual spikes in revenue during 2025.",
      groundTruth: "December 2025: $41,662,102.00 (deviation from mean: $6,259,245.07)",
      gptResponse: "In 2025, there are two notable spikes in monthly sales revenue. October and December show significantly higher sales compared to other months. October's sales revenue is $40,047,135.70, and December's is even higher at $41,662,102.00. These figures are considerably above the average monthly sales, which generally range between $31 million and $36 million.",
      latency: 1.87,
      tokens: 1212,
      correct: false // It got 4/5 correct because it identified 2 anomalies instead of the mathematical anomaly (furthest from mean)
    }
  ],
  baselineForecast: {
    slope: 651904.0,
    intercept: 31165478.0,
    r2Score: 0.5942
  }
};
