import type { Metadata } from "next";
import { api } from "../../../lib/api";
import ListDetailComponent from "./ListDetail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = (await params).id;

  try {
    const res = await api.lists.get(id);
    const list = res.list;
    
    return {
      title: `${list.name} | PalatePass Collections`,
      description: list.description || `Explore this curated collection of ${list.items.length} restaurants by ${list.user.displayName} on PalatePass.`,
      openGraph: {
        images: ["/og-collection.png"],
      },
    };
  } catch {
    return {
      title: "Collection | PalatePass",
      description: "Discover trusted restaurant reviews and collections.",
    };
  }
}

export default function Page() {
  return <ListDetailComponent />;
}
