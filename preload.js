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

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("serialcom", {
    list: () => ipcRenderer.invoke("list"),
    select: (port, filePath) => ipcRenderer.invoke("select", port, filePath),
    dataReceived: (callback) => ipcRenderer.on("data-received", (_event, activeMode, signalStrength, dataFieldValues) => callback(activeMode, signalStrength, dataFieldValues)),
    sendData: (data) => ipcRenderer.invoke("send", data),
    closePort: () => ipcRenderer.invoke("close-port"),
    saveDialog: () => ipcRenderer.invoke("save-dialog")
});