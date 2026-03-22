const SUPABASE_URL = "https://qubzmqiygyrrstacgyyh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1YnptcWl5Z3lycnN0YWNneXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTc0NDksImV4cCI6MjA4OTczMzQ0OX0.cRHhVSNzl42wJ6bMbEIzQMznB9g9Q4GA0nh0xpWEfQQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentDate = new Date();
let selectedDate = null;
let expensesList = [];

// 🔥 LOAD DATA FROM SUPABASE
async function loadExpenses() {
  const { data, error } = await supabase.from("expenses").select("*");

  if (error) {
    console.error(error);
    return;
  }

  expensesList = data;
  renderCalendar();
  updateDashboard();
  updateChart();
  if (selectedDate) showExpenses();
}

// 📅 CALENDAR
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

// 📌 SELECT DATE
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

// 📋 SHOW EXPENSES
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

// ➕ ADD EXPENSE
async function addExpense() {
  if (!selectedDate) return alert("Select a date first!");

  let name = document.getElementById("name").value.trim();
  let amount = document.getElementById("amount").value;
  let category = document.getElementById("category").value;

  if (!name || !amount) return alert("Enter details");

  const { data, error } = await supabase
    .from("expenses")
    .insert([{ name, amount: Number(amount), category, date: selectedDate }]);

  if (error) {
    alert("Error adding expense");
    return;
  }

  expensesList.push(...data);

  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";

  showExpenses();
  renderCalendar();
  updateDashboard();
  updateChart();

  alert("Added ✅");
}

// 📊 CALCULATIONS
function calculateMonthlyTotal(month, year) {
  return expensesList
    .filter(e => {
      const [y, m] = e.date.split("-").map(Number);
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
  document.getElementById("comparison").innerText =
    diff > 0
      ? `You spent ₹${diff} more`
      : `You saved ₹${Math.abs(diff)}`;
}

// 📈 GRAPH
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
        data: data
      }]
    }
  });
}
window.onload = () => {
  loadExpenses();
};