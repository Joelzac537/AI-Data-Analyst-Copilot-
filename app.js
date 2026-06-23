// State Management
let currentTheme = localStorage.getItem("theme") || "dark";
let activeTab = "edaTab";
let monthlySalesChartInstance = null;
let forecastChartInstance = null;

// Sliders and Forecast parameters
let forecastSlope = iowaLiquorData.baselineForecast.slope;
let forecastIntercept = iowaLiquorData.baselineForecast.intercept;

// Current Top Entity selected (stores, products, counties, vendors)
let currentTopEntity = "stores";

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTabs();
  renderKpis();
  renderTopEntitiesTable();
  initMonthlySalesChart();
  initForecastChart();
  initForecastSliders();
  initEvaluationsList();
  initCSVUploader();
  initChatBot();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  const themeBtn = document.getElementById("themeToggleBtn");
  
  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
    
    // Re-draw charts to apply correct text colors for dark/light grids
    updateChartTheme();
  });
}

function updateChartTheme() {
  const textColor = currentTheme === "dark" ? "hsl(210, 20%, 95%)" : "hsl(222, 25%, 15%)";
  const gridColor = currentTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  
  if (monthlySalesChartInstance) {
    monthlySalesChartInstance.options.scales.x.grid.color = gridColor;
    monthlySalesChartInstance.options.scales.y.grid.color = gridColor;
    monthlySalesChartInstance.options.scales.x.ticks.color = textColor;
    monthlySalesChartInstance.options.scales.y.ticks.color = textColor;
    monthlySalesChartInstance.update();
  }
  
  if (forecastChartInstance) {
    forecastChartInstance.options.scales.x.grid.color = gridColor;
    forecastChartInstance.options.scales.y.grid.color = gridColor;
    forecastChartInstance.options.scales.x.ticks.color = textColor;
    forecastChartInstance.options.scales.y.ticks.color = textColor;
    forecastChartInstance.update();
  }
}

// Tabbed Navigation
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
      activeTab = targetTab;
      
      // Force chart layout recalculation on tab visibility change
      if (targetTab === "edaTab" && monthlySalesChartInstance) {
        monthlySalesChartInstance.resize();
      } else if (targetTab === "forecastTab" && forecastChartInstance) {
        forecastChartInstance.resize();
      }
    });
  });
}

// KPI Formatting Helper
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

// Render Top Cards
function renderKpis() {
  const data = iowaLiquorData.summary;
  document.getElementById("kpiSales").innerText = formatCurrency(data.totalSales);
  document.getElementById("kpiBottles").innerText = formatNumber(data.totalBottles);
  document.getElementById("kpiStores").innerText = formatNumber(data.uniqueStores);
  document.getElementById("kpiProducts").innerText = formatNumber(data.uniqueProducts);
}

// Top Entities Switcher
function switchTopEntity(type) {
  currentTopEntity = type;
  
  // Update Pills
  document.getElementById("btnStores").classList.remove("active");
  document.getElementById("btnProducts").classList.remove("active");
  document.getElementById("btnCounties").classList.remove("active");
  document.getElementById("btnVendors").classList.remove("active");
  
  const capType = type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById("btn" + capType).classList.add("active");
  
  // Update Table Titles
  document.getElementById("topEntityTitle").innerText = "Top 10 " + capType;
  document.getElementById("tableEntityHeader").innerText = capType.slice(0, -1) + " Name";
  
  renderTopEntitiesTable();
}

function renderTopEntitiesTable() {
  const body = document.getElementById("topEntitiesBody");
  body.innerHTML = "";
  
  let list = [];
  if (currentTopEntity === "stores") list = iowaLiquorData.topStores;
  else if (currentTopEntity === "products") list = iowaLiquorData.topProducts;
  else if (currentTopEntity === "counties") list = iowaLiquorData.topCounties;
  else if (currentTopEntity === "vendors") list = iowaLiquorData.topVendors;
  
  list.forEach((item, index) => {
    const row = document.createElement("tr");
    
    row.innerHTML = `
      <td><span class="rank-badge">${index + 1}</span></td>
      <td>${item.name}</td>
      <td style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(item.sales)}</td>
    `;
    body.appendChild(row);
  });
}

