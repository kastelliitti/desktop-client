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
    refreshSerialPorts();
}

serialcom.dataReceived((data) => {
    document.getElementById("received-view").innerHTML += (data + "</br>");
});

document.getElementById("port-select-btn").addEventListener("click", selectPort);
document.getElementById("send-btn").addEventListener("click", sendData);
document.getElementById("back-btn").addEventListener("click", closePort);

refreshSerialPorts();