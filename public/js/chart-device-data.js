

/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of telemetry for a device
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.maxLen = 50;
      this.timeData = new Array(this.maxLen);
      this.Sns1Data = new Array(this.maxLen);
      this.Sns2Data = new Array(this.maxLen);
      this.Sns3Data = new Array(this.maxLen);
      
    }

    addData(time, Sensor_1, Sensor_2, Sensor_3) {
      this.timeData.push(time);
      this.Sns1Data.push(Sensor_1);
      this.Sns2Data.push(Sensor_2);
      this.Sns3Data.push(Sensor_3);
      let data;
      for(let i = 0; i <= 50; i++) {
        data = document.getElementById("s1").textContent = this.Sns1Data[i];
        data = document.getElementById("s2").textContent = this.Sns2Data[i];
        data = document.getElementById("s3").textContent = this.Sns3Data[i];
        
      }
      
      /* if(this.Sns1Data <= 45) {
        document.getElementById("msg1").textContent = "CUIDADO! PRÓXIMO DE BATER";
      }
      else document.getElementById("msg1").textContent = ""; */
      
      
      
      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.Sns1Data.shift();
        this.Sns2Data.shift();
        this.Sns3Data.shift();
      }
      
      
    }
   
    
  }
  

  // All the devices in the list (those that have been sending telemetry)
  class TrackedDevices {
    constructor() {
      this.devices = [];
      
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }


    getDevicesCount() {
      
      return this.devices.length;
    }
    
  }

  
  const trackedDevices = new TrackedDevices();

  // Define the chart axes
  const chartData = {
    datasets: [
      {
        fill: false,
        label: 'Sensor_1',
        yAxisID: 'Sensor_1',
        borderColor: 'rgba(255, 204, 0, 1)',
        pointBoarderColor: 'rgba(255, 204, 0, 1)',
        backgroundColor: 'rgba(255, 204, 0, 0.4)',
        pointHoverBackgroundColor: 'rgba(255, 204, 0, 1)',
        pointHoverBorderColor: 'rgba(255, 204, 0, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Sensor_2',
        yAxisID: 'Sensor_2',
        borderColor: 'rgba(24, 120, 240, 1)',
        pointBoarderColor: 'rgba(24, 120, 240, 1)',
        backgroundColor: 'rgba(24, 120, 240, 0.4)',
        pointHoverBackgroundColor: 'rgba(24, 120, 240, 1)',
        pointHoverBorderColor: 'rgba(24, 120, 240, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Sensor_3',
        yAxisID: 'Sensor_3',
        borderColor: 'rgba(255, 0, 0, 1)',
        pointBoarderColor: 'rgba(255, 0, 0, 1)',
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        pointHoverBackgroundColor: 'rgba(255, 0, 0, 1)',
        pointHoverBorderColor: 'rgba(255, 0, 0, 1)',
        spanGaps: true,
      }
    ]
  };

  const chartOptions = {
    scales: {
      yAxes: [{
        id: 'Sensor_1',
        type: 'linear',
        scaleLabel: {
          labelString: 'Sensor 1 (cm)',
          display: true,
        },
        position: 'left',
      },
      {
        id: 'Sensor_2',
        type: 'linear',
        scaleLabel: {
          labelString: 'Sensor 2 (cm)',
          display: true,
        },
        position: 'right',
      },
      {
        id: 'Sensor_3',
        type: 'linear',
        scaleLabel: {
          labelString: 'Sensor 3 (cm)',
          display: true,
        },
        position: 'left',
      }
    ]
    }
  };

  // Get the context of the canvas element we want to select
  /* const ctx = document.getElementById('iotChart').getContext('2d'); */
  /* const myLineChart = new Chart(
    ctx,
    {
      type: 'line',
      data: chartData,
      options: chartOptions,
    }); */

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById('deviceCount');
  const listOfDevices = document.getElementById('listOfDevices');
  function OnSelectionChange() {
    const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
    chartData.labels = device.timeData;
    chartData.datasets[0].data = device.Sns1Data;
    chartData.datasets[1].data = device.Sns2Data;
    chartData.datasets[2].data = device.Sns3Data;
   /*  myLineChart.update(); */
  }
  listOfDevices.addEventListener('change', OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and temperature
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);

      // time and either temperature or humidity are required
      if (!messageData.MessageDate || (!messageData.IotData.Sensor_1 && !messageData.IotData.Sensor_2 && !messageData.IotData.Sensor_3)) {
        return;
      }

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);
      console.log(existingDeviceData);

      if (existingDeviceData) {
        existingDeviceData.addData(messageData.MessageDate, messageData.IotData.Sensor_1, messageData.IotData.Sensor_2, messageData.IotData.Sensor_3);
      } else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText = numDevices === 1 ? `${numDevices} Dispositivo` : `${numDevices} Dispositivos`;
        newDeviceData.addData(messageData.MessageDate, messageData.IotData.Sensor_1, messageData.IotData.Sensor_2, messageData.IotData.Sensor_3);

        // add device to the UI list
        const node = document.createElement('option');
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }

      /* myLineChart.update(); */
    } catch (err) {
      console.error(err);
    }
  };

  
});