// Chart 1: Monthly Sales Revenue (2025)
function initMonthlySalesChart() {
  const ctx = document.getElementById("monthlySalesChart").getContext("2d");
  const months = iowaLiquorData.monthlySales.map(d => d.month.split(" ")[0]);
  const revenues = iowaLiquorData.monthlySales.map(d => d.revenue);
  
  const textColor = currentTheme === "dark" ? "hsl(210, 20%, 95%)" : "hsl(222, 25%, 15%)";
  const gridColor = currentTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  
  monthlySalesChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Sales Revenue ($)",
        data: revenues,
        borderColor: "hsl(207, 73%, 55%)",
        backgroundColor: "rgba(30, 144, 255, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "hsl(207, 73%, 55%)",
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "hsl(28, 95%, 50%)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: currentTheme === "dark" ? "hsl(222, 25%, 15%)" : "white",
          titleColor: currentTheme === "dark" ? "white" : "black",
          bodyColor: currentTheme === "dark" ? "white" : "black",
          borderColor: "hsl(207, 73%, 45%)",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return "Revenue: " + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: "Outfit" } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { 
            color: textColor,
            font: { family: "Outfit" },
            callback: function(value) {
              return "$" + (value / 1000000).toFixed(1) + "M";
            }
          }
        }
      }
    }
  });
}

// Chart 2: 2025 Actuals + 2026 Forecast
function initForecastChart() {
  const ctx = document.getElementById("forecastChart").getContext("2d");
  
  // Calculate forecast lists
  const result = getForecastDatasets();
  
  const textColor = currentTheme === "dark" ? "hsl(210, 20%, 95%)" : "hsl(222, 25%, 15%)";
  const gridColor = currentTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  
  forecastChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: result.labels,
      datasets: [
        {
          label: "2025 Actuals",
          data: result.actuals,
          borderColor: "hsl(207, 73%, 55%)",
          backgroundColor: "transparent",
          borderWidth: 3,
          tension: 0.1,
          pointBackgroundColor: "hsl(207, 73%, 55%)",
          spanGaps: true
        },
        {
          label: "2026 Forecast",
          data: result.forecasts,
          borderColor: "hsl(28, 95%, 50%)",
          borderDash: [6, 4],
          backgroundColor: "transparent",
          borderWidth: 3,
          tension: 0,
          pointStyle: "rectRot",
          pointRadius: 6,
          pointBackgroundColor: "hsl(28, 95%, 50%)",
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: "Outfit", weight: "bold" } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ": " + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: "Outfit" } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: "Outfit" },
            callback: function(value) {
              return "$" + (value / 1000000).toFixed(1) + "M";
            }
          }
        }
      }
    }
  });
}

function getForecastDatasets() {
  const months = [
    "Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", 
    "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
    "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"
  ];
  
  // 12 months actuals
  const actuals = iowaLiquorData.monthlySales.map(d => d.revenue);
  // Pad with nulls for the 6 forecast months
  while (actuals.length < 18) {
    actuals.push(null);
  }
  
  // Forecast array starts with nulls for 2025 actuals, 
  // but we can connect the line by putting the last actual value (Dec 25) as the first entry for forecast.
  const forecasts = Array(11).fill(null);
  forecasts.push(actuals[11]); // Dec 2025 connector
  
  // Calculate Jan (M13) through Jun (M18) 2026 forecasts
  for (let m = 13; m <= 18; m++) {
    const revenue = forecastIntercept + m * forecastSlope;
    forecasts.push(revenue);
  }
  
  return {
    labels: months,
    actuals: actuals,
    forecasts: forecasts
  };
}

// Sliders and parameter updates
function initForecastSliders() {
  const sliderSlope = document.getElementById("sliderSlope");
  const sliderIntercept = document.getElementById("sliderIntercept");
  
  const valSlope = document.getElementById("valSlope");
  const valIntercept = document.getElementById("valIntercept");
  
  const btnReset = document.getElementById("btnResetForecast");
  
  function updateForecast() {
    forecastSlope = parseFloat(sliderSlope.value);
    forecastIntercept = parseFloat(sliderIntercept.value);
    
    valSlope.innerText = formatCurrency(forecastSlope);
    valIntercept.innerText = formatCurrency(forecastIntercept);
    
    // Calculate June 2026 (Month 18) Prediction card
    const junePred = forecastIntercept + 18 * forecastSlope;
    document.getElementById("kpiJunePrediction").innerText = "$" + (junePred / 1000000).toFixed(1) + "M";
    
    // Update Chart data
    if (forecastChartInstance) {
      const datasets = getForecastDatasets();
      forecastChartInstance.data.datasets[1].data = datasets.forecasts;
      forecastChartInstance.update();
    }
  }
  
  sliderSlope.addEventListener("input", updateForecast);
  sliderIntercept.addEventListener("input", updateForecast);
  
  btnReset.addEventListener("click", () => {
    sliderSlope.value = iowaLiquorData.baselineForecast.slope;
    sliderIntercept.value = iowaLiquorData.baselineForecast.intercept;
    updateForecast();
  });
  
  // Initial card value
  updateForecast();
}

