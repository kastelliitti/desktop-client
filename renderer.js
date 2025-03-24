/* Kastelliitti Desktop Client
    Copyright (C) 2025 Kastelliitti

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>. */

const dataFields = ["d-temp", "d-pressure", "d-ldr", "d-voltage", "d-ax", "d-ay", "d-az", "d-gx", "d-gy", "d-gz", "d-battery-v"];

let lastUpdate;
let filePath;
let portStore;

let pastDataValues = [];

const refreshSerialPorts = async () => {
    const selector = document.getElementById("port-selector");
    const serialPorts = await serialcom.list();
    selector.innerHTML = "";
    let option = document.createElement("option");
    option.text = "Select..."
    option.value = "not-selected";
    selector.add(option);
    for (let i = 0; i < serialPorts.length; i++) {
        console.log(serialPorts[i]);
        let option = document.createElement("option");
        option.text = serialPorts[i].friendlyName;
        option.value = serialPorts[i].path;
        selector.add(option);
    }
}

const closePort = () => {
    serialcom.closePort();
    document.getElementById("com-view").style.display = "none";
    document.getElementById("back-btn").style.display = "none";
    document.getElementById("file-selection-file-name").innerHTML = "No file selected";
    filePath = undefined;
    startWizard(true);
    document.getElementById("start-view").style.display = "";
}

const showStartView = (viewName) => {
    const startViews = document.getElementById("start-view").children;
    for (view of startViews) {
        view.style.display = "none";
    }
    document.getElementById("start-" + viewName).style.display = "";
}

const clearDataFields = () => {
    for (i in dataFields) {
        document.getElementById(dataFields[i]).innerHTML = "-";
    }
}

const saveDialog = async () => {
    const [fullPath, baseName] = await serialcom.saveDialog();
    if (fullPath) {
        filePath = fullPath;
        document.getElementById("file-selection-file-name").innerHTML = baseName;
    }
}

const setActiveModeButton = (activeBtn) => {
    let modeButtons = [
        document.getElementById("prelaunch-btn"),
        document.getElementById("mission-btn"),
        document.getElementById("standby-btn")
    ];
    for (let x of modeButtons) {
        x.classList.remove("active");
    }
    modeButtons[activeBtn].classList.add("active");
    modeButtons[activeBtn].classList.remove("wait");
}

const setMode = (newMode) => {
    switch (newMode) {
        case 0:
            document.getElementById("prelaunch-btn").classList.add("wait");
            serialcom.sendData("0");
            break;
        case 1:
            document.getElementById("mission-btn").classList.add("wait");
            serialcom.sendData("1");
            break;
        case 2:
            document.getElementById("standby-btn").classList.add("wait");
            serialcom.sendData("2");
            break;
    }
}

const updateInterval = () => {
    const newInterval = parseInt(document.getElementById("interval-input").value);
    document.getElementById("interval-input").value = "";
    if (newInterval != NaN && newInterval >= 50 && newInterval <= 10000) {
        serialcom.sendData(newInterval.toString());
    }
}

const addDefaultEventListeners = () => {
    document.getElementById("start-detected-select-manually-btn").addEventListener("click", showManualSelect);
    document.getElementById("start-not-detected-select-manually-btn").addEventListener("click", showManualSelect);
    document.getElementById("start-retry-port").addEventListener("click", showDetectScreen);
    document.getElementById("port-select-btn").addEventListener("click", () => selectPort(document.getElementById("port-selector").value));
    document.getElementById("port-refresh-btn").addEventListener("click", refreshSerialPorts);
    document.getElementById("file-create-browse").addEventListener("click", saveDialog);
    document.getElementById("start-finish-btn").addEventListener("click", finishWizard);
    document.getElementById("back-btn").addEventListener("click", closePort);
    document.getElementById("prelaunch-btn").addEventListener("click", () => setMode(0));
    document.getElementById("mission-btn").addEventListener("click", () => setMode(1));
    document.getElementById("standby-btn").addEventListener("click", () => setMode(2));
    document.getElementById("interval-input-btn").addEventListener("click", updateInterval);
    document.getElementById("interval-input").addEventListener("keydown", (e) => {if (e.key == "Enter") updateInterval()});
}

const selectPort = (port) => {
    showStartView("file-create");
    portStore = port;
}

const startWizard = (skipWelcome = false) => {
    if (skipWelcome) {
        showDetectScreen();
    } else {
        showStartView("welcome");
        setTimeout(showDetectScreen, 1500);
    }
}

const showDetectScreen = async () => {
    const portsAvailable = await serialcom.list();
    for (let i = 0; i < portsAvailable.length; i++) {
        if (portsAvailable[i].vendorId == "10C4" && portsAvailable[i].productId == "EA60") {
            document.getElementById("start-detected-port").innerHTML = portsAvailable[i].path;
            document.getElementById("start-continue-port").addEventListener("click", () => selectPort(portsAvailable[i].path));
            showStartView("detected");
            return;
        }
    }
    showStartView("not-detected");
}

const showManualSelect = () => {
    showStartView("manual-select");
    refreshSerialPorts();
}

const finishWizard = () => {
    if (portStore && portStore != "not-selected") {
        serialcom.select(portStore, filePath);
        document.getElementById("start-view").style.display = "none";
        document.getElementById("com-view").style.display = "";
        document.getElementById("back-btn").style.display = "";
    }
}

const plotValues = (canvasId, dataFieldId, numToPlot, maxVal, minVal = 0) => {
    const ctx = document.getElementById(canvasId).getContext("2d");
    const valsToPlot = pastDataValues[dataFieldId].slice(-numToPlot);
    const canvasWidth = 200;
    const canvasHeight = 100;
    ctx.clearRect(0, 0, 200, 100);
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight - (valsToPlot[0] * (canvasHeight / maxVal) - minVal));
    for (let i = 1; i < numToPlot; i++) {
        ctx.lineTo(i * (canvasWidth / numToPlot), canvasHeight - (valsToPlot[i] * (canvasHeight / maxVal) - minVal));
    }
    ctx.stroke();
}

serialcom.dataReceived((activeMode, signalStrength, dataFieldValues, dataFieldValuesRaw) => {
    lastUpdate = Date.now();
    setActiveModeButton(activeMode);
    document.getElementById("d-rssi").innerHTML = signalStrength;
    if (activeMode == 1) {
        console.log(dataFieldValues);
        for (i in dataFields) {
            document.getElementById(dataFields[i]).innerHTML = dataFieldValues[i];
            if (pastDataValues[i]) {
                pastDataValues[i].push(dataFieldValuesRaw[i]);
            } else {
                pastDataValues[i] = [dataFieldValuesRaw[i]];
            }
        }
        plotValues("d-temp-canvas", 0, 20, 50, -50);
        plotValues("d-pressure-canvas", 1, 20, 1500);
        plotValues("d-ldr-canvas", 2, 20, 5000);
    } else {
        clearDataFields();
    }
});


refreshSerialPorts();
addDefaultEventListeners();
startWizard();


setInterval(() => {
    if (lastUpdate) {
        timeSinceUpdate = Math.round((Date.now() - lastUpdate) / 1000);
        if (timeSinceUpdate == 0) {
            document.getElementById("d-updatetime").innerHTML = '<span style="color:lightgreen">LIVE</span>';
        } else {
            document.getElementById("d-updatetime").innerHTML = `<span style="color:orange">${timeSinceUpdate} s<span>`;
        }
    }
}, 200);