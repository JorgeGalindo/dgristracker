import { getAlerts } from "../../lib/alerts.js";
import RioClient from "./RioClient";

export const revalidate = 600;

export default async function RioPage() {
  const data = await getAlerts();
  return <RioClient data={data} />;
}
