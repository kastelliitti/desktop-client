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

serialcom.dataReceived((data) => {
    // document.getElementById("received-view").innerHTML += (data + "</br>");
    let parsedData = data.split(",");
    document.getElementById("d-temp").innerHTML = parsedData[0];
    document.getElementById("d-pressure").innerHTML = parsedData[1];
    document.getElementById("d-ldr").innerHTML = parsedData[2];
    document.getElementById("d-ax").innerHTML = parsedData[3];
    document.getElementById("d-ay").innerHTML = parsedData[4];
    document.getElementById("d-az").innerHTML = parsedData[5];
});

document.getElementById("port-select-btn").addEventListener("click", selectPort);
// document.getElementById("send-btn").addEventListener("click", sendData);
document.getElementById("back-btn").addEventListener("click", closePort);

refreshSerialPorts();