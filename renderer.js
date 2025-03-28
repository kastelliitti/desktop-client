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

let valsToPlotSetting = 50;
let weather = {
    temperature : 198.15,
    pressure    : 1013.15
}

let pastDataValues = [];
let pastAltitudeValues = [];

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

const updateValsToPlot = () => {
    const inputField = document.getElementById("valstoplot-input")
    let inputVal = parseInt(inputField.value);
    if (inputVal > 5 && inputVal < 2000) {
        valsToPlotSetting = inputVal;
    }
}

const updateTemperatureConstant = () => {
    const inputField = document.getElementById("weather-temp-input");
    const inputInt = parseFloat(inputField.value);
    if (inputInt > 0) {
        weather.temperature = inputInt;
    }
}

const updatePressureConstant = () => {
    const inputField = document.getElementById("weather-pressure-input");
    const inputInt = parseFloat(inputField.value);
    if (inputInt > 0) {
        weather.pressure = inputInt;
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
    document.getElementById("valstoplot-input-btn").addEventListener("click", updateValsToPlot);
    document.getElementById("weather-temp-input-btn").addEventListener("click", updateTemperatureConstant);
    document.getElementById("weather-pressure-input-btn").addEventListener("click", updatePressureConstant);
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
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    let valsToPlot;
    if (dataFieldId != 5000) {
        valsToPlot = pastDataValues[dataFieldId].slice(-numToPlot);
    } else {
        valsToPlot = pastAltitudeValues.slice(-numToPlot);
    }
    
    const aWidth = canvas.width - 50;
    const aHeight = canvas.height;
    const range = maxVal - minVal;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    ctx.font = "18px Arial";
    ctx.fillText(maxVal, aWidth, 20);
    ctx.fillText((maxVal + minVal) / 2, aWidth, aHeight / 2 + 9)
    ctx.fillText(minVal, aWidth, aHeight - 2);
    ctx.strokeStyle = "darkslategray";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (aHeight / 10));
        ctx.lineTo(aWidth, i * (aHeight / 10));
        ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (aWidth / 10), 0);
        ctx.lineTo(i * (aWidth / 10), aHeight);
        ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(0, aHeight - ((valsToPlot[0] - minVal) * (aHeight / range)));
    for (let i = 1; i < numToPlot; i++) {
        if (canvasId == "d-temp-canvas") {
            console.log("Drawing line to x=" + (i * (aWidth / numToPlot)) + ", y=" + (aHeight - ((valsToPlot[i] - minVal) * (aHeight / range))));
        }
        ctx.lineTo(i * (aWidth / numToPlot), aHeight - ((valsToPlot[i] - minVal) * (aHeight / range)));
    }
    ctx.stroke();
}

const plot3DValues = (canvasId, xComponent, yComponent, zComponent, numToPlot, maxVal, minVal = 0) => {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const xVals = pastDataValues[xComponent].slice(-numToPlot);
    const yVals = pastDataValues[yComponent].slice(-numToPlot);
    const zVals = pastDataValues[zComponent].slice(-numToPlot);
    const aWidth = canvas.width - 50;
    const aHeight = canvas.height;
    const range = maxVal - minVal;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    ctx.font = "18px Arial";
    ctx.fillText(maxVal, aWidth, 20);
    ctx.fillText((maxVal + minVal) / 2, aWidth, aHeight / 2 + 9)
    ctx.fillText(minVal, aWidth, aHeight - 2);
    ctx.strokeStyle = "darkslategray";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (aHeight / 10));
        ctx.lineTo(aWidth, i * (aHeight / 10));
        ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (aWidth / 10), 0);
        ctx.lineTo(i * (aWidth / 10), aHeight);
        ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(0, aHeight - ((xVals[0] - minVal) * (aHeight / range)));
    for (let i = 1; i < numToPlot; i++) {
        ctx.lineTo(i * (aWidth / numToPlot), aHeight - ((xVals[i] - minVal) * (aHeight / range)));
    }
    ctx.stroke();
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(0, aHeight - ((yVals[0] - minVal) * (aHeight / range)));
    for (let i = 1; i < numToPlot; i++) {
        ctx.lineTo(i * (aWidth / numToPlot), aHeight - ((yVals[i] - minVal) * (aHeight / range)));
    }
    ctx.stroke();
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(0, aHeight - ((zVals[0] - minVal) * (aHeight / range)));
    for (let i = 1; i < numToPlot; i++) {
        ctx.lineTo(i * (aWidth / numToPlot), aHeight - ((zVals[i] - minVal) * (aHeight / range)));
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
        let altitudeApprox = (weather.temperature / 0.0065) * (1 - Math.pow(dataFieldValuesRaw[1] / weather.pressure, 0.1903));
        document.getElementById("d-altitude").innerHTML = altitudeApprox;
        pastAltitudeValues.push(altitudeApprox);
        plotValues("d-temp-canvas", 0, valsToPlotSetting, 50, -50);
        plotValues("d-pressure-canvas", 1, valsToPlotSetting, 1500);
        plotValues("d-altitude-canvas", 5000, valsToPlotSetting, 1300, 30, -5);
        plotValues("d-ldr-canvas", 2, valsToPlotSetting, 5000);
        plotValues("d-voltage-canvas", 3, valsToPlotSetting, 0.001, -0.001);
        plot3DValues("d-acceleration-canvas", 4, 5, 6, valsToPlotSetting, 2, -2);
        plot3DValues("d-gyro-canvas", 7, 8, 9, valsToPlotSetting, 300, -300);
        plotValues("d-battery-canvas", 10, valsToPlotSetting, 2, 0);
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