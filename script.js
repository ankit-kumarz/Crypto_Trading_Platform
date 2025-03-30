// DOM Elements
const orderBookBody = document.getElementById('orderBookBody');
const tradingChart = document.getElementById('tradingChart');
const candleInfo = document.getElementById('candleInfo');
const candleDate = document.getElementById('candleDate');
const candleOpen = document.getElementById('candleOpen');
const candleHigh = document.getElementById('candleHigh');
const candleLow = document.getElementById('candleLow');
const candleClose = document.getElementById('candleClose');
const candleVolume = document.getElementById('candleVolume');
const assetsList = document.getElementById('assetsList');
const buyAmount = document.getElementById('buyAmount');
const buyTotal = document.getElementById('buyTotal');
const sellAmount = document.getElementById('sellAmount');
const sellTotal = document.getElementById('sellTotal');
const intervalBtns = document.querySelectorAll('.interval-btn');
const percentageBtns = document.querySelectorAll('.percentage-btn');

// Global variables
let chartData = [];
let currentInterval = 15;
let hoveredCandle = null;
let selectedCandle = null;
let isMouseOnChart = false;
let mousePosition = { x: 0, y: 0 };
let balance = 500;

// Assets data
const assets = [
  { name: "Bitcoin", symbol: "BTC", amount: 0.5, value: 22500 },
  { name: "Ethereum", symbol: "ETH", amount: 2.5, value: 4000 },
  { name: "Cardano", symbol: "ADA", amount: 1000, value: 320 },
  { name: "Solana", symbol: "SOL", amount: 20, value: 400 },
  { name: "Polkadot", symbol: "DOT", amount: 100, value: 600 },
];

// Format date
function formatDate(timestamp, interval) {
  const date = new Date(timestamp * 1000);
  if (interval >= 1440) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (interval >= 60) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

// Format full date
function formatFullDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate order book data
function generateOrderBook(basePrice, depth) {
  const asks = [];
  const bids = [];

  for (let i = 0; i < depth; i++) {
    const askPrice = basePrice + i * 5 + Math.random() * 2;
    const askAmount = +(Math.random() * 2).toFixed(4);
    asks.push({
      price: askPrice,
      amount: askAmount,
      total: +(askPrice * askAmount).toFixed(2),
      type: "sell",
    });

    const bidPrice = basePrice - i * 5 - Math.random() * 2;
    const bidAmount = +(Math.random() * 2).toFixed(4);
    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: +(bidPrice * bidAmount).toFixed(2),
      type: "buy",
    });
  }

  return [...asks.reverse(), ...bids];
}

// Generate chart data
function generateChartData(count, interval) {
  const data = [];
  let price = 45000;
  let date = new Date();

  for (let i = 0; i < count; i++) {
    const open = price + Math.random() * 200 - 100;
    const close = open + Math.random() * 200 - 100;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    const volume = Math.floor(Math.random() * 1000) + 500;

    data.push({
      time: date.getTime() / 1000,
      open,
      high,
      low,
      close,
      volume,
    });

    date = new Date(date.getTime() - interval * 60000);
    price = close;
  }

  return data.reverse();
}

// Render order book
function renderOrderBook() {
  const orders = generateOrderBook(45000, 10);
  orderBookBody.innerHTML = '';

  orders.forEach(order => {
    const row = document.createElement('tr');
    
    const priceCell = document.createElement('td');
    priceCell.className = order.type === 'sell' ? 'price-sell' : 'price-buy';
    priceCell.textContent = order.price.toFixed(2);
    
    const amountCell = document.createElement('td');
    amountCell.className = 'text-right';
    amountCell.textContent = order.amount.toFixed(4);
    
    const totalCell = document.createElement('td');
    totalCell.className = 'text-right';
    totalCell.textContent = order.total.toFixed(2);
    
    row.appendChild(priceCell);
    row.appendChild(amountCell);
    row.appendChild(totalCell);
    
    orderBookBody.appendChild(row);
  });
}