// Render GPT evaluation cards
function initEvaluationsList() {
  const container = document.getElementById("evalGridContainer");
  container.innerHTML = "";
  
  iowaLiquorData.gptEvaluation.forEach(item => {
    const div = document.createElement("div");
    div.className = "eval-item";
    
    const badgeClass = item.correct ? "correct" : "incorrect";
    const badgeText = item.correct ? "Correct (Validated)" : "Semantically Mismatched";
    
    const badgeSvg = item.correct 
      ? `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
      : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      
    div.innerHTML = `
      <div class="eval-header">
        <div class="eval-title">Q${item.id}: ${item.question}</div>
        <span class="eval-badge ${badgeClass}">
          ${badgeSvg}
          ${badgeText}
        </span>
      </div>
      
      <div class="eval-details-grid">
        <div class="eval-column truth">
          <div class="eval-label">Ground Truth (Pandas)</div>
          <div class="eval-text">${item.groundTruth}</div>
        </div>
        <div class="eval-column gpt">
          <div class="eval-label">GPT-4o Response</div>
          <div class="eval-text">${item.gptResponse}</div>
        </div>
      </div>
      
      <div class="eval-meta">
        <span>Latency: <strong>${item.latency.toFixed(2)}s</strong></span>
        <span>Tokens: <strong>${item.tokens}</strong></span>
      </div>
    `;
    
    container.appendChild(div);
  });
}

// CSV drag and drop uploader
function initCSVUploader() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("csvFileInput");
  const filenameDisplay = document.getElementById("uploadFilename");
  const loader = document.getElementById("loader");
  const resultsDiv = document.getElementById("uploadAnalysisResults");
  
  // Click triggers file selector
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });
  
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCSVFile(files[0]);
    }
  });
  
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleCSVFile(fileInput.files[0]);
    }
  });
  
  function handleCSVFile(file) {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert("Invalid format. Please upload a CSV file.");
      return;
    }
    
    filenameDisplay.innerText = file.name;
    resultsDiv.style.display = "none";
    loader.style.display = "block";
    
    // Parse in browser
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: function(results) {
        loader.style.display = "none";
        processUploadedCSV(results.data);
      },
      error: function(err) {
        loader.style.display = "none";
        alert("Failed to parse CSV: " + err.message);
      }
    });
  }
  
  function processUploadedCSV(data) {
    if (!data || data.length === 0) {
      alert("CSV file is empty.");
      return;
    }
    
    // Check columns
    const firstRow = data[0];
    const hasSales = 'sales_dollars' in firstRow;
    const hasStore = 'store_name' in firstRow;
    
    if (!hasSales || !hasStore) {
      alert("CSV columns missing. Ensure columns contain 'store_name' and 'sales_dollars'.");
      return;
    }
    
    let totalSales = 0;
    const storeMap = {};
    
    data.forEach(row => {
      const sales = parseFloat(row.sales_dollars) || 0;
      const store = row.store_name || "Unknown Store";
      
      totalSales += sales;
      storeMap[store] = (storeMap[store] || 0) + sales;
    });
    
    // Top Stores
    const sortedStores = Object.entries(storeMap)
      .map(([name, val]) => ({ name, sales: val }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);
      
    // Render Results
    document.getElementById("dynRows").innerText = formatNumber(data.length);
    document.getElementById("dynSales").innerText = formatCurrency(totalSales);
    
    const listEl = document.getElementById("dynTopList");
    listEl.innerHTML = "";
    
    if (sortedStores.length === 0) {
      listEl.innerHTML = "<li>No stores found</li>";
    } else {
      sortedStores.forEach((store) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${store.name}</strong>: ${formatCurrency(store.sales)}`;
        listEl.appendChild(li);
      });
    }
    
    resultsDiv.style.display = "block";
  }
}

// Simulated RAG Chat QA Bot
function initChatBot() {
  const inputText = document.getElementById("chatInputText");
  const sendBtn = document.getElementById("chatSendBtn");
  
  sendBtn.addEventListener("click", handleChatSend);
  inputText.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleChatSend();
    }
  });
}

function sendSuggestedChat(text) {
  document.getElementById("chatInputText").value = text;
  handleChatSend();
}

