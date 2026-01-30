import AdminStatistics from "@/components/admin/AdminStatistics";
import UserManagement from "@/components/admin/UserManagement";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pannello Admin</h1>
        <p className="mt-2 text-gray-600">Gestione completa del sistema e degli utenti</p>
      </div>

      <div className="space-y-8">
        {/* Statistics Section */}
        <AdminStatistics />

        {/* User Management Section */}
        <UserManagement />
      </div>
    </div>
  );
}
