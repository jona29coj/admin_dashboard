'use client';

import MapClientWrapper from './MapClientWrapper';

export default function HomeClient({
  clients,
  devices,
  energyTracker,
  emissionTracker,
  clientPipeline,
  alert
}) {
  const capitalizeWords = (str) =>
    str ? str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  const getStatus = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-yellow-400';
      case 'not started': return 'bg-red-400';
      default: return 'bg-red-400';
    }
  };

  const getProgressValue = (pipeline) => {
    let completed = 0;
    if (pipeline.site_visit_status === 'completed') completed++;
    if (pipeline.installation_status === 'completed') completed++;
    if (pipeline.testing_status === 'completed') completed++;
    if (pipeline.handover_status === 'completed') completed++;
    return (completed / 4) * 100;
  };

  return (
    <div className="flex flex-col p-2 gap-2 h-full">
      <div className="grid grid-cols-4 bg-white w-full p-5 rounded-md">
        <div className="flex flex-col border-r border-gray-300 justify-center items-center">
          <h1 className="text-black text-lg">Clients</h1>
          <p className="text-black font-bold text-xl">{clients}</p>
        </div>
        <div className="flex flex-col border-r border-gray-300 justify-center items-center">
          <h1 className="text-black text-lg">Devices</h1>
          <p className="text-black font-bold text-xl">{devices}</p>
        </div>
        <div className="flex flex-col border-r border-gray-300 justify-center items-center">
          <h1 className="text-black text-lg">Energy Tracker</h1>
          <p className="text-black font-bold text-xl">{energyTracker} kWh</p>
        </div>
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-black text-lg">Emission Tracker</h1>
          <p className="text-black font-bold text-xl">{emissionTracker} kg CO₂</p>
        </div>
      </div>

      <div className="flex gap-2 flex-1">
        {/* Left Half - Map + Active Users */}
        <div className="flex flex-col gap-2 w-1/2 h-full">
          <div className="w-full flex-1 bg-white rounded-md overflow-hidden shadow border">
            <MapClientWrapper />
          </div>

          <div className="flex gap-2 w-full">
  <div className="flex flex-row bg-white p-6 rounded-md w-full justify-center items-center gap-4">
    <img src="/images/users.png" alt="Active Sessions" className="w-12 h-12" />
    <div className="flex flex-col justify-center">
      <h1 className="text-xl text-black">Active Users</h1>
      <p className="text-xl font-bold text-black text-center">0</p>
    </div>
  </div>
</div>

        </div>

        {/* Right Half - Alerts and Client Pipeline side-by-side */}
        <div className="flex gap-2 w-1/2 h-full text-black">
          {/* Alerts Column */}
          <div className="w-1/2 bg-white rounded-md shadow flex flex-col">
  <h1 className="text-xl font-bold px-5 pt-5 mb-4">Alerts</h1>

  <div className="flex-1 px-5 pb-5">
    {alert ? (
      <div className="bg-red-50 text-red-700 border border-red-300 rounded-md p-4 space-y-2">
        <div className="text-lg font-semibold flex items-center gap-2">
          {alert.message}
        </div>
        <div className="text-sm">
          <strong>Client:</strong> Metalware
        </div>
        <div className="text-sm">
          <strong>Last Record:</strong> {alert.timestamp}
        </div>
        <div className="text-sm">
          <strong>Gap:</strong> {alert.gap}
        </div>
      </div>
    ) : (
      <div className="bg-green-50 text-green-700 text-sm p-4 rounded-md border border-dashed border-green-300 text-center">
        ✅ No alerts at the moment
      </div>
    )}
  </div>
</div>



          {/* Client Pipeline Column */}
          <div className="w-1/2 bg-white rounded-md shadow flex flex-col">
            <h1 className="text-xl font-bold p-5">Client Pipeline</h1>
            <div className="border border-gray-300 bg-white rounded-md p-4 mx-4 flex-1">
              <h1 className="font-medium mb-3">{clientPipeline.client_name}</h1>
              <progress
                value={getProgressValue(clientPipeline)}
                max="100"
                className="w-full h-2 mb-3 [&::-webkit-progress-bar]:rounded-md [&::-webkit-progress-value]:rounded-md [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-blue-500"
              />
              <div className="space-y-2">
                {['site_visit_status', 'installation_status', 'testing_status', 'handover_status'].map(status => (
                  <div key={status} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getStatus(clientPipeline[status])}`}></div>
                    <span className="text-sm">
                      {capitalizeWords(status.replace('_status', '').replace('_', ' '))}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {capitalizeWords(clientPipeline[status])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