// Render assets
function renderAssets() {
  assetsList.innerHTML = '';
  
  assets.forEach(asset => {
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';
    
    const assetContent = document.createElement('div');
    assetContent.className = 'asset-content';
    
    const assetInfo = document.createElement('div');
    const assetName = document.createElement('p');
    assetName.className = 'asset-name';
    assetName.textContent = asset.name;
    
    const assetSymbol = document.createElement('p');
    assetSymbol.className = 'asset-symbol';
    assetSymbol.textContent = asset.symbol;
    
    assetInfo.appendChild(assetName);
    assetInfo.appendChild(assetSymbol);
    
    const assetValues = document.createElement('div');
    const assetValue = document.createElement('p');
    assetValue.className = 'asset-value';
    assetValue.textContent = `$${asset.value.toFixed(2)}`;
    
    const assetAmount = document.createElement('p');
    assetAmount.className = 'asset-amount';
    assetAmount.textContent = `${asset.amount} ${asset.symbol}`;
    
    assetValues.appendChild(assetValue);
    assetValues.appendChild(assetAmount);
    
    assetContent.appendChild(assetInfo);
    assetContent.appendChild(assetValues);
    
    assetItem.appendChild(assetContent);
    assetsList.appendChild(assetItem);
  });
}

// Draw chart
function drawChart() {
  const canvas = tradingChart;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = { top: 20, right: 50, bottom: 30, left: 50 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;
  
  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  const priceRange = maxPrice - minPrice;
  
  // Grid lines
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const y = padding.top + (i * chartHeight) / 5;
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
  }
  ctx.stroke();
  
  // Candlesticks
  const candleWidth = chartWidth / chartData.length;
  chartData.forEach((candle, i) => {
    const x = padding.left + i * candleWidth;
    const openY = chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight + padding.top;
    const closeY = chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight + padding.top;
    const highY = chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight + padding.top;
    const lowY = chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight + padding.top;
    
    // Body
    ctx.fillStyle = candle.open > candle.close ? '#ef4444' : '#22c55e';
    ctx.fillRect(x, Math.min(openY, closeY), candleWidth - 1, Math.abs(closeY - openY));
    
    // Wick
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, highY);
    ctx.lineTo(x + candleWidth / 2, lowY);
    ctx.stroke();
    
    // Volume
    const volumeHeight = (candle.volume / 1000) * 20;
    ctx.fillStyle = candle.open > candle.close ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)';
    ctx.fillRect(x, canvas.height - padding.bottom - volumeHeight, candleWidth - 1, volumeHeight);
  });
  
  // Price axis
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (i * chartHeight) / 5;
    const price = maxPrice - (i * priceRange) / 5;
    ctx.fillText(price.toFixed(2), canvas.width - padding.right + 5, y);
  }
  
  // Time axis
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < chartData.length; i += Math.max(1, Math.floor(chartData.length / 5))) {
    const x = padding.left + i * candleWidth;
    ctx.fillText(formatDate(chartData[i].time, currentInterval), x, canvas.height - padding.bottom + 5);
  }
  
  // Selected candle
  if (selectedCandle) {
    const index = chartData.findIndex(d => d.time === selectedCandle.time);
    const x = padding.left + index * candleWidth + candleWidth / 2;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, canvas.height - padding.bottom);
    const y = chartHeight - ((selectedCandle.close - minPrice) / priceRange) * chartHeight + padding.top;
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Crosshair
  if (hoveredCandle && isMouseOnChart) {
    const index = chartData.findIndex(d => d.time === hoveredCandle.time);
    const x = padding.left + index * candleWidth + candleWidth / 2;
    const y = mousePosition.y;
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, canvas.height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Update candle info
function updateCandleInfo(candle) {
  if (!candle) {
    candleInfo.classList.add('hidden');
    return;
  }
  
  candleInfo.classList.remove('hidden');
  candleDate.textContent = formatFullDate(candle.time);
  candleOpen.textContent = candle.open.toFixed(2);
  candleHigh.textContent = candle.high.toFixed(2);
  candleLow.textContent = candle.low.toFixed(2);
  candleClose.textContent = candle.close.toFixed(2);
  candleVolume.textContent = candle.volume.toFixed(2);
}

// Handle chart mouse events
function setupChartEvents() {
  tradingChart.addEventListener('mousemove', (event) => {
    const rect = tradingChart.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const candleWidth = (tradingChart.width - 100) / chartData.length;
    const index = Math.floor((x - 50) / candleWidth);
    
    mousePosition = { x, y };
    isMouseOnChart = true;
    
    if (index >= 0 && index < chartData.length) {
      hoveredCandle = chartData[index];
      updateCandleInfo(hoveredCandle);
    } else {
      hoveredCandle = null;
      updateCandleInfo(selectedCandle);
    }
    
    drawChart();
  });
  
  tradingChart.addEventListener('mouseleave', () => {
    isMouseOnChart = false;
    hoveredCandle = null;
    updateCandleInfo(selectedCandle);
    drawChart();
  });
  
  tradingChart.addEventListener('click', (event) => {
    const rect = tradingChart.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const candleWidth = (tradingChart.width - 100) / chartData.length;
    const index = Math.floor((x - 50) / candleWidth);
    
    if (index >= 0 && index < chartData.length) {
      selectedCandle = chartData[index];
      updateCandleInfo(selectedCandle);
    } else {
      selectedCandle = null;
    }
    
    drawChart();
  });
}

// Handle interval button clicks
function setupIntervalButtons() {
  intervalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      intervalBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentInterval = parseInt(btn.dataset.interval);
      chartData = generateChartData(100, currentInterval);
      drawChart();
    });
  });
}

