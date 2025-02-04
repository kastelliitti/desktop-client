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

let lastUpdate;

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
        serialcom.select(port);
        document.getElementById("port-selection").style.display = "none";
        document.getElementById("com-view").style.display = "inline";
        document.getElementById("back-btn").style.display = "inline";
    }
}

const sendData = () => {
    const inputField = document.getElementById("input-field");
    const dataToSend = inputField.value;
    inputField.value = "";
    serialcom.sendData(dataToSend);
}

const closePort = () => {
    serialcom.closePort();
    document.getElementById("port-selection").style.display = "inline";
    document.getElementById("com-view").style.display = "none";
    document.getElementById("back-btn").style.display = "none";
    refreshSerialPorts();
}

const clearDataFields = () => {
    const dataFields = ["d-temp", "d-pressure", "d-ldr", "d-voltage", "d-ax", "d-ay", "d-az"];
    for (i in dataFields) {
        document.getElementById(dataFields[i]).innerHTML = "-";
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

const parseData = data => Intl.NumberFormat('en-US',{ maximumSignificantDigits: 5 }).format(parseFloat(data));

serialcom.dataReceived((data) => {
    // document.getElementById("received-view").innerHTML += (data + "</br>");
    lastUpdate = Date.now();
    if (data.startsWith("PRELAUNCH")) {
        setActiveModeButton(0);
        const rssi = data.split(":")[1];
        document.getElementById("d-rssi").innerHTML = parseData(rssi);
        clearDataFields();
    } else if (data.startsWith("STANDBY")) {
        setActiveModeButton(2);
        const rssi = data.split(":")[1];
        document.getElementById("d-rssi").innerHTML = parseData(rssi);
        clearDataFields();
    } else if (data.startsWith("LIVE:")) {
        setActiveModeButton(1);
        const parsedData = data.slice(5).split(",");
        const dataFields = ["d-rssi", "d-temp", "d-pressure", "d-ldr", "d-voltage", "d-ax", "d-ay", "d-az"];
        for (i in dataFields) {
            if (i == 4 && parseInt(parsedData[4]) == -100) {
                document.getElementById("d-voltage").innerHTML = '<span style="color:red;">NOT CONNECTED</span>';
            } else {
                document.getElementById(dataFields[i]).innerHTML = parseData(parsedData[i]);
            }
        }
    }
    
});

document.getElementById("port-select-btn").addEventListener("click", selectPort);
// document.getElementById("send-btn").addEventListener("click", sendData);
document.getElementById("back-btn").addEventListener("click", closePort);
document.getElementById("prelaunch-btn").addEventListener("click", () => setMode(0));
document.getElementById("mission-btn").addEventListener("click", () => setMode(1));
document.getElementById("standby-btn").addEventListener("click", () => setMode(2));

refreshSerialPorts();
setInterval(() => {
    if (lastUpdate) {
        timeSinceUpdate = Math.round((Date.now() - lastUpdate) / 1000);
        if (timeSinceUpdate == 0) {
            document.getElementById("d-updatetime").innerHTML = '<span style="color:green">LIVE</span>';
        } else {
            document.getElementById("d-updatetime").innerHTML = `<span style="color:orange">${timeSinceUpdate} s<span>`;
        }
    }
}, 200);