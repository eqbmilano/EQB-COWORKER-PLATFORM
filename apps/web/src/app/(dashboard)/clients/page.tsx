import ClientList from "@/components/clients/ClientList";

export default function ClientsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
        <p className="mt-2 text-gray-600">Gestisci tutti i tuoi clienti e le loro informazioni</p>
      </div>

      <ClientList />
    </div>
  );
}
