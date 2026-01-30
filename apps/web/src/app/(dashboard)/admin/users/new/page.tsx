import NewUserForm from "@/components/admin/NewUserForm";

export default function NewUserPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nuovo Utente</h1>
        <p className="mt-2 text-gray-600">Crea un nuovo account utente nel sistema</p>
      </div>

      <NewUserForm />
    </div>
  );
}
