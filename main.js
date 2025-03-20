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

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path")
const { SerialPort } = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require("fs");

const dataFields = ["timestamp", "signal_strength", "temp(C)", "pressure(mbar)", "ldr(V)", "voltage(V)", "ax(G)", "ay(G)", "az(G)", "gx(mrad/s)", "gy(mrad/s)", "gz(mrad/s)", "battery_voltage(V)"];

let port;
let fileWriter;

const createWindow = () => {
    const window = new BrowserWindow({
        width: 800,
        height: 700,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#444',
            symbolColor: '#439CEF',
            height: 60
        },
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });
    window.loadFile("index.html");
}

const parseData = data => Intl.NumberFormat('en-US',{ maximumSignificantDigits: 5 }).format(parseFloat(data));

const dataReceived = (data, renderer) => {
    const d = new Date();
    const time = d.toISOString();
    let activeMode = 0;
    let signalStrength = 0;
    let dataFieldValues = [];
    let dataFieldValuesParsed = [];
    if (data.startsWith("PRELAUNCH")) {
        activeMode = 0;
        const rssi = data.split(":")[1];
        signalStrength = parseData(rssi);
    } else if (data.startsWith("STANDBY")) {
        activeMode = 2;
        const rssi = data.split(":")[1];
        signalStrength = parseData(rssi);
    } else if (data.startsWith("LIVE:")) {
        activeMode = 1;
        const parsedData = data.slice(5).split(",");
        signalStrength = parseData(parsedData[0]);
        for (i = 1; i < parsedData.length; i++) {
            if (i == 4 && parseInt(parsedData[4]) == -100) {
                dataFieldValues[i - 1] = 'NOT CONNECTED';
                dataFieldValuesParsed[i - 1] = 'NOT CONNECTED';
            } else if (parsedData[i] != '\r') {
                dataFieldValues[i - 1] = parsedData[i];
                dataFieldValuesParsed[i - 1] = parseData(parsedData[i]);
            }
        }
        if (fileWriter) {
            fileWriter.write(`${time},${signalStrength},${dataFieldValues}\n`);
        }
    }
    renderer.send("data-received", activeMode, signalStrength, dataFieldValuesParsed);
}

const selectPort = (event, portPath, filePath) => {
    console.log(portPath);
    port = new SerialPort({ path: portPath, baudRate: 115200, parity: "none", autoOpen: false });
    port.open((err) => {
        if (err) {
            console.error(err);
            return;
        }
        port.set({
            dtr: false,
            rts: false
        }, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log("Port opened with DTR and RTS disabled");
            }
        });
    });
    const parser = port.pipe(new ReadlineParser({ delimiter: "\n"}));
    parser.on("data", (data) => dataReceived(data, event.sender));
    console.log("success");
    console.log("file path: " + filePath);
    if (filePath) {
        fileWriter = fs.createWriteStream(filePath, {flags: 'w'});
        fileWriter.write(dataFields + '\n');
    }
}

const closePort = () => {
    if (port && port.isOpen) port.close();
    if (fileWriter && fileWriter.isOpen) fileWriter.close();
}

app.whenReady().then(() => {
    ipcMain.handle("list", () => SerialPort.list());
    ipcMain.handle("select", selectPort);
    ipcMain.handle("send", (_event, data) => {
        port.write(data);
    });
    ipcMain.handle("close-port", closePort);
    ipcMain.handle("save-dialog", (event) => {
        const filePath = dialog.showSaveDialogSync(event.sender, {
            filters: [
                {name: "CSV", extensions: ["csv"]}
            ],
            properties: ["createDirectory", "showHiddenFiles", "showOverwriteConfirmation"]
        });
        if (filePath) {
            console.log("Save location chosen: " + filePath);
            return [filePath, path.basename(filePath)];
        } else {
            console.log("No file chosen");
            return [undefined, undefined];
        }
    });
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", closePort);
