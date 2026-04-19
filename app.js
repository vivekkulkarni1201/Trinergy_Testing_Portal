let UPS_LIST = [];

const CORE_BAYS = ["CORE-21", "CORE-22", "CORE-23"];
const STS_BAYS = ["STS TEST", "STS HEATRUN"];
const ALL_BAYS = [...CORE_BAYS, ...STS_BAYS];

const STAGES = {
  T3X: {
    LV: ["LV Testing", "Offset Compensation", "Hi Pot"],
    HV: ["25% Waveforms", "Calibration", "DC Component", "Performance Test", "Short Circuit", "Data Saving"],
    HEATRUN: ["Burn In", "Booster Burn In"]
  },
  T2X: {
    LV: ["LV Testing", "Offset Compensation", "Hi Pot"],
    HV: ["25% Waveforms", "Calibration", "DC Component", "Performance Test", "Short Circuit", "Data Saving"],
    HEATRUN: ["Burn In", "Booster Burn In"]
  },
  TST: {
    STS_TEST: {
      LV: ["LV Testing", "Offset Compensation", "Hi Pot"],
      HV: ["25% Waveforms", "Calibration", "Performance Test", "Data Saving"]
    },
    STS_HEATRUN: {
      HEATRUN: ["Burn In"]
    }
  }
};

