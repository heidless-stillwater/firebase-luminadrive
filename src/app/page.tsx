import { FileManager } from "@/components/file-manager";
import { files as initialFiles } from "@/lib/data";

export default function Home() {
  return (
    <main>
      <FileManager initialFiles={initialFiles} />
    </main>
  );
}
