import { Redirect } from 'expo-router';

export default function EquipmentTab() {
  // Reuse the existing screen under /equipment for the tab route
  return <Redirect href="/equipment" />;
}
