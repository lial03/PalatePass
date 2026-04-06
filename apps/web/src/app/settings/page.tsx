import type { Metadata } from "next";
import SettingsPage from "./SettingsComponent";

export const metadata: Metadata = {
  title: "Aesthetic Settings | PalatePass",
  description: "Customize your modern epicurean profile, update your avatar with Cloudinary, and manage your culinary lens.",
};

export default function Page() {
  return <SettingsPage />;
}