// Handle percentage button clicks
function setupPercentageButtons() {
  percentageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const percent = parseInt(btn.dataset.percent);
      const amount = ((balance * percent) / 100).toFixed(2);
      
      // Update the input of the parent form (buy or sell)
      const parentForm = btn.closest('.trading-column');
      const amountInput = parentForm.querySelector('input[id$="Amount"]');
      const totalInput = parentForm.querySelector('input[id$="Total"]');
      
      if (amountInput && totalInput) {
        amountInput.value = amount;
        totalInput.value = amount;
      }
    });
  });
}

// ====== BUY/SELL FUNCTIONALITY ====== //
// Handle Buy BTC button click
document.querySelector('.buy-btn').addEventListener('click', () => {
    const amount = parseFloat(buyAmount.value);
    const total = parseFloat(buyTotal.value);
  
    if (isNaN(amount)) {
      alert('Please enter a valid BTC amount');
      return;
    }
  
    if (total > balance) {
      alert(`Insufficient balance! Your current balance is $${balance.toFixed(2)}`);
      return;
    }
  
    // Update balance
    balance -= total;
    document.querySelector('.balance-amount').textContent = `$${balance.toFixed(2)}`;
  
    // Update BTC asset
    const btcAsset = assets.find(asset => asset.symbol === 'BTC');
    if (btcAsset) {
      btcAsset.amount += amount;
      btcAsset.value += total;
    } else {
      assets.push({ name: 'Bitcoin', symbol: 'BTC', amount, value: total });
    }
  
    renderAssets();
    alert(`Successfully bought ${amount} BTC for $${total.toFixed(2)}`);
    buyAmount.value = '';
    buyTotal.value = '';
  });
  
  // Handle Sell BTC button click
  document.querySelector('.sell-btn').addEventListener('click', () => {
    const amount = parseFloat(sellAmount.value);
    const total = parseFloat(sellTotal.value);
  
    if (isNaN(amount)) {
      alert('Please enter a valid BTC amount');
      return;
    }
  
    const btcAsset = assets.find(asset => asset.symbol === 'BTC');
    if (!btcAsset || btcAsset.amount < amount) {
      alert(`Insufficient BTC! You have ${btcAsset ? btcAsset.amount.toFixed(8) : 0} BTC`);
      return;
    }
  
    // Update balance
    balance += total;
    document.querySelector('.balance-amount').textContent = `$${balance.toFixed(2)}`;
  
    // Update BTC asset
    btcAsset.amount -= amount;
    btcAsset.value -= total;
  
    if (btcAsset.amount <= 0) {
      const index = assets.findIndex(asset => asset.symbol === 'BTC');
      assets.splice(index, 1);
    }
  
    renderAssets();
    alert(`Successfully sold ${amount} BTC for $${total.toFixed(2)}`);
    sellAmount.value = '';
    sellTotal.value = '';
  });
// Initialize the application
function init() {
  // Generate initial data
  chartData = generateChartData(100, currentInterval);
  
  // Set up event listeners
  setupChartEvents();
  setupIntervalButtons();
  setupPercentageButtons();
  
  // Initial renders
  renderOrderBook();
  renderAssets();
  drawChart();
  
  // Set active interval button
  document.querySelector(`.interval-btn[data-interval="${currentInterval}"]`).classList.add('active');
  
  // Update order book periodically
  setInterval(renderOrderBook, 5000);
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
