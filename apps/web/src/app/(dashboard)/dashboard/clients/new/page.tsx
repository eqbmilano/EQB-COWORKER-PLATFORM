import ClientForm from '@/components/clients/ClientForm';

export default function NewClientPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nuovo Cliente</h1>
        <p className="mt-2 text-gray-600">
          Inserisci le informazioni del nuovo cliente
        </p>
      </div>

      <ClientForm />
    </div>
  );
}