function addUPS() {
  let type = document.getElementById("upsType").value;
  if (!type) {
    alert("Select UPS type");
    return;
  }

  let id = "UPS-" + Math.floor(Math.random() * 10000);

  UPS_LIST.push({
    id,
    type,
    bay: null,
    section: null,
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

  // default section/stage after assign
  if (ups.type === "TST") {
    if (bay === "STS TEST") {
      ups.section = "LV";
      ups.stage = STAGES.TST.STS_TEST.LV[0];
    } else if (bay === "STS HEATRUN") {
      ups.section = "HEATRUN";
      ups.stage = STAGES.TST.STS_HEATRUN.HEATRUN[0];
    }
  } else {
    ups.section = "LV";
    ups.stage = STAGES[ups.type].LV[0];
  }

  render();
}

function moveTSTToHeatrun() {
  let id = document.getElementById("stageUpsSelect").value;
  let ups = UPS_LIST.find(u => u.id === id);

  if (!ups) return;

  if (ups.type !== "TST") {
    alert("Only TST can be moved to STS HEATRUN");
    return;
  }

  if (ups.bay !== "STS TEST") {
    alert("TST can be moved only from STS TEST");
    return;
  }

  ups.bay = "STS HEATRUN";
  ups.section = "HEATRUN";
  ups.stage = "Burn In";

  render();
}

function updateStage() {
  let id = document.getElementById("stageUpsSelect").value;
  let section = document.getElementById("sectionSelect").value;
  let stage = document.getElementById("stageSelect").value;

  let ups = UPS_LIST.find(u => u.id === id);
  if (!ups) return;

  if (!section || !stage) {
    alert("Select section and stage");
    return;
  }

  // extra validation for TST
  if (ups.type === "TST") {
    if (ups.bay === "STS TEST" && section === "HEATRUN") {
      alert("TST Burn In is allowed only in STS HEATRUN");
      return;
    }
    if (ups.bay === "STS HEATRUN" && section !== "HEATRUN") {
      alert("In STS HEATRUN, TST can only use HEATRUN section");
      return;
    }
  }

  ups.section = section;
  ups.stage = stage;

  render();
}

function updateDropdowns() {
  let upsSelect = document.getElementById("upsSelect");
  let baySelect = document.getElementById("baySelect");

  let currentUPS = upsSelect.value;

  upsSelect.innerHTML = "";
  UPS_LIST.filter(u => !u.bay).forEach(u => {
    upsSelect.innerHTML += `<option value="${u.id}">${u.id} (${u.type})</option>`;
  });

  if (currentUPS && [...upsSelect.options].some(o => o.value === currentUPS)) {
    upsSelect.value = currentUPS;
  }

  let selectedUPS = UPS_LIST.find(u => u.id === upsSelect.value);

  baySelect.innerHTML = "";

  if (!selectedUPS) {
    baySelect.innerHTML = `<option value="">Select UPS first</option>`;
    return;
  }

  let bays = selectedUPS.type === "TST" ? STS_BAYS : CORE_BAYS;

  bays.forEach(b => {
    baySelect.innerHTML += `<option value="${b}">${b}</option>`;
  });
}

function getAllowedSections(ups) {
  if (!ups) return [];

  if (ups.type === "TST") {
    if (ups.bay === "STS TEST") {
      return ["LV", "HV"];
    }
    if (ups.bay === "STS HEATRUN") {
      return ["HEATRUN"];
    }
    return [];
  }

  return ["LV", "HV", "HEATRUN"];
}

function getAllowedStages(ups, section) {
  if (!ups || !section) return [];

  if (ups.type === "TST") {
    if (ups.bay === "STS TEST") {
      return STAGES.TST.STS_TEST[section] || [];
    }
    if (ups.bay === "STS HEATRUN") {
      return STAGES.TST.STS_HEATRUN[section] || [];
    }
    return [];
  }

  return STAGES[ups.type][section] || [];
}

function updateStageControls() {
  let stageUpsSelect = document.getElementById("stageUpsSelect");
  let sectionSelect = document.getElementById("sectionSelect");

  let currentUPS = stageUpsSelect.value;

  stageUpsSelect.innerHTML = "";

  UPS_LIST.filter(u => u.bay && !u.completed).forEach(u => {
    stageUpsSelect.innerHTML += `<option value="${u.id}">${u.id} (${u.type}) - ${u.bay}</option>`;
  });

  if (currentUPS && [...stageUpsSelect.options].some(o => o.value === currentUPS)) {
    stageUpsSelect.value = currentUPS;
  }

  let ups = UPS_LIST.find(u => u.id === stageUpsSelect.value);

  sectionSelect.innerHTML = `<option value="">Select Section</option>`;

  if (!ups) {
    updateStageDropdown();
    return;
  }

  let allowedSections = getAllowedSections(ups);

  allowedSections.forEach(sec => {
    sectionSelect.innerHTML += `<option value="${sec}">${sec}</option>`;
  });

  if (ups.section && allowedSections.includes(ups.section)) {
    sectionSelect.value = ups.section;
  } else if (allowedSections.length > 0) {
    sectionSelect.value = allowedSections[0];
  }

  updateStageDropdown();
}

function updateStageDropdown() {
  let stageUpsSelect = document.getElementById("stageUpsSelect");
  let section = document.getElementById("sectionSelect").value;
  let stageSelect = document.getElementById("stageSelect");

  let ups = UPS_LIST.find(u => u.id === stageUpsSelect.value);

  stageSelect.innerHTML = "";

  if (!ups || !section) {
    stageSelect.innerHTML = `<option value="">Select section first</option>`;
    return;
  }

  let allowedStages = getAllowedStages(ups, section);

  if (allowedStages.length === 0) {
    stageSelect.innerHTML = `<option value="">No stages available</option>`;
    return;
  }

  allowedStages.forEach(stage => {
    stageSelect.innerHTML += `<option value="${stage}">${stage}</option>`;
  });

  if (ups.stage && allowedStages.includes(ups.stage)) {
    stageSelect.value = ups.stage;
  }
}

function render() {
  document.getElementById("activeCount").innerText =
    UPS_LIST.filter(u => !u.completed).length;

  document.getElementById("completedCount").innerText =
    UPS_LIST.filter(u => u.completed).length;

  updateDropdowns();
  updateStageControls();

  let awaitingDiv = document.getElementById("awaiting");
  awaitingDiv.innerHTML = "";

  UPS_LIST.filter(u => !u.bay).forEach(u => {
    awaitingDiv.innerHTML += `<div class="ups">${u.id} (${u.type})</div>`;
  });

  let baysDiv = document.getElementById("bays");
  baysDiv.innerHTML = "";

  ALL_BAYS.forEach(bay => {
    let html = `<div class="bay"><h3>${bay}</h3>`;

    UPS_LIST.filter(u => u.bay === bay).forEach(u => {
      html += `
        <div class="ups">
          <div><b>${u.id}</b> (${u.type})</div>
          <div>Section: ${u.section || "-"}</div>
          <div>Stage: ${u.stage || "-"}</div>
        </div>`;
    });

    html += "</div>";
    baysDiv.innerHTML += html;
  });
}