function handleChatSend() {
  const inputEl = document.getElementById("chatInputText");
  const query = inputEl.value.trim();
  if (!query) return;
  
  appendMessage("user", query);
  inputEl.value = "";
  
  // Show bot typing delay
  setTimeout(() => {
    const responseObj = generateBotResponse(query);
    appendMessage("bot", responseObj.text, responseObj.citation);
  }, 750);
}

function appendMessage(sender, text, citation = null) {
  const container = document.getElementById("chatContainer");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble " + sender;
  
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let content = text;
  if (citation) {
    content += `<span class="rag-citation"><strong>Retrieved RAG Node:</strong> ${citation}</span>`;
  }
  
  bubble.innerHTML = `
    ${content}
    <span class="msg-time">${timeStr}</span>
  `;
  
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function generateBotResponse(query) {
  const qLower = query.toLowerCase();
  
  if (qLower.includes("store") || qLower.includes("highest sales") || qLower.includes("highest revenue")) {
    return {
      text: "Based on the 2025 Iowa Liquor Sales aggregated dataset, the highest revenue-generating store was <strong>HY-VEE #3 / BDI / DES MOINES</strong>, which earned a total sales revenue of <strong>$13,668,737.03</strong>. The second highest was CENTRAL CITY 2 with $13,201,425.07.",
      citation: "iowaLiquorData.topStores[0] | Store revenue aggregation model"
    };
  }
  
  if (qLower.includes("product") || qLower.includes("vodka") || qLower.includes("tito")) {
    return {
      text: "The product that registered the highest sales revenue in 2025 was <strong>TITOS HANDMADE VODKA</strong>, racking up a massive <strong>$29,952,776.16</strong> in total sales. Second in revenue was BLACK VELVET at $10,873,864.51.",
      citation: "iowaLiquorData.topProducts[0] | Product revenue aggregation model"
    };
  }
  
  if (qLower.includes("county") || qLower.includes("counties") || qLower.includes("polk")) {
    return {
      text: "Among the 103 counties in Iowa, <strong>POLK County</strong> generated the highest liquor sales revenue in 2025 with <strong>$97,441,531.84</strong> (nearly 23% of total statewide sales). Under the top 10 counties list, the lowest sales revenue belongs to <strong>CLINTON County</strong> with <strong>$10,718,074.08</strong>.",
      citation: "iowaLiquorData.topCounties | Geographic sales distribution models"
    };
  }
  
  if (qLower.includes("trend") || qLower.includes("monthly") || qLower.includes("increase") || qLower.includes("decrease")) {
    return {
      text: "Liquor sales revenue in Iowa generally increased over the course of 2025. January sales started at <strong>$31,111,677.66</strong> and peaked in December at <strong>$41,662,102.00</strong>, reflecting a net increase of <strong>+33.9%</strong>. There was also a significant seasonal spike in October ($40.0M) due to fall festivities and stockups.",
      citation: "iowaLiquorData.monthlySales | Time-series aggregation"
    };
  }
  
  if (qLower.includes("forecast") || qLower.includes("2026") || qLower.includes("june") || qLower.includes("predict")) {
    return {
      text: "The Linear Regression model trained on 2025 monthly data predicts <strong>June 2026</strong> sales revenue to reach <strong>$42,899,748</strong>, assuming a monthly growth slope of <strong>$651,904</strong> and an intercept baseline of <strong>$31,165,478</strong>. The baseline model has an R² score of <strong>0.5942</strong>.",
      citation: "iowaLiquorData.baselineForecast | Scikit-Learn linear regression model output"
    };
  }
  
  if (qLower.includes("rag") || qLower.includes("pipeline") || qLower.includes("concept") || qLower.includes("limit")) {
    return {
      text: "This QA assistant acts as a RAG (Retrieval-Augmented Generation) system. Direct LLM prompts cannot fit 2.5 million rows due to token limits (~128k context). Therefore, this pipeline queries a pre-aggregated structured DB, fetches matching document snippets (citations), and feeds them to the LLM context to formulate a response.",
      citation: "Feasibility Report Section 7 | RAG Pipeline Architecture Guidelines"
    };
  }
  
  // Default response
  return {
    text: "I can help you query the Iowa Liquor Sales dataset. You can ask about: <ul><li><strong>Stores:</strong> 'Which store has the highest sales?'</li><li><strong>Products:</strong> 'What is the top product?'</li><li><strong>Counties:</strong> 'Which top county has the lowest sales?'</li><li><strong>Trend:</strong> 'What was the monthly trend?'</li><li><strong>Forecast:</strong> 'Show me the June 2026 prediction.'</li></ul>",
    citation: "System Default | Guide Index Lookup"
  };
}
