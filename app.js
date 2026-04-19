let UPS_LIST = [];

const CORE_BAYS = ["CORE-21", "CORE-22", "CORE-23"];
const STS_BAYS = ["STS TEST", "STS HEATRUN"];

function addUPS() {
  let type = document.getElementById("upsType").value;
  if (!type) return alert("Select UPS type");

  let id = "UPS-" + Math.floor(Math.random() * 10000);

  UPS_LIST.push({
    id,
    type,
    bay: null,
    stage: null,
    completed: false
  });

  render();
}

function assignBay() {
  let id = document.getElementById("upsSelect").value;
  let bay = document.getElementById("baySelect").value;

  let ups = UPS_LIST.find(u => u.id === id);
  if (!ups) return;

  if (ups.type === "TST" && !STS_BAYS.includes(bay)) {
    alert("TST → only STS bays");
    return;
  }

  if ((ups.type === "T3X" || ups.type === "T2X") && !CORE_BAYS.includes(bay)) {
    alert("T3X/T2X → only CORE bays");
    return;
  }

  ups.bay = bay;
  ups.stage = "LV Testing";

  render();
}

function updateDropdowns() {
  let upsSelect = document.getElementById("upsSelect");
  let baySelect = document.getElementById("baySelect");

  upsSelect.innerHTML = "";
  UPS_LIST.filter(u => !u.bay).forEach(u => {
    upsSelect.innerHTML += `<option value="${u.id}">${u.id} (${u.type})</option>`;
  });

  let selectedUPS = UPS_LIST.find(u => u.id === upsSelect.value);

  baySelect.innerHTML = "";

  if (!selectedUPS) return;

  let bays = selectedUPS.type === "TST" ? STS_BAYS : CORE_BAYS;

  bays.forEach(b => {
    baySelect.innerHTML += `<option value="${b}">${b}</option>`;
  });
}

function render() {
  document.getElementById("activeCount").innerText =
    UPS_LIST.filter(u => !u.completed).length;

  document.getElementById("completedCount").innerText =
    UPS_LIST.filter(u => u.completed).length;

  updateDropdowns();

  let awaitingDiv = document.getElementById("awaiting");
  awaitingDiv.innerHTML = "";

  UPS_LIST.filter(u => !u.bay).forEach(u => {
    awaitingDiv.innerHTML += `
      <div class="ups">${u.id} (${u.type})</div>`;
  });

  let baysDiv = document.getElementById("bays");
  baysDiv.innerHTML = "";

  [...CORE_BAYS, ...STS_BAYS].forEach(bay => {
    let html = `<div class="bay"><h3>${bay}</h3>`;

    UPS_LIST.filter(u => u.bay === bay).forEach(u => {
      html += `<div class="ups">${u.id} - ${u.stage}</div>`;
    });

    html += "</div>";
    baysDiv.innerHTML += html;
  });
}