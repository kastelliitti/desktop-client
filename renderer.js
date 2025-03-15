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

const dataFields = ["d-temp", "d-pressure", "d-ldr", "d-voltage", "d-ax", "d-ay", "d-az"]

let lastUpdate;
let filePath;

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

const selectPort = () => {
    const port = document.getElementById("port-selector").value;
    if (port !== "not-selected") {
        serialcom.select(port, filePath);
        document.getElementById("port-selection").style.display = "none";
        document.getElementById("com-view").style.display = "inline";
        document.getElementById("back-btn").style.display = "inline";
    }
}

const closePort = () => {
    serialcom.closePort();
    document.getElementById("port-selection").style.display = "";
    document.getElementById("com-view").style.display = "none";
    document.getElementById("back-btn").style.display = "none";
    document.getElementById("file-selection-file-name").innerHTML = "No file selected";
    filePath = undefined;
    refreshSerialPorts();
}

const clearDataFields = () => {
    const dataFields = ["d-temp", "d-pressure", "d-ldr", "d-voltage", "d-ax", "d-ay", "d-az"];
    for (i in dataFields) {
        document.getElementById(dataFields[i]).innerHTML = "-";
    }
}

const saveDialog = async () => {
    const [fullPath, baseName] = await serialcom.saveDialog();
    filePath = fullPath;
    document.getElementById("file-selection-file-name").innerHTML = baseName;
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

serialcom.dataReceived((activeMode, signalStrength, dataFieldValues) => {
    lastUpdate = Date.now();
    setActiveModeButton(activeMode);
    document.getElementById("d-rssi").innerHTML = signalStrength;
    if (activeMode == 1) {
        console.log(dataFieldValues);
        for (i in dataFields) {
            document.getElementById(dataFields[i]).innerHTML = dataFieldValues[i];
        }
    }    
});

document.getElementById("port-select-btn").addEventListener("click", selectPort);
document.getElementById("port-refresh-btn").addEventListener("click", refreshSerialPorts);
document.getElementById("file-create-browse").addEventListener("click", saveDialog);
document.getElementById("back-btn").addEventListener("click", closePort);
document.getElementById("prelaunch-btn").addEventListener("click", () => setMode(0));
document.getElementById("mission-btn").addEventListener("click", () => setMode(1));
document.getElementById("standby-btn").addEventListener("click", () => setMode(2));
document.getElementById("interval-input-btn").addEventListener("click", () => updateInterval);
document.getElementById("interval-input").addEventListener("keydown", (e) => {if (e.key == "Enter") updateInterval()});

refreshSerialPorts();
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