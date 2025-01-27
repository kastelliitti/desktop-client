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

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path")
const { SerialPort } = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline');

let port;

const createWindow = () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
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

const sendDataToRenderer = (data, renderer) => {
    renderer.send("data-received", data);
}

app.whenReady().then(() => {
    ipcMain.handle("list", () => SerialPort.list());
    ipcMain.handle("select", (event, portPath) => {
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
        parser.on("data", (data) => sendDataToRenderer(data, event.sender));
        console.log("success");
    });
    ipcMain.handle("send", (_event, data) => {
        port.write(data);
    })
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
