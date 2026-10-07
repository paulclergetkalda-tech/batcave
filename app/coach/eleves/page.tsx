import { requireCoach } from "@/lib/session";
import { getStudents, STAGES } from "@/lib/coach";
import { AddStudentForm } from "../Forms";
import { StudentSheet } from "./StudentSheet";

export const metadata = { title: "Suivi élèves — Coach Batcav" };
export const dynamic = "force-dynamic";

export default async function ElevesPage() {
  const { supabase } = await requireCoach();
  const rows = await getStudents(supabase);
  return (
    <main className="c-main">
      <h1 className="c-h1">Suivi élèves. <span>Tout au même endroit.</span></h1>
      <AddStudentForm />
      <StudentSheet rows={rows} stages={STAGES} />
    </main>
  );
}
