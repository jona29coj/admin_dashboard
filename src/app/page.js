import axios from 'axios';
import moment from 'moment-timezone';
import { query } from './db';
import HomeClient from './components/HomeClient';

export default async function Home() {
  const startDateTime = "2025-04-01 00:00:00";
  const endDateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  let energyTracker = 0;
  const EMISSION_FACTOR = 0.82;

  // 1. Fetch energy consumption from external API
  try {
    const response = await axios.get("https://mw.elementsenergies.com/api/mccons", {
      params: { startDateTime, endDateTime },
    });
    energyTracker = response.data.consumption || 0;
  } catch (error) {
    console.error("Error fetching energy tracker:", error);
  }

  // 2. Local DB queries
  const rows = await query('SELECT clients, devices FROM admin', []);
  const clients = rows[0]?.clients || 0;
  const devices = rows[0]?.devices || 0;
  const emissionTracker = parseFloat((energyTracker * EMISSION_FACTOR).toFixed(1));

  const clientPipelineRows = await query('SELECT * FROM clientOtherDetails WHERE id = 1', []);
  const clientPipeline = clientPipelineRows[0];

  const [latestRow] = await query(
    'SELECT timestamp FROM modbus_data ORDER BY timestamp DESC LIMIT 1',
    []
  );

  let alert = null;

  if (latestRow?.timestamp) {
    const last = moment.tz(latestRow.timestamp, 'Asia/Kolkata');
    const now = moment().tz('Asia/Kolkata');
    const minutesDiff = now.diff(last, 'minutes');

    if (minutesDiff > 30) {
      alert = {
        message: '⚠️ Data Missing',
        timestamp: last.format('YYYY-MM-DD HH:mm:ss'),
        gap: `${minutesDiff} min`,
      };
    }
  }

  // 4. Pass all pros including alert
  return (
    <HomeClient
      clients={clients}
      devices={devices}
      energyTracker={energyTracker}
      emissionTracker={emissionTracker}
      clientPipeline={clientPipeline}
      alert={alert} // ✅ NEW
    />
  );
}
