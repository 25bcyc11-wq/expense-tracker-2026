let currentDate = new Date();
let selectedDate = null;
let expensesList = []; // Array of DB records

// Load expenses from backend API
async function loadExpenses() {
  try {
    const res = await fetch("/api/expenses");
    if (!res.ok) throw new Error("Failed to load expenses");
    expensesList = await res.json();
    renderCalendar();
    updateDashboard();
    updateChart();
    if (selectedDate) showExpenses();
  } catch (error) {
    console.error("Error loading expenses:", error);
  }
}

function renderCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById("monthYear").innerText =
    currentDate.toLocaleString("default", { month: "long" }) + " " + year;

  let daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    let day = document.createElement("div");
    day.innerText = i;

    // Highlight days with expenses
    let dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    let hasExpense = expensesList.some(e => e.date === dateStr);
    if (hasExpense) {
      day.style.fontWeight = "bold";
      day.style.borderBottom = "2px solid #5a3e36";
    }

    day.onclick = (e) => selectDate(i, e);
    calendar.appendChild(day);
  }
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  updateDashboard();
  updateChart();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  updateDashboard();
  updateChart();
}

function selectDate(day, event) {
  let year = currentDate.getFullYear();
  let month = String(currentDate.getMonth() + 1).padStart(2, '0');
  let dayStr = String(day).padStart(2, '0');
  selectedDate = `${year}-${month}-${dayStr}`;

  document.getElementById("selectedDate").innerText = "Date: " + selectedDate;

  document.querySelectorAll(".calendar div").forEach(d => d.classList.remove("selected"));
  event.target.classList.add("selected");

  showExpenses();
}

function showExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  if (!selectedDate) return;

  const dayExpenses = expensesList.filter(e => e.date === selectedDate);
  dayExpenses.forEach(exp => {
    let li = document.createElement("li");
    li.style.listStyle = "none";
    li.style.padding = "5px 0";
    li.style.borderBottom = "1px solid #d5bdaf";
    li.innerText = `${exp.category} - ${exp.name}: ₹${exp.amount}`;
    list.appendChild(li);
  });

  if (dayExpenses.length === 0) {
    list.innerHTML = "<li style='list-style:none; color:#888;'>No expenses for this date.</li>";
  }
}

async function addExpense() {
  if (!selectedDate) return alert("Select a date first!");

  let name = document.getElementById("name").value.trim();
  let amount = document.getElementById("amount").value;
  let category = document.getElementById("category").value;

  if (!name || !amount) return alert("Please enter name and amount.");

  try {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: Number(amount), category, date: selectedDate })
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.error || "Failed to add expense");
    }

    // API returns an array of inserted rows
    if (Array.isArray(responseData)) {
      expensesList.push(...responseData);
    } else {
      expensesList.push(responseData);
    }

    document.getElementById("name").value = "";
    document.getElementById("amount").value = "";

    showExpenses();
    renderCalendar();
    updateDashboard();
    updateChart();

    alert("Expense added successfully!");
  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  }
}

function calculateMonthlyTotal(month, year) {
  return expensesList
    .filter(e => {
      const parts = e.date.split("-");
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return m === (month + 1) && y === year;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

function updateDashboard() {
  let month = currentDate.getMonth();
  let year = currentDate.getFullYear();

  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }

  let current = calculateMonthlyTotal(month, year);
  let prev = calculateMonthlyTotal(prevMonth, prevYear);

  document.getElementById("currentTotal").innerText = current;
  document.getElementById("prevTotal").innerText = prev;

  let diff = current - prev;
  let text = diff > 0
    ? `You spent ₹${diff} more than last month`
    : `You saved ₹${Math.abs(diff)}`;

  document.getElementById("comparison").innerText = text;
}

let chart;
function updateChart() {
  let data = [];
  const year = currentDate.getFullYear();
  for (let i = 0; i < 12; i++) {
    data.push(calculateMonthlyTotal(i, year));
  }

  if (chart) chart.destroy();

  let ctx = document.getElementById("chart");
  if (!ctx) return;

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets: [{
        label: `Monthly Expenses (${year})`,
        data: data,
        backgroundColor: "#d5bdaf"
      }]
    }
  });
}

// Initialize application
loadExpenses();
