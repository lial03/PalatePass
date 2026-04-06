import type { Metadata } from "next";
import { api } from "../../../lib/api";
import UserProfileComponent from "./UserProfile";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = (await params).id;

  try {
    const { profile } = await api.users.profile(id);
    
    return {
      title: `${profile.displayName} | PalatePass`,
      description: profile.bio || `Browse ${profile.displayName}'s favorite restaurant collections and culinary discoveries on PalatePass.`,
      openGraph: {
        images: [profile.avatarUrl || "/og-user.png"],
      },
    };
  } catch {
    return {
      title: "User Profile | PalatePass",
      description: "Discover trusted restaurant reviews and collections.",
    };
  }
}

export default function Page() {
  return <UserProfileComponent />;
}